// In a separate file, define various action handlers
export const navigateAction = (navigate, button, entity, id) => {
    navigate(`${button.target}?entity=${entity}&id=${id}`);
};

export const approve =async (entity, id,formData,updateFormData,shop) => {
    console.log('Approving...');
    console.log('Entity:', entity);
    console.log('ID:', id);
    updateFormData(prevFormData => ({
        ...prevFormData,   // Spread the existing formData
        name: "thuy"       // Set the name to "thuy"
    }));    // Some custom action code
    try {
        const response = await fetch(`/api/${entity}/approve`, {
            method: 'POST',
            body: JSON.stringify({
                id: id,
                shop_name: shop
            }),

            // other fetch options
        });
        const data = await response.json();
        if (data.success) {
            // Call updateFormData with the new data to update the context
            updateFormData(data.updatedEntity);
            console.log('Approval successful, formData updated.');
        } else {
            throw new Error('Approval failed.');
        }
    } catch (error) {
        console.error('Error during approval:', error);
    }
};

// Add more action handlers as needed...
