import React, { useState, useCallback,useEffect } from 'react';
import { Frame,Navigation, Page,Select,RadioButton, Layout, Card, FormLayout, TextField, Button,Toast,IndexTable,useIndexResourceState,Icon,TextStyle,DisplayText } from '@shopify/polaris';
import {useNavigate, useParams} from 'react-router-dom';
import { ResourcePicker } from "@shopify/app-bridge-react";
import MResourcePicker from './MResourcePicker';
import { DeleteMinor } from '@shopify/polaris-icons';

import {useShop} from "./components/providers/ShopProvider";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import * as ActionHandlers from './components/Form/actionHandlers'; // Import the action handlers
import { Spinner } from '@shopify/polaris'; // Import Spinner for loading indicator
import { loadEntityComponent } from './components/Form/ComponentRegistry';

import MRelatedTable from './components/Form/MRelatedTable';
import EditableTable from './components/Form/EditableTable';
import {Tooltip , ButtonGroup, Stack} from "@shopify/polaris";
import {useTranslation} from "react-i18next";
import { CopyToClipboard } from 'react-copy-to-clipboard';

const DynamicFormComponent = ({ formSchema, onFormSubmit,entityTitle }) => {
    const { t } = useTranslation();
    const [host,setHost] = useState('');
    const [copiedText, setCopiedText] = useState('');

    const { entity } = useParams();
    const [EntitySpecificComponent, setEntitySpecificComponent] = useState(null);

    const [fetchedId, setFetchedId] = useState('0');
    const [activeMRelatedTable, setActiveMRelatedTable] = useState(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState({ loading: false, error: null });
    const [shop, setShop] = useState('');
    // Function to dynamically import the action handler based on the button's name
    const [formVisibility, setFormVisibility] = useState({});
    const [loading, setLoading] = useState(false); // State to handle loading

    const handleCopy = (text) => {
        setCopiedText(text);
        // Add any additional logic you want to handle after copying
    };

    const abandoned_actions = [
        { label: 'Customer Name', code: '{{customer_name}}' },
        { label: 'Order Total', code: '{{order_total}}' },
        { label: 'Order Items', code: '{{order_items}}' },
        { label: 'Coupon Code', code: '{{coupon_code}}' },
        { label: 'Order Date', code: '{{order_date}}' }
    ];
    const base64Decode = (encodedString) => {
        try {
            return atob(encodedString);
        } catch (e) {
            console.error("Failed to decode base64 string:", e);
            return null;
        }
    };
    useEffect(() => {
        // Dynamically load the component for the current entity
        loadEntityComponent(entity).then(ComponentModule => {
            // Set the component once the module is resolved
            setEntitySpecificComponent(() => ComponentModule.default);
        });
    }, [entity]);
    const handleAction = (button) => {
        const actionType = button.actionType || 'navigate'; // Default to navigate if no actionType provided

        if (actionType == 'navigate') {
            navigate(`${button.target}?entity=${entity}&id=${fetchedId}`);
        } else {
            const handler = ActionHandlers[actionType];
            if (handler) {
                // handler(useNavigate(), button, entity, id); // Pass necessary arguments
                handler(entity, fetchedId,formData,setFormData,shop); // Pass necessary arguments
            } else {
                console.error(`No handler for actionType ${actionType}`);
            }
        }
    };
    const pageActions = formSchema?.buttons?.map(button => {
        // Example conditional logic: enable certain actions only if ID is greater than zero
        const isEnabled = fetchedId > 0 || button.alwaysEnabled;
        return {
            content: button.label,
            onAction: () => handleAction(button),
            helpText : button.helpText? button.helpText : '',
            disabled: !isEnabled  // Disable action if not enabled
        };
    });
    const primaryAction = pageActions?.[0]; // First button as primary action
    const secondaryActions = pageActions?.slice(1); // Rem
    useEffect(() => {
        const visibility = {};
        formSchema.fields.forEach(field => {
            if (field.depend_by) {
                visibility[field.name] = true; // Start with the field hidden
            }
        });
        setFormVisibility(visibility);
    }, [formSchema]);


    // Function to handle button clicks

// Example of how to define the handleReorder function in your parent component
    const handleReorder = (tableName, reorderedItems) => {
        setFormData(prevData => ({
            ...prevData,
            [tableName]: reorderedItems
        }));
    };

    const handleOpenPicker = (mrelatedTable) => {
        console.log(mrelatedTable);
        setActiveMRelatedTable(mrelatedTable);
        setIsPickerOpen(true);
    };
    const handleDeleteItemFromTable = useCallback((tableName, rowIndex) => {
        setFormData(prevData => {
            const newData = [...prevData[tableName]];
            newData.splice(rowIndex, 1);
            return { ...prevData, [tableName]: newData };
        });
    }, []);
    const handleAddItemsToTable = (table, items) => {
        // Logic to add selected items to the specific mrelatedTable
        setFormData(prevData => ({
            ...prevData,
            [table]: [...(prevData[table] || []), ...items]
        }));
    };

    const [activeResourcePicker, setActiveResourcePicker] = useState({
        tableName: null,
        type: null ,
        allowMultiple: true,
    });
    const handleResourcePickerOpen = useCallback((tableName, type,allowMultiple) => {
        setActiveResourcePicker({ tableName, type, allowMultiple });
    }, []);

    const handleResourcePickerClose = useCallback(() => {
        setActiveResourcePicker({ tableName: null, type: null,
            allowMultiple: true,
        });
    }, []);

    const handleResourceSelection = useCallback((resources) => {


        const { tableName, type, allowMultiple } = activeResourcePicker;
        if (!tableName) return;

        // Process the selected items from the resource picker
// Process the selected items from the resource picker
        const selectedItems = resources.selection.map(item => {
            const idMatch = item.id.match(/(\d+)$/);
            const productId = idMatch ? parseInt(idMatch[0], 10) : null

            const img = item.images[0].originalSrc;
            console.log(img); // Log the current item to the console

            console.log(type);
            console.log(item.id);
            return {
                collection_id: type === 'Collection' ? productId : undefined,
                product_id: type === 'Product' ? productId: undefined,
                product_handler: item.handle,
                product_name: item.title,
                product_img:  item.images[0].originalSrc,
            };
        });


        // Update the form data with the selected items
        // If allowMultiple is false, replace the existing data; otherwise, concatenate it
        setFormData(prevData => {
            // If allowMultiple is false, use only the first selected item, or an empty array if none
            const updatedItems = allowMultiple ? [...(prevData[tableName] || []), ...selectedItems] : selectedItems.slice(0, 1);
            return {
                ...prevData,
                [tableName]: updatedItems
            };
        });

        setActiveResourcePicker({ tableName: null, type: null, allowMultiple: true });
    }, [activeResourcePicker]);

    const [id, setId] = useState(0);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showBanner, setShowBanner] = useState(true);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [toastContent, setToastContent] = useState('');
    const toastMarkup = showToast ? (
        <Toast content={toastContent} onDismiss={() => setShowToast(false)} />
    ) : null;
    useEffect(() => {
        const updateVisibility = () => {
            const visibility = {};
            const newErrors = {...errors}; // Copy existing errors to update

            // Loop through all fields to set initial visibility and handle dependencies
            for (let i = 0; i < formSchema.fields.length; i++) {
                const field = formSchema.fields[i];
                // Assume field is visible unless it has a dependency that hides it
                visibility[field.name] = true;

                if (field.depend_by) {
                    // Find the field it depends on
                    const dependField = formSchema.fields.find(f => f.name === field.depend_by);
                    if (dependField) {
                        // Check if the current value of the dependency should toggle visibility
                        const controllerValue = formData[field.depend_by];
                        visibility[field.name] = controllerValue === field.name;

                        if (!visibility[field.name]) {
                            newErrors[field.name] = '';
                        } else if (field.validation.required) {
                            // Validate immediately if the field is required and becomes visible
                            const ferror = validateField(field, formData[field.name]);
                            newErrors[field.name] = ferror;
                        }


                    } else {
                        // No field found it depends on, make it invisible as precaution
                        visibility[field.name] = true;
                    }
                }

                // new logic
                // Handle complex dependencies using allOf
                if (field.dependencies && field.dependencies.allOf) {
                    for (let i = 0; i < field.dependencies.allOf.length; i++) {
                        const condition = field.dependencies.allOf[i];
                        if (formData[condition.field] !== condition.value) {
                            visibility[field.name] = false;
                            console.log('visibility');
                            console.log(field.name);
                            // As soon as one condition fails, return false
                        }
                    }
                }
                //end new logic
                // Handle anyOf conditions
                if (field.dependencies && field.dependencies.anyOf) {
                    //shouldShowField = false; // Assume the field should be hidden initially
                    visibility[field.name] = false;

                    for (let i = 0; i < field.dependencies.anyOf.length; i++) {
                        const condition = field.dependencies.anyOf[i];
                        if (formData[condition.field] === condition.value) {
                            //shouldShowField = true; // If any condition matches, show the field
                            visibility[field.name] = true;
                            break;
                        }
                    }
                }
            }
            setFormVisibility(visibility);
            setErrors(newErrors);

        };

        updateVisibility();
    }, [formSchema, formData]);


    useEffect(() => {
        const url = window.location.href;

        // Extract and decode hostz
        const hostzMatch = url.match(/hostz\/([^\/]+)/);
        if (hostzMatch) {
            const encodedString = hostzMatch[1];
            const decodedHost = base64Decode(encodedString);
            const parts = decodedHost.split('/');
            const storeName = parts[parts.length - 1];
            setShop(storeName + ".myshopify.com");
        } else {
            console.log("Encoded String not found.");
        }

        // Extract editId
        const editIdMatch = url.match(/editId\/(\d+)/);
        if (editIdMatch) {
            setFetchedId(editIdMatch[1]);
        } else {
            setFetchedId('0');
        }

        // Extract shop_name
        const shopNameMatch = url.match(/shop_name\/([^\/]+)/);
        if (shopNameMatch) {
            setShop(shopNameMatch[1]);
        }
        }, [entity]);
    const handleDataChange = useCallback((fieldName, newData) => {
        setFormData(prevData => ({ ...prevData, [fieldName]: newData }));
    }, []);

    useEffect(() => {
        if (fetchedId !== '0' || entity === 'whatsapp_widgets' || entity === 'coupon_settings') {
            let fetchUrl = `/api/${entity}/fetch?id=${encodeURIComponent(fetchedId)}&shop_name=${encodeURIComponent(shop)}`;

            if (entity === 'whatsapp_widgets' || entity === 'coupon_settings') {
                const session = new URLSearchParams(location.search).get("session");
                const url = window.location.href;
                const match = url.match(/hostz\/([^\/]+)/);
                const encodedString = match[1];
                const decodedHost = base64Decode(encodedString);
                const parts = decodedHost.split('/');
                const storeName = parts[parts.length - 1];
                setShop(storeName + ".myshopify.com");
                fetchUrl = `/api/${entity}/fetch_setting?shop_name=${encodeURIComponent(storeName)}&host=${encodedString}&session=${session}&shop=${encodeURIComponent(storeName)}`;
            }

            const fetchData = async () => {
                setLoading(true);
                try {
                    const response = await fetch(fetchUrl, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    if (!response.ok) {
                        throw new Error('Network response was not OK');
                    }
                    const data = await response.json();
                    setFormData(data);
                } catch (error) {
                    console.error('Error:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }

        if (fetchedId === '0' || fetchedId === 0) {
            setFormData('');
        }
    }, [entity, fetchedId]);




    const validateField = useCallback((field, value) => {
        let error = "";
        if (formVisibility[field.name]=== false) {
            return ''; // No validation if field is not visible
        }
        if (field.validation) {

            if (field.validation.required && !value) {
                error = "This field is required";
            } else   if (field.type === "number") {
                const numberValue = parseFloat(value);
                if (isNaN(numberValue) && field.validation && field.validation.required) {
                    error = "This field must be a number";
                } else {
                    if (field.validation.min !== undefined && numberValue < field.validation.min) {
                        error = `The value must be at least ${field.validation.min}`;
                    }
                    if (field.validation.max !== undefined && numberValue > field.validation.max) {
                        error = `The value must not exceed ${field.validation.max}`;
                    }
                }
            } else if (field.validation.type === "url" && value && !/^(http|https):\/\/[^ "]+$/.test(value)) {
                error = "Please enter a valid URL";
            } else if (field.validation.type === "email" && value && !/\S+@\S+\.\S+/.test(value)) {
                error = "Please enter a valid email";
            }
        }
        // Handle editableTable types
        if (field.type === 'editableTable') {
            value.forEach((row, rowIndex) => {
                field.columns.forEach(column => {
                    if (column.validation) {
                        let cellValue = row[column.name];
                        let cellError = validateField(column, cellValue);
                        if (cellError) {
                            if (!error[rowIndex]) error[rowIndex] = {};
                            error[rowIndex][column.name] = cellError;
                        }
                    }
                });
            });
        }
        return error;
    }, []);


    const handleChange = useCallback((fieldName, value) => {
        setFormData(prevData => ({ ...prevData, [fieldName]: value }));
        const fieldConfig = formSchema.fields.find(field => field.name === fieldName);
        const error = validateField(fieldConfig, value);
        setErrors(prevErrors => ({ ...prevErrors, [fieldName]: error }));
        // Check for dependencies and update visibility
        const newVisibility = { ...formVisibility };
        // Iterate over each field to update visibility based on the current change
        formSchema.fields.forEach(field => {
            // Check if there's a dependency that matches the field being changed
            // and the depend_by value equals "x"
            if (field.depend_by === fieldName && field.name === value) {
                // Find the configuration for the field that has just changed
               // const fieldConfigx = formSchema.fields.find(f => f.name === fieldName && f.options.some(option => option.value === value));

                // Update visibility based on whether the field configuration exists and matches the criteria
                newVisibility[field.name] = true;
                console.log('newVisibility[field.name]');
                console.log(field.name);
            } else if (field.depend_by === fieldName && field.name != value) {
                newVisibility[field.name] = false;
                console.log('newVisibility[field.name] not visibl');
                console.log(field.name);

            }
        });



        setFormVisibility(newVisibility);
    }, [formSchema.fields, validateField, formVisibility]);

    const formatLabel = (label, validation) => {
        if (validation && validation.required) {
            return `${label} (required)`;
        }
        return `${label} (optional)`;
    };
    const validateRowsbak = (tableData) => {
        let isValid = true;
        let errorMsg = "";

        for (let i = 0; i < tableData.length; i++) {
            const row = tableData[i];
            if (row.max_sales <= row.min_sales) {
                isValid = false;
                errorMsg = `Error in row ${i + 1}: Maximum sales must be greater than minimum sales.`;
                break;
            }
            if (i > 0 && tableData[i].min_sales !== tableData[i - 1].max_sales + 1) {
                isValid = false;
                errorMsg = `Error in row ${i + 1}: Minimum sales must be one more than the maximum sales of the previous row.`;
                break;
            }
        }
        return { isValid, errorMsg };
    };

    const validateRows = (tableData) => {
        let isValid = true;
        let errorMsg = "";

        for (let i = 0; i < tableData.length; i++) {
            // Explicitly convert max_sales and min_sales to integers to ensure arithmetic operations are correctly applied.
            const minSales = parseInt(tableData[i].min_sales, 10);
            const maxSales = parseInt(tableData[i].max_sales, 10);

            // Check if minSales or maxSales are NaN, indicating invalid conversion or input
            if (isNaN(minSales) || isNaN(maxSales)) {
                isValid = false;
                errorMsg = `Error in row ${i + 1}: Non-numeric sales data provided.`;
                break;
            }

            if (maxSales <= minSales) {
                isValid = false;
                errorMsg = `Error in row ${i + 1}: Maximum sales must be greater than minimum sales.`;
                break;
            }
            // For rows after the first, compare to the max_sales of the previous row
            if (i > 0) {
                const previousMaxSales = parseInt(tableData[i - 1].max_sales, 10);
                if (isNaN(previousMaxSales)) {
                    isValid = false;
                    errorMsg = `Error in row ${i + 1}: Non-numeric previous maximum sales data provided.`;
                    break;
                }
                if (minSales !== previousMaxSales + 1) {
                    isValid = false;
                    errorMsg = `Error in row ${i + 1}: Minimum sales must be one more than the maximum sales of the previous row.`;
                    break;
                }
            }
        }
        return { isValid, errorMsg };
    };

    const handleSubmit = useCallback(async () => {
        let isFormValid = true;
        let newErrors = {};

        formSchema.fields.forEach(field => {
            const value = formData[field.name];

            if (formVisibility[field.name] === false) {
                return; // Skip validation if the field is not visible
            }

            if ((field.type === 'editableTable') && (formVisibility[field.name] != false)) {
                let tableErrors = [];
                if (!value) {
                    return;
                }
                for (let index = 0; index < value.length; index++) {
                    let row = value[index];
                    let rowErrors = {};

                    // Iterate over each column in the row
                    for (let j = 0; j < field.columns.length; j++) {
                        let column = field.columns[j];
                        let columnValue = row[column.name];
                        let error = validateField(column, columnValue);

                        if (error) {
                            rowErrors[column.name] = error;
                            isFormValid = false;

                            // Optionally break if you only care about the first error per row
                            // break;
                        }
                    }

                    if (Object.keys(rowErrors).length > 0) {
                        tableErrors[index] = rowErrors;

                        // Optionally break if you only care about the first error in the table
                        // break;
                    }
                }
                newErrors[field.name] = tableErrors;
                // const { isValid, errorMsg } = validateRows(formData[field.name]); // Assuming formData[field.name] contains the table data
                // if (!isValid) {
                //     isFormValid = false;
                //     // Add the error message to the form errors
                //     newErrors[field.name] = errorMsg;
                // }

                //more logic for kol commision rule
            } else {

                const error = validateField(field, value);
                newErrors[field.name] = error;
                if (error) isFormValid = false;
            }

        });

        setErrors(newErrors);

        if (isFormValid) {
            setSubmissionStatus({ loading: true, error: null });

            const submitUrl = `/api/${entity}/save`;
            const payload = { ...formData, shop_name: shop };

            try {
                const response = await fetch(submitUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    onFormSubmit('Form submitted successfully.');
                    setSubmissionStatus({ loading: false, error: '' });

                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setSubmissionStatus({ loading: false, error: '' });

                onFormSubmit('Form submitted successfully.');
                if (data.data.id) {
                    setFetchedId(data.data.id.toString());  // Update the ID in the state
                }

            } catch (error) {
                console.error('Failed to submit form:', error);
                onFormSubmit('Failed to submit form.');

                setSubmissionStatus({ loading: false, error: error.message });

            }
        }
    }, [formData, validateField, entity]);


    if (!formSchema) {
        return <div>Loading...</div>; // Or any other loading state representation
    }
    if (loading) {
        return <Spinner accessibilityLabel="Loading form data" size="large" />; // Show spinner during loading
    }

    const actions = [
        { content: 'Main Action', onAction: () => console.log('Primary action') },
        { content: 'First Secondary', onAction: () => console.log('First secondary action'), tooltip: 'More info about first action' },
        { content: 'Second Secondary', onAction: () => console.log('Second secondary action'), tooltip: 'More info about second action' }
    ];
    return (
        <Frame

        >

            <Page
                primaryAction={primaryAction}
                secondaryActions={secondaryActions}
                fullWidth >
                <DisplayText size="large">{`Form: ${entityTitle}`}</DisplayText> {/* Moved DisplayText here */}

                <Layout>
                    <Layout.Section>

                        <Card sectioned>

                            <FormLayout>
                                {formSchema.fields.map(field => {
                                    // Skip rendering if the field is dependent and not meant to be shown
                                    if (field.depend_by && !formVisibility[field.name]) {
                                        return null;
                                    }
                                    if (field.dependencies && !formVisibility[field.name]) {
                                        return null;
                                    }
                                    const formattedLabel = formatLabel(field.label, field.validation);

                                    if (field.type === 'editableTable') {
                                        const openType = field.open; // 'Collection' or 'Product'
                                        const allowMultiple = field.allowMultiple !== 'no';
                                        let shouldRenderField = true;

                                        // Using for loop to find dependent field option
                                        let dependentFieldOption = null;
                                        for (let i = 0; i < formSchema.fields.length; i++) {
                                            const f = formSchema.fields[i];
                                            if (f.options) {
                                                for (let j = 0; j < f.options.length; j++) {
                                                    const option = f.options[j];
                                                    if (option.depend_by === field.name) {
                                                        dependentFieldOption = f; // Found the dependent field
                                                        break; // Break the inner loop
                                                    }
                                                }
                                            }
                                            if (dependentFieldOption) break; // Break the outer loop if dependent field found
                                        }

                                        // Check if this field should be rendered based on dependent field's value
                                        if (dependentFieldOption) {
                                            const dependentFieldValue = formData[dependentFieldOption.name];
                                            shouldRenderField = false; // Assume it should not be rendered initially
                                            for (let i = 0; i < dependentFieldOption.options.length; i++) {
                                                const option = dependentFieldOption.options[i];
                                                if (option.value === dependentFieldValue && option.depend_by === field.name) {
                                                    shouldRenderField = true; // The condition is met, it should be rendered
                                                    break; // No need to check further
                                                }
                                            }
                                        }

                                        // Now, shouldRenderField indicates whether the field should be rendered based on the dependency
                                        if (!shouldRenderField) {
                                            return null; // Skip rendering this field
                                        }
                                        return (
                                            <Card title={field.label} sectioned>
                                            <EditableTable
                                                key={field.name}
                                                columns={field.columns}
                                                tableData={formData[field.name] || []}
                                                errors={errors[field.name] || []}
                                                onDataChange={data => handleDataChange(field.name, data)}
                                                tableName={field.name}
                                                openType={openType}
                                                onOpenResourcePicker={handleResourcePickerOpen}
                                                allowMultiple={allowMultiple} // Pass allowMultiple directly

                                            />
                                            </Card>
                                        );
                                    }
                                    if (field.type === 'mrelatedTable') {
                                        return (
                                            <Card  title={field.label} sectioned>
                                                {field.tooltip && <TextStyle variation="subdued">{field.tooltip}</TextStyle>}

                                                <MRelatedTable
                                                key={field.name}
                                                tableName={field.name}
                                                tableData={formData[field.name] || []}
                                                displayColumns={field.displayColumns}
                                                onOpenPicker={handleOpenPicker}
                                                onDeleteItem={(rowIndex) => handleDeleteItemFromTable(field.name, rowIndex)}
                                                reorderable={field.reorderable || false}
                                                onReorder={(reorderedItems) => handleReorder(field.name, reorderedItems)}
                                                // Pass the reorderable property

                                            />
                                            <Button onClick={() => handleOpenPicker(field)}>Browse {field.label}</Button>
                                            </Card>
                                        );
                                    }
                                    if (field.type === 'select') {
                                        return (
                                            <Select
                                                label={formattedLabel}
                                                options={[{ label: 'Select an option', value: '' }, ...field.options]}
                                                onChange={(value) => handleChange(field.name, value)}
                                                value={formData[field.name] || ''}
                                                key={field.name}
                                                error={errors[field.name]}
                                                placeholder={field.placeholder}
                                                helpText={field.tooltip}
                                            />
                                        );
                                    }
                                    // New Radio Button Rendering
                                    if (field.type === 'radio') {
                                        return (
                                            <Card title={formattedLabel} key={field.name} sectioned>
                                                <Stack vertical>
                                                    {field.options.map(option => (
                                                        <RadioButton
                                                            key={option.value}
                                                            label={option.label}
                                                            checked={formData[field.name] === option.value}
                                                            id={option.value}
                                                            name={field.name}
                                                            onChange={() => handleChange(field.name, option.value)}
                                                        />
                                                    ))}
                                                </Stack>
                                                {errors[field.name] && <TextStyle variation="negative">{errors[field.name]}</TextStyle>}
                                            </Card>
                                        );
                                    }

                                    // Render other types of fields (e.g., TextField, EditableTable, etc.)

                                    if (field.type === 'number') {
                                        return (
                                            <TextField
                                                key={field.name}
                                                label={formattedLabel}
                                                value={formData[field.name] || ''}
                                                onChange={(value) => handleChange(field.name, value)}
                                                error={errors[field.name]}
                                                type="number"
                                                placeholder={field.placeholder}
                                                helpText={field.tooltip}
                                                min={field.min || undefined}
                                                max={field.max || undefined}
                                                step={field.step || undefined}
                                            />
                                        );
                                    }


                                    return (
                                        <React.Fragment key={field.name}>
                                            <TextField
                                                label={formattedLabel}
                                                value={formData[field.name] || ''}
                                                onChange={(value) => handleChange(field.name, value)}
                                                error={errors[field.name]}
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                helpText={field.tooltip}
                                                multiline={field.multiline ? Number(field.multiline) : false}
                                            />
                                            {field.name === 'abandoned_cart_template' && (
                                                <ButtonGroup segmented>
                                                    {abandoned_actions.map((action) => (
                                                        <Tooltip key={action.code} content={`Copy ${action.label}`}>
                                                            <CopyToClipboard text={action.code} onCopy={() => handleCopy(action.code)}>
                                                                <Button>{action.label}</Button>
                                                            </CopyToClipboard>
                                                        </Tooltip>
                                                    ))}
                                                </ButtonGroup>
                                            )}
                                            {copiedText && <TextStyle variation="positive">Copied: {copiedText}</TextStyle>}

                                        </React.Fragment>

                                    );

                                })}
                                {EntitySpecificComponent && <EntitySpecificComponent formSchema={formSchema} formData={formData} setFormData={setFormData} />}

                                <Button onClick={handleSubmit}
                                        disabled={ submissionStatus.loading}
                                >Submit</Button>
                            </FormLayout>
                        </Card>
                    </Layout.Section>
                </Layout>
                {activeResourcePicker.tableName && (
                    <ResourcePicker
                        resourceType={activeResourcePicker.type}
                        open={Boolean(activeResourcePicker.tableName)}
                        onSelection={handleResourceSelection}
                        onCancel={handleResourcePickerClose}
                        allowMultiple={activeResourcePicker.allowMultiple} // Restrict to single selection

                    />
                )}
            </Page>
            <MResourcePicker
                activeTable={activeMRelatedTable}
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onAddItems={handleAddItemsToTable}
            />
        </Frame>
    );
};

export default DynamicFormComponent;
