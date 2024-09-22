<?php

namespace App\Traits;
use Illuminate\Http\Request;  // Ensure this is the correct path to the Request class
use \Illuminate\Http\Response;
use SimpleXMLElement;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

trait DynamicModelTrait {
    protected $model;
    protected $tableSchema;
    protected $relatedModel = []; // Array to store related model information

    protected $mrelatedModel= []; // Array to store related model information

    public function initializeDynamicModelTrait($model, $schemaFilePath) {
        $this->model = $model;
        $this->loadModelSchema($schemaFilePath);
    }

    protected function loadModelSchema($schemaFilePath) {
        if (!file_exists($schemaFilePath)) {
            throw new \Exception("Schema file not found: {$schemaFilePath}");
        }

        $xml = simplexml_load_file($schemaFilePath);
        if ($xml === false) {
            throw new \Exception("Failed to load XML file: {$schemaFilePath}");
        }

        $this->tableSchema = [];
        foreach ($xml->column as $column) {
            $colData = [
                'name' => (string)$column['name'],
                'type' => (string)$column['type'],
                'required' => ((string)$column['required']) === 'true',
                'default' => isset($column['default']) ? (string)$column['default'] : null,
            ];
            $this->tableSchema[] = $colData;
        }

        if (isset($xml->relatedTable)) {
            foreach ($xml->relatedTable as $relatedTable) {
                $relatedTableName = (string)$relatedTable['name'];
                $this->relatedModel[$relatedTableName] = [
                    'foreignKey' => (string)$relatedTable['foreignKey'],
                    'columns' => []
                ];

                foreach ($relatedTable->column as $column) {
                    $colData = [
                        'name' => (string)$column['name'],
                        'type' => (string)$column['type'],
                        'required' => ((string)$column['required']) === 'true',
                        'default' => isset($column['default']) ? (string)$column['default'] : null,
                    ];
                    $this->relatedModel[$relatedTableName]['columns'][] = $colData;
                }
            }
        }

        // Processing for mrelatedTable
        if (isset($xml->mrelatedTable)) {
            foreach ($xml->mrelatedTable as $mrelatedTable) {
                $mrelatedTableName = (string)$mrelatedTable['name'];
                $this->mrelatedModel[$mrelatedTableName] = [
                    'relatedTableName' => (string)$mrelatedTable['relatedTableName'],
                    'displayColumns' => []
                ];

                foreach ($mrelatedTable->column as $column) {
                    $this->mrelatedModel[$mrelatedTableName]['displayColumns'][] = (string)$column['name'];
                }
            }
        }
    }
    public function fetchDataByIdAndShopName($id, $shopName) {
        try {
            $modelInstance = resolve($this->model);
            $mainTableName = $modelInstance->getTable();

            // Fetch main record
            if ($id === 0) {
                $mainRecord = DB::table($mainTableName)
                                ->where('shop_name', $shopName)
                                ->first();
            }
              else {
                  $mainRecord = DB::table($mainTableName)
                                  ->where('shop_name', $shopName)
                                  ->where('id', $id)
                                  ->first();
              }


            if (!$mainRecord) {
                return response()->json(['message' => 'Record not found'], Response::HTTP_NOT_FOUND);
            }

            $mainRecord = (array)$mainRecord;

            // Process each related model's data
            foreach ($this->relatedModel as $relatedTableName => $relatedTableData) {
                $foreignKey = $relatedTableData['foreignKey'];

                // Fetch unique IDs for related records
                $relatedIds = DB::table($relatedTableName)
                                ->where($foreignKey, $mainRecord['id'])
                                ->pluck('id');

                // Fetch individual related records
                $relatedRecords = [];
                foreach ($relatedIds as $relatedId) {
                    $relatedRecord = DB::table($relatedTableName)
                                       ->where('id', $relatedId)
                                       ->first();
                    if ($relatedRecord) {
                        $relatedRecords[] = (array)$relatedRecord;
                    }
                }

                $mainRecord[$relatedTableName] = $relatedRecords;
            }
            // Process each mrelated model's data
            foreach ($this->mrelatedModel as $mrelatedTableName => $mrelatedTableData) {
                $this->processMRelatedModelData($mainRecord, $mrelatedTableName, $mrelatedTableData);
            }

            return response()->json($mainRecord);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error occurred: ' . $e->getMessage()], 500);
        }
    }
    protected function processMRelatedModelData(&$mainRecord, $mrelatedTableName, $mrelatedTableData) {
        $mainRecordId = $mainRecord['id'];
        $relatedTableName = $mrelatedTableData['relatedTableName'];

        // Fetch the data from mrelatedTable, getting both the 'id' and 'order'.
        $mrelatedRecords = DB::table($mrelatedTableName)
                             ->where($mrelatedTableData['displayColumns'][0], $mainRecordId)
                             ->orderBy('order', 'asc')
                             ->get(['id', $mrelatedTableData['displayColumns'][1], 'order']);

        // Extract IDs maintaining order.
        $orderedIds = $mrelatedRecords->pluck($mrelatedTableData['displayColumns'][1])->all();

        // Fetch the details from relatedTableName using IDs from mrelatedRecords
        $relatedData = DB::table($relatedTableName)
                         ->whereIn('id', $orderedIds)
                         ->get();

        // Re-order $relatedData based on $orderedIds
        $orderedData = collect($orderedIds)->map(function ($id) use ($relatedData) {
            return $relatedData->firstWhere('id', $id);
        });

        if ($orderedData) {
            $mainRecord[$mrelatedTableName] = $orderedData->toArray();
        }
    }


