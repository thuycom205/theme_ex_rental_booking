<?php

namespace App\Http\Controllers;
use Carbon\Carbon;

use App\Models\RentalOrder;
use App\Models\Session;
use App\Traits\DynamicModelTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http; // Import the Http facade
use App\Models\PricingSchemes; // Import the PricingSchemes model
class RentalOrderController extends Controller {
    use DynamicModelTrait;

    public function __construct() {
        $relativePath = 'app/Http/schema/rental_order.xml';

        $this->initializeDynamicModelTrait(RentalOrder::class, base_path($relativePath));
        $this->model = RentalOrder::class;
    }

    public function save(Request $request) {
        return $this->dynamicSave($request);
    }

    public function fetch(Request $request) {
        $id = $request->input('id');
        $shopName = $request->input('shop_name');
        return $this->fetchDataByIdAndShopName($id, $shopName);
    }

    public function fetchList(Request $request) {
        return $this->fetchPagedList($request);
    }

    public function createDraftOrder(Request $request)
    {
        $validatedData = $request->validate([
            'shop_name' => 'required',
            'product_name' => 'required',
            'variant_id' => 'required',
            'quantity' => 'nullable|integer',
            'scheme_id' => 'required',
            'scheme_type' => 'required',
            'custom_properties' => 'required',
            'rental_start_date' => 'nullable',
            'rental_start_time' => 'nullable',
            'rental_option' => 'nullable',
            'number_of_days' => 'nullable|integer',
            'number_of_hours' => 'nullable|integer',
            'number_of_blocks' => 'nullable'
        ]);

        //with dailyRate number_of_blocks is number of days
        try {
            // Retrieve the pricing scheme from the database
            $pricingScheme = PricingSchemes::find((int) $validatedData['scheme_id']);

            if (!$pricingScheme) {
                return response()->json(['error' => 'Invalid pricing scheme.'], 400);
            }
            // Determine time unit and calculate number_of_days and number_of_hours based on number_of_blocks
            $timeUnit = $pricingScheme->time_unit;
            $numberOfBlocks = $validatedData['number_of_blocks'] ?? 0;

            if ($pricingScheme->scheme_type === 'flatRate' || $pricingScheme->scheme_type === 'tieredRate') {
                if ($timeUnit === 'day') {
                    $validatedData['number_of_days'] = $numberOfBlocks;
                    $validatedData['number_of_hours'] = 0;
                } elseif ($timeUnit === 'hour') {
                    $validatedData['number_of_days'] = intdiv($numberOfBlocks, 24);
                    $validatedData['number_of_hours'] = $numberOfBlocks % 24;
                }
            }
            // Calculate the total cost based on the pricing scheme
            $totalCost = $this->calculateTotalCost($pricingScheme, $validatedData);

            // Shopify Draft Order API endpoint
            $shopifyDraftOrderUrl = 'https://' . $validatedData['shop_name'] . '/admin/api/2024-01/draft_orders.json';
            // Format start and end times for the explanation
            $startDateTime = isset($validatedData['rental_start_date']) && isset($validatedData['rental_start_time'])
                ? Carbon::parse($validatedData['rental_start_date'] . ' ' . $validatedData['rental_start_time'])
                : Carbon::now();

            $endDateTime = $startDateTime->copy();
            if (isset($validatedData['number_of_days'])) {
                $endDateTime->addDays($validatedData['number_of_days']);
            }
            if (isset($validatedData['number_of_hours'])) {
                $endDateTime->addHours($validatedData['number_of_hours']);
            }

            // Create the rental explanation
            $rentalExplanation = "Rent {$validatedData['product_name']} from {$startDateTime->format('d-m-Y h:i a')} to {$endDateTime->format('d-m-Y h:i a')}.";

            if ($pricingScheme->scheme_type === 'tieredRate') {
                $rentalExplanation .= " First {$pricingScheme->initial_period} hours for \${$pricingScheme->initial_rate}, ";
                if ($validatedData['number_of_hours'] > $pricingScheme->initial_period) {
                    $extraHours = $validatedData['number_of_hours'] - $pricingScheme->initial_period;
                    $rentalExplanation .= "extra {$extraHours} hours for \${$pricingScheme->subsequent_rate} each.";
                }
            } elseif ($pricingScheme->scheme_type === 'dailyRate') {
                $rentalExplanation .= " Daily rate of \${$pricingScheme->daily_rate}";
                if ($validatedData['number_of_hours']) {
                    $rentalExplanation .= ", plus \${$pricingScheme->hourly_overage_rate} for each additional hour.";
                }
            }
            // Prepare the note with a convention that includes all rental details
            $noteParts = [
                "Rental | Product ID: " . $validatedData['variant_id'],
                "Product Name: " . $validatedData['product_name'],
                "Scheme ID: " . $validatedData['scheme_id'],
                isset($validatedData['rental_start_date']) ? "Start Date: " . $validatedData['rental_start_date'] : "",
                isset($validatedData['rental_start_time']) ? "Start Time: " . $validatedData['rental_start_time'] : "",
                isset($validatedData['number_of_blocks']) ? "Blocks: " . $validatedData['number_of_blocks'] : "",
                "Scheme: " . $validatedData['scheme_type'],
                isset($validatedData['rental_option']) ? "Rental Option: " . $validatedData['rental_option'] : "",
                isset($validatedData['number_of_days']) ? "Days: " . $validatedData['number_of_days'] : "",
                isset($validatedData['number_of_hours']) ? "Hours: " . $validatedData['number_of_hours'] : "",
                "Explanation: " . $rentalExplanation
            ];

            // Filter out empty note parts and join them
            $note = implode(", ", array_filter($noteParts));

            // Set up the draft order data
            $draftOrderData = [
                "draft_order" => [
                    "line_items" => [
                        [
                            "title" => $validatedData['product_name'],
                            // "variant_id" => $validatedData['variant_id'],
                            "price" => $totalCost,
                            "originalUnitPrice" => $totalCost,
                            "quantity" =>  $validatedData['quantity'] ?? 1,
                            "custom_properties" => $validatedData['custom_properties'],
                        ]
                    ],
                    "note" => $note,
                ]
            ];

            // Retrieve the access token for the shop
            $session = Session::where('shop', $validatedData['shop_name'])->first();
            $access_token = $session->access_token;

            // Make the API call to create the draft order
            $response = Http::withHeaders([
                'X-Shopify-Access-Token' => $access_token,
                'Content-Type' => 'application/json',
            ])->post($shopifyDraftOrderUrl, $draftOrderData);

            // Check if the response failed and return the error message
            if ($response->failed()) {
                $errorMessage = $response->json('errors') ?? 'Failed to create draft order.';
                return response()->json([
                    'error' => 'Failed to create draft order.',
                    'shopify_message' => $errorMessage,
                    'response' => $response->body()
                ], 500);
            }

            // If the response was successful, return the redirect URL
            $draftOrder = $response->json();

            return response()->json(['redirectUrl' => $draftOrder['draft_order']['invoice_url']]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Calculate the total cost based on the pricing scheme.
     */
    private function calculateTotalCost($pricingScheme, $validatedData)
    {
        $totalCost = 0;

        switch ($pricingScheme->scheme_type) {
            case 'tieredRate':
                // For tieredRate: initial_period, initial_rate, subsequent_rate
                $hours = $validatedData['number_of_blocks']; // Assuming scheme_id is used to store the hours
                if ($hours <= $pricingScheme->initial_period) {
                    $totalCost = $pricingScheme->initial_rate;
                } else {
                    $additionalHours = $hours - $pricingScheme->initial_period;
                    $totalCost = $pricingScheme->initial_rate + ($additionalHours * $pricingScheme->subsequent_rate);
                }
                break;

            case 'dailyRate':
                // For dailyRate: daily_rate, hourly_overage_rate
                $days = floor($validatedData['number_of_days']); // Assuming scheme_id is used to store the days
                $hours =$validatedData['number_of_hours']; // Convert remaining time to hours
                $totalCost = ($days * $pricingScheme->daily_rate) + ($hours * $pricingScheme->hourly_overage_rate);
                break;

            case 'flatRate':
                // For flatRate: flat_rate, flat_rate_period
                $periods = $validatedData['number_of_blocks']; // Assuming scheme_id is used to store the number of periods
                $totalCost = $periods * $pricingScheme->flat_rate;
                break;

            default:
                throw new \Exception('Unknown pricing scheme type.');
        }

        return $totalCost;
    }
    public function getRentalOrders(Request $request)
    {
        $shopName = $request->input('shop_name', 'wapstoremuoihai.myshopify.com'); // Default value for shop_name

        // Validate the shop_name
        if (!$shopName) {
            return response()->json(['error' => 'Shop name is required.'], 400);
        }

        // Retrieve the access token for the shop
        $session = Session::where('shop', $shopName)->first();
        if (!$session) {
            return response()->json(['error' => 'Shop not found.'], 404);
        }
        $access_token = $session->access_token;

        try {
            // Shopify Orders API endpoint
            $shopifyOrdersUrl = 'https://' . $shopName . '/admin/api/2024-01/orders.json';

            // Make the API call to get the orders
            $response = Http::withHeaders([
                'X-Shopify-Access-Token' => $access_token,
                'Content-Type' => 'application/json',
            ])->get($shopifyOrdersUrl);

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to fetch orders from Shopify.',
                    'shopify_message' => $response->json('errors') ?? 'Unknown error',
                    'response' => $response->body()
                ], 500);
            }

            $orders = $response->json('orders');
            $rentalOrders = [];




            // Loop through each order and check if it is a rental order
            foreach ($orders as $order) {
                if ($order['source_name'] == 'shopify_draft_order') {


                    // if ($order['name'] == '#1044') {
                    $note = $order['note'] ?? '';

                    if ( strpos( $note, 'Rental' ) !== false ) {
                        // Parse the note to extract rental details
                        $rentalDetails = $this->parseRentalNote( $note );

                        if (!isset($rentalDetails['scheme_id'])) {
                           continue;
                        }
                        $pricingScheme = PricingSchemes::find((int)$rentalDetails['scheme_id']);


                        // Set rental_start_date to today if it's null
                        $rentalDetails['rental_start_date'] = $rentalDetails['rental_start_date'] ?? now()->toDateString();

                        // Calculate rental_end_date
                        $rentalEndDate = Carbon::parse( $rentalDetails['rental_start_date'] );

                        if ( ! empty( $rentalDetails['number_of_day'] ) ) {
                            $rentalEndDate->addDays( $rentalDetails['number_of_day'] );
                        }

                        if ( ! empty( $rentalDetails['number_of_hour'] ) ) {
                            $rentalEndDate->addHours( $rentalDetails['number_of_hour'] );
                        }

                        $rentalDetails['rental_end_date'] = $rentalEndDate->toDateTimeString();

                        // Check if the rental order already exists in the database
                        $existingRentalOrder = RentalOrder::where( 'shop_name', $shopName )
                                                          ->where( 'order_id', $order["admin_graphql_api_id"])
                                                          ->first();

                        if ( ! $existingRentalOrder ) {
                            // Create a new rental order record
                            RentalOrder::create( [
                                'shop_name'             => $shopName,
                                'product_id'            => $rentalDetails['product_id'] ?? 0,
                                'product_name'          => $rentalDetails['product_name'] ?? '',
                                'pricing_scheme_id'     => $rentalDetails['scheme_id'] ?? 0,
                                'pricing_scheme_title'  => $rentalDetails['scheme_type'] ?? '',
                                'pricing_scheme_detail' => json_encode( $rentalDetails ),
                                'customer_id'           => $order['customer']['id'] ?? 0,
                                'customer_email'        => $order['customer']['email'] ?? '',
                                'customer_last_name'    => $order['customer']['last_name'] ?? '',
                                'rental_start_date'     => $rentalDetails['rental_start_date'],
                                'start_time'            => $rentalDetails['rental_start_time'] ?? null,
                                'rental_end_date'       => $rentalDetails['rental_end_date'],
                                'number_of_day'         => $rentalDetails['number_of_day'] ?? 0,
                                'number_of_hour'        => $rentalDetails['number_of_hour'] ?? 0,
                                'total_cost'            => $order['total_price'] ?? 0,
                                'order_id'            =>   $order["admin_graphql_api_id"],
                                'order_name'            => $order['name'] ?? '',
                                'time_unit'            => $pricingScheme->time_unit ?? 'day',
                            ] );
                        }

                        $rentalOrders[] = $order;
                    }
                    //
               // }
            }
            }

            return response()->json(['success' => 'ok', 'rental_orders_no' => count($rentalOrders)]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred: ' . $e->getMessage()], 500);
        }
    }

    private function parseRentalNote($note)
    {
        $details = [];

        // Split the note into parts
        $noteParts = explode(',', $note);

        foreach ($noteParts as $part) {
            if (strpos($part, 'Product ID:') !== false) {
                $details['product_id'] = (int)trim(str_replace('Product ID:', '', $part));
            }
            if (strpos($part, 'Product Name:') !== false) {
                $details['product_name'] = trim(str_replace('Product Name:', '', $part));
            }
            if (strpos($part, 'Scheme ID:') !== false) {
                $details['scheme_id'] = (int)trim(str_replace('Scheme ID:', '', $part));
            }
            if (strpos($part, 'Start Date:') !== false) {
                $details['rental_start_date'] = trim(str_replace('Start Date:', '', $part));
            }
            if (strpos($part, 'Start Time:') !== false) {
                $details['rental_start_time'] = trim(str_replace('Start Time:', '', $part));
            }
            if (strpos($part, 'Blocks:') !== false) {
                $details['number_of_blocks'] = (int)trim(str_replace('Blocks:', '', $part));
            }
            if (strpos($part, 'Scheme:') !== false) {
                $details['scheme_type'] = trim(str_replace('Scheme:', '', $part));
            }
            if (strpos($part, 'Days:') !== false) {
                $details['number_of_day'] = (int)trim(str_replace('Days:', '', $part));
            }
            if (strpos($part, 'Hours:') !== false) {
                $details['number_of_hour'] = (int)trim(str_replace('Hours:', '', $part));
            }
        }

        // Set default values if keys are not set
        $details['rental_start_date'] = $details['rental_start_date'] ?? now()->toDateString();
        $details['rental_start_time'] = $details['rental_start_time'] ?? null;
        $details['number_of_blocks'] = $details['number_of_blocks'] ?? 0;
        $details['scheme_type'] = $details['scheme_type'] ?? '';
        $details['number_of_day'] = $details['number_of_day'] ?? 0;
        $details['number_of_hour'] = $details['number_of_hour'] ?? 0;

        return $details;
    }





}
