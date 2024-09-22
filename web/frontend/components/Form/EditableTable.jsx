import React, { useState } from 'react';
import {IndexTable, Button, TextField, Checkbox,Select,Card, TextStyle,Banner,TextContainer} from '@shopify/polaris';
import { DeleteMinor } from '@shopify/polaris-icons';
const EditableTable = ({ columns, tableData,errors, onDataChange, tableName, openType, onOpenResourcePicker,allowMultiple }) => {
    const resourcePickerLabel = openType === 'Collection' ? 'Browse Collections' : 'Browse Products';
    // const [errors, setErrors] = useState(tableData.map(() => ({})));
    const validateField = (value, validation = {}) => {
        const { required = false, type } = validation; // Default required to false if not defined
        if (required && !value) {
            return 'This field is required';
        }
        if (type === 'number' && value && isNaN(Number(value))) {
            return 'This field must be a number';
        }
        return '';
    };

    const handleFieldChange = (rowIndex, columnKey, value, validation) => {
        const updatedData = [...tableData];
        updatedData[rowIndex][columnKey] = value;

       // const updatedErrors = [...errors];
       // updatedErrors[rowIndex][columnKey] = validateField(value, validation);

        onDataChange(updatedData);
       // setErrors(updatedErrors);
    };
    const formatLabel = (label, validation = {}) => {
        const { required = false } = validation; // Assume not required if not specified
        return required ? `${label} (required)` : `${label} (optional)`;
    };

    const handleAddRows = () => {
        const lastRow = tableData[tableData.length - 1] || {};
        const newRow = columns.reduce((acc, column) => {
            if (column.name === "min_sales") {
                // Check if lastRow has a "max_sales" and it is not null or undefined
                if (lastRow["max_sales"] !== undefined && lastRow["max_sales"] !== null) {
                    // Convert lastRow["max_sales"] to an integer before incrementing
                    const lastMaxSales = parseInt(lastRow["max_sales"], 10);
                    // Ensure the conversion was successful before using the value
                    if (!isNaN(lastMaxSales)) {
                        acc[column.name] = lastMaxSales + 1;
                    } else {
                        // In case of conversion failure, default to 1
                        acc[column.name] = 1;
                    }
                } else {
                    // If no valid "max_sales" value exists, default to 1
                    acc[column.name] = 1;
                }
            } else {
                // Initialize other columns with empty strings or appropriate default values
                acc[column.name] = '';
            }
            return acc;
        }, {});
        onDataChange([...tableData, newRow]);
    };

    const handleAddRowsx = () => {
        const lastRow = tableData[tableData.length - 1] || {};
        const newRow = columns.reduce((acc, column) => {
            if (column.name === "min_sales") {
                // Set the minimum sales of the new row to the maximum sales of the last row plus one
                acc[column.name] = lastRow["max_sales"] ? lastRow["max_sales"] + 1 : 1;
                console.log(acc[column.name]);
            } else {
                acc[column.name] = '';
            }
            return acc;
        }, {});
        onDataChange([...tableData, newRow]);
    };

    const handleDeleteRow = (rowIndex) => {
        const updatedData = tableData.filter((_, index) => index !== rowIndex);
        const updatedErrors = errors.filter((_, index) => index !== rowIndex);
        onDataChange(updatedData);
       // setErrors(updatedErrors);
    };
    const isErrorString = typeof errors === 'string';

    const rowMarkup = tableData.map((row, rowIndex) => (
        <IndexTable.Row
            id={rowIndex.toString()}
            key={rowIndex}
            position={rowIndex}
        >
            {columns.map((column, columnIndex) =>{
               const error = errors && errors[rowIndex] && errors[rowIndex][column.name];

                return (

                    <IndexTable.Cell key={`${rowIndex}-${columnIndex}`}>
                        {column.type === 'thumbnail' ? (
                            <img src={row[column.name]} alt="" style={{ width: '50px', height: 'auto' }} />
                        ) : column.type === 'checkbox' ? (
                            <Checkbox
                                label={formatLabel(column.label, column.validation)}
                                checked={row[column.name]}
                                onChange={(value) => handleFieldChange(rowIndex, column.name, value, column.validation)}
                                error={error}
                            />
                        ) : column.type === 'select' ? (
                            <Select
                                label={formatLabel(column.label, column.validation)}
                                options={column.options || []}
                                onChange={(value) => handleFieldChange(rowIndex, column.name, value, column.validation)}
                                value={row[column.name]}
                                error={error}
                            />
                        ) : column.type === 'time' ? (
                            <TextField
                                label={formatLabel(column.label, column.validation)}
                                value={row[column.name]}
                                onChange={(value) => handleFieldChange(rowIndex, column.name, value, column.validation)}
                                error={error}
                                type="time"
                            />
                        ) : (
                            <TextField
                                label={formatLabel(column.label, column.validation)}
                                value={row[column.name]}
                                onChange={(value) => handleFieldChange(rowIndex, column.name, value, column.validation)}
                                error={error}
                                type={column.type === 'number' ? 'number' : 'text'}
                            />
                        )}
                    </IndexTable.Cell>            )
                }
            )}
            <IndexTable.Cell>
                <Button plain icon={DeleteMinor} onClick={() => handleDeleteRow(rowIndex)} />
            </IndexTable.Cell>
        </IndexTable.Row>
    ));
    if (tableData.length === 0) {
        return (
            <Card  sectioned>
                <TextStyle variation="subdued">There are no existing items. Click the button below to start adding items.</TextStyle>
                <div style={{ marginTop: '1rem' }}>
                    <Button onClick={handleAddRows}>Add Row</Button>
                    {openType && (
                        <Button onClick={() => onOpenResourcePicker(tableName, openType,allowMultiple)}>
                            {resourcePickerLabel}
                        </Button>
                    )}
                </div>
            </Card>
        );
    }
    return (
        <Card>
            {isErrorString && (
                <Banner status="critical">
                    <TextContainer>
                        <p>{errors}</p>
                    </TextContainer>
                </Banner>
            )}
            <IndexTable
                resourceName={{ singular: 'row', plural: 'rows' }}
                itemCount={tableData.length}
                headings={columns.map(column => ({ title: column.label })).concat({ title: '' })}
                selectable={false}

            >
                {rowMarkup}
            </IndexTable>
            <div style={{ marginTop: '1rem' }}>
                <Button onClick={handleAddRows}>Add Row</Button>
                {openType && (
                    <Button onClick={() => onOpenResourcePicker(tableName, openType,allowMultiple)}>
                        {resourcePickerLabel}
                    </Button>
                )}
            </div>
        </Card>
    );
};

export default EditableTable;