    public function fetchPagedList(Request $request) {
        $shopName = $request->input('shop_name');
        $currentPage = $request->input('page', 1);
        $itemsPerPage = $request->input('items_per_page', 10);
        $filters = $request->input('filter', []); // Get the filter array from the request

        $query = $this->model::where('shop_name', $shopName);

        // Apply filters if they are provided and not set to 'all' or empty
        foreach ($filters as $filterColumn => $filterValue) {
            if (!empty($filterValue) && $filterValue !== 'all') {
                // Check if the filter column exists in the table schema
                if (in_array($filterColumn, array_column($this->tableSchema, 'name'))) {
                    $query->where($filterColumn, $filterValue);
                } else {
                    return response()->json(['message' => "Invalid filter column: $filterColumn"], 400);
                }
            }
        }

        // Order by updated_at descending, then by created_at descending to ensure recently updated or created records are on top
        $query->orderByDesc('updated_at')->orderByDesc('created_at');

        $totalItemCount = $query->count();
        // Ensure proper pagination
        $items = $query->forPage($currentPage, $itemsPerPage)->get();

        return response()->json([
            'items' => $items,
            'totalItemCount' => $totalItemCount,
            'currentPage' => $currentPage,
            'itemsPerPage' => $itemsPerPage
        ]);
    }


    public function dynamicSave(Request $request) {
        \DB::beginTransaction();
        try {
            // Main model processing
            $modelInstance = $this->getModelInstance($request->id);
            $this->updateModelInstance($modelInstance, $request);
            try {
                $modelInstance->save();
            } catch (\Exception $e) {
                throw new \Exception("Failed to save model: " . $e->getMessage());
            }

            // Related models processing
            foreach ($this->relatedModel as $relatedTableName => $relatedTableData) {
                $foreignKey = $relatedTableData['foreignKey'];
                $existingIds = DB::table($relatedTableName)
                                 ->where($foreignKey, $modelInstance->id)
                                 ->pluck('id')->toArray();

                $requestIds = array_filter(array_column($request->$relatedTableName ?? [], 'id'));
                $idsToDelete = array_diff($existingIds, $requestIds);

                // Delete the stale records
                DB::table($relatedTableName)->whereIn('id', $idsToDelete)->delete();

                foreach ($request->$relatedTableName ?? [] as $relatedData) {
                    $relatedData[$foreignKey] = $modelInstance->id;
                    $relatedInstance = $this->getRelatedModelInstance($relatedTableName, $relatedData['id'] ?? null);
                    $this->updateModelInstance($relatedInstance, $relatedData, $relatedTableData['columns']);
                    $relatedInstance->save();
                }
            }
            // mrelatedTable processing
            foreach ($this->mrelatedModel as $mrelatedTableName => $mrelatedTableData) {
//                if (isset($request->$mrelatedTableName) && is_array($request->$mrelatedTableName)) {
                if (isset($request->$mrelatedTableName) && is_array($mrelatedTableData)) {
                    $this->processMRelatedModel($request->$mrelatedTableName, $mrelatedTableName, $modelInstance->id, $mrelatedTableData);
                }
            }

            \DB::commit();
            //todo: return the saved model instance
            if ($request->has('scheme_type') && !empty($request->scheme_type)) {
                return $modelInstance;
            } else {
                return response()->json(['message' => 'Data saved successfully', 'data' => $modelInstance], 200);
            }
        } catch (\Exception $e) {
            \DB::rollBack();
            if (isset($_REQUEST['scheme_type']) && !empty($_REQUEST['scheme_type'])) {
                return false;
            } else {
                return response()->json(['message' => 'Data saved successfully', 'data' => $modelInstance], 200);
            }
        }
    }
    protected function processMRelatedModel($mrelatedData, $mrelatedTableName, $mainRecordId, $mrelatedTableData) {
        // Fetch all existing related records for the main record.
        $existingRecords = \DB::table($mrelatedTableName)
                              ->where($mrelatedTableData['displayColumns'][0], $mainRecordId)
                              ->get()->keyBy($mrelatedTableData['displayColumns'][1]);

        // Convert $mrelatedData to an associative array for easier lookup.
        $newDataIds = collect($mrelatedData)->pluck('id')->all();
        $orderCounter = 1; // Start 'order' from 1 or any desired starting point

        // Insert or update new or existing records.
        foreach ($mrelatedData as $data) {
            $dataId = $data['id'];

            $dataOrder = $orderCounter++; // Increment 'order' for each item

            if (isset($existingRecords[$data['id']])) {
                \DB::table($mrelatedTableName)
                   ->where($mrelatedTableData['displayColumns'][0], $mainRecordId)
                   ->where($mrelatedTableData['displayColumns'][1], $dataId)
                   ->update([
                       'order' => $dataOrder, // Update the 'order' column
                   ]);
            } else {
                // Insert new record.
                \DB::table($mrelatedTableName)->insert([
                    $mrelatedTableData['displayColumns'][0] => $mainRecordId,
                    $mrelatedTableData['displayColumns'][1] => $dataId,
                ]);
            }
        }

        // Determine which existing records are not present in the new data and should be deleted.
        $idsToDelete = $existingRecords->reject(function ($value, $key) use ($newDataIds) {
            return in_array($key, $newDataIds);
        })->keys()->all();

        if (!empty($idsToDelete)) {
            \DB::table($mrelatedTableName)
               ->where($mrelatedTableData['displayColumns'][0], $mainRecordId)
               ->whereIn($mrelatedTableData['displayColumns'][1], $idsToDelete)
               ->delete();
        }
    }

