export const payoutActions = {
    approve: (setFormData, formData) => {
        console.log("Approving payout...");
        // Logic to update formData
        const updatedData = { ...formData, status: 'approved' };
        setFormData(updatedData);
    },
    // Additional actions can be added here
};

export default payoutActions;
