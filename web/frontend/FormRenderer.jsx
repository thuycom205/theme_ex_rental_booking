
import React, { useState, useEffect } from 'react';
import DynamicFormComponent from './createComponent.jsx';
import { useParams, useNavigate ,useLocation} from 'react-router-dom';
import { DisplayText, Page, Layout, Card ,Button} from '@shopify/polaris';
import { Toast, Frame } from '@shopify/polaris';

const FormRenderer = () => {
    const { entity } = useParams();
    const navigate = useNavigate(); // Hook for navigation
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    // const id = query.get('editId'); // Assuming the URL parameter name is 'id'
    const id = parseInt(query.get('editId'), 10); // Assuming the URL parameter name is 'id'

    const [schema, setSchema] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        // Load the appropriate schema based on the entity
        import(`./schema/schema_${entity}.json`)
            .then((loadedSchema) => {
                setSchema(loadedSchema.default); // Use `.default` for ES6 module compatibility
            })
            .catch((error) => {
                console.error(`Failed to load schema for entity ${entity}:`, error);
                // Handle the error or set a default schema
            });
    }, [entity]);
    const handleFormSubmit = (message) => {
        setToastMessage(message);
        setShowToast(true);
    };
    // Fallback or loading state
    if (!schema) {
        return <div>Loading...</div>;
    }
    const entityTitle = entity ? entity.replace(/_/g, ' ').toUpperCase() : 'Unknown';
    const listPageUrl = `/page_tree/${entity}`; // Dynamic URL based on the entity
    // Parse buttons from the schema for Page actions
    const handleAction = (button) => {
        const actionType = button.actionType || 'navigate'; // Default to navigate if no actionType provided
        const handler = ActionHandlers[actionType];
        if (handler) {
           // handler(useNavigate(), button, entity, id); // Pass necessary arguments
            handler(entity, id,formData,updateFormData); // Pass necessary arguments
        } else {
            console.error(`No handler for actionType ${actionType}`);
        }
    };
    const pageActions = schema?.buttons?.map(button => {
        // Example conditional logic: enable certain actions only if ID is greater than zero
        const isEnabled = id > 0 || button.alwaysEnabled;
        return {
            content: button.label,
            onAction: () => handleAction(button),
            disabled: !isEnabled  // Disable action if not enabled
        };
    });

    // Example primary and secondary action separation
    const primaryAction = pageActions?.[0]; // First button as primary action
    const secondaryActions = pageActions?.slice(1); // Rem
    const toastMarkup = showToast ? (
        <Toast content={toastMessage} onDismiss={() => setShowToast(false)} />
    ) : null;

        return (
        <Frame>
            {toastMarkup}


                   <DynamicFormComponent formSchema={schema} onFormSubmit={handleFormSubmit}  entityTitle={entityTitle} />

        </Frame>
    );
};

export default FormRenderer;