    protected function processMRelatedModelx($mrelatedData, $mrelatedTableName, $mainRecordId, $mrelatedTableData) {
        foreach ($mrelatedData as $data) {
            // Updated to check for both the mainRecordId and the data ID in the query
//            $existingRecord = \DB::table($mrelatedTableName)
//                                 ->where($mrelatedTableData['displayColumns'][0], $mainRecordId)
//                                 ->where($mrelatedTableData['displayColumns'][1], $data['id'])
//                                 ->first();

            $existingRecord = \DB::table($mrelatedTableName)
                                 ->where($mrelatedTableData['displayColumns'][0], $mainRecordId)
                                 ->first();


            if ($existingRecord) {
                // Update existing record
                \DB::table($mrelatedTableName)
                   ->where($mrelatedTableData['displayColumns'][0], $mainRecordId)
                   ->where($mrelatedTableData['displayColumns'][1], $data['id'])
                   ->update([
                       $mrelatedTableData['displayColumns'][0] => $mainRecordId,
                       $mrelatedTableData['displayColumns'][1] => $data['id']
                   ]);
            } else {
                // Insert new record
                \DB::table($mrelatedTableName)->insert([
                    $mrelatedTableData['displayColumns'][0] => $mainRecordId,
                    $mrelatedTableData['displayColumns'][1] => $data['id']
                ]);
            }
        }
    }

//    protected function processMRelatedModel($mrelatedData, $mrelatedTableName, $mainRecordId, $mrelatedTableData) {
//        foreach ($mrelatedData as $data) {
//            $existingRecord = \DB::table($mrelatedTableName)
//                                 ->where($mrelatedTableData['displayColumns'][1], $data['id'])
//                                 ->first();
//
//            if ($existingRecord) {
//                // Update existing record
//                \DB::table($mrelatedTableName)
//                   ->where($mrelatedTableData['displayColumns'][1], $data['id'])
//                   ->update([
//                       $mrelatedTableData['displayColumns'][0] => $mainRecordId,
//                       $mrelatedTableData['displayColumns'][1] => $data['id']
//                   ]);
//            } else {
//                // Insert new record
//                \DB::table($mrelatedTableName)->insert([
//                    $mrelatedTableData['displayColumns'][0] => $mainRecordId,
//                    $mrelatedTableData['displayColumns'][1] => $data['id']
//                ]);
//            }
//        }
//    }
    protected function getModelInstance($id) {
        return $id ? $this->model::findOrFail($id) : new $this->model;
    }

    protected function getRelatedModelInstance($relatedTableName, $id) {
        $relatedModelClass = '\\App\\Models\\' . Str::studly(Str::singular($relatedTableName));
        return $id ? $relatedModelClass::findOrFail($id) : new $relatedModelClass;
    }

    protected function updateModelInstance($modelInstance, $data, $schemaColumns = null) {
        $schemaColumns = $schemaColumns ?: $this->tableSchema;
        foreach ($schemaColumns as $column) {
            $columnName = $column['name'];
            if ($columnName === 'id' && !$modelInstance->exists) {
                continue;
            }
            // Check if data is explicitly provided, otherwise use the default value
            if (isset($data[$columnName])) {
                $modelInstance->$columnName = $data[$columnName];
            } else {
                // Handle cases where default values are defined in the schema
                $modelInstance->$columnName = $column['default'] ?? null;
            }        }
    }

    public function deleteByShopNameAndIds($shopName, $ids) {
        if (empty($ids) || empty($shopName)) {
            return ['status' => false, 'message' => 'Missing IDs or shop_name'];
        }

        try {
            $modelInstance = resolve($this->model);
            $deleteCount = $modelInstance::where('shop_name', $shopName)
                                         ->whereIn('id', $ids)
                                         ->delete();

            if ($deleteCount > 0) {
                return ['status' => true, 'message' => 'Records deleted successfully', 'deletedCount' => $deleteCount];
            }

            return ['status' => false, 'message' => 'No records found to delete'];
        } catch (\Exception $e) {
            return ['status' => false, 'message' => 'Error occurred: ' . $e->getMessage()];
        }
    }

    public function importFromXml($xmlFilePath) {
        if (!file_exists($xmlFilePath)) {
            throw new Exception("XML file not found: {$xmlFilePath}");
        }

        $xmlContent = simplexml_load_file($xmlFilePath);
        if (!$xmlContent) {
            throw new Exception("Failed to load XML file: {$xmlFilePath}");
        }

        DB::beginTransaction();

        try {
            foreach ($xmlContent->questions->question as $item) {
                $modelData = [];
                $attributes = $item->attributes();
                foreach ($this->tableSchema as $column) {
                    $colName = $column['name'];

                    // Check if the XML has the attribute for this column
                    if (isset($attributes->$colName)) {
                        $modelData[$colName] = (string)$attributes->$colName;
                    }
                    // Otherwise, check if it's a child element
                    elseif (isset($item->$colName)) {
                        // Special handling for CDATA sections or child elements
                        $modelData[$colName] = trim((string)$item->$colName);
                    }
                }

                // Use firstOrNew to either find existing model or create a new instance
                $modelInstance = $this->model::firstOrNew(['id' => $modelData['id'] ?? null]);
                foreach ($modelData as $key => $value) {
                    $modelInstance->$key = $value;
                }
                try {
                    $modelInstance->save();
                } catch (\Exception $e) {
                    throw new \Exception("Failed to save model: " . $e->getMessage());
                 }

                // Process options if they exist
                if (isset($item->options)) {
                    foreach ($item->options->option as $optionElement) {
                        $optionAttributes = $optionElement->attributes();
                        $optionData = [];
                        foreach ($this->relatedModel['options']['columns'] as $relatedColumn) {
                            $relatedColName = $relatedColumn['name'];
                            if (isset($optionAttributes->$relatedColName)) {
                                $optionData[$relatedColName] = (string)$optionAttributes->$relatedColName;
                            }
                        }
                        $optionData['question_id'] = $modelInstance->id;

                        // Assuming you have a model for the options
                        $optionModelClass = '\\App\\Models\\Option';
                        $optionModel = $optionModelClass::firstOrNew(['id' => $optionData['id'] ?? null]);
                        foreach ($optionData as $key => $value) {
                            $optionModel->$key = $value;
                        }
                        $optionModel->save();
                    }
                }
            }

            DB::commit();
            return ['message' => 'Import successful'];
        } catch (Exception $e) {
            DB::rollBack();
            return ['message' => 'Import failed: ' . $e->getMessage()];
        }
    }

    public function fetchDataSetting($shopName ) {
        try {
            $modelInstance = resolve($this->model);
            $mainTableName = $modelInstance->getTable();


                $mainRecord = DB::table($mainTableName)
                                ->where('shop_name', $shopName)
                                ->first();


            if (!$mainRecord) {
                return response()->json(['message' => 'Record not found'], Response::HTTP_NOT_FOUND);
            }

            $mainRecord = (array)$mainRecord;


            return response()->json($mainRecord);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error occurred: ' . $e->getMessage()], 500);
        }
    }

    public function fetchSettingRecord($shopName) {
        try {
            $modelInstance = resolve($this->model);
            $mainTableName = $modelInstance->getTable();


            $mainRecord = DB::table($mainTableName)
                            ->where('shop_name', $shopName)
                            ->first();


            if (!$mainRecord) {
                return response()->json(['message' => 'Record not found'], Response::HTTP_NOT_FOUND);
            }
            $mainRecord = (array)$mainRecord;
            return $mainRecord;

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error occurred: ' . $e->getMessage()], 500);
        }
    }

}
