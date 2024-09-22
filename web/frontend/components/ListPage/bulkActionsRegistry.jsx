// Define all possible bulk actions here
const bulkActionsConfig = {
    affiliate_order: [
        {
            content: 'Approve',
            helpText: 'Approve selected orders will increase the balance amout of KOL and create the transaction for the affiliate',
            handler: async (selectedItems, setItems, items,setSelectedItems,setIsLoading) => {
                setIsLoading(true); // Start the spinner

                console.log('Approving orders:', selectedItems);
                try {
                    const response = await fetch('/api/affiliate_order/approve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: selectedItems }),
                    });
                    if (!response.ok) throw new Error('Failed to approve orders');

                    const { approvedOrderIds, message } = await response.json();

                    // Convert approvedOrderIds to strings for consistent comparison
                    const approvedIdsSet = new Set(approvedOrderIds.map(id => id.toString()));

                    // const updatedItems = items.map(item => {
                    //     // Convert item.id to string for consistent comparison
                    //     return approvedIdsSet.has(item.id.toString()) ?
                    //         { ...item, affiliate_status: 'approved', campaign_name:'thuy' } :
                    //         item;
                    // });
                    //
                    // console.log('Updated items:', updatedItems);
                    // setItems(updatedItems); // Update the state with the new items array
                    const updatedItems = items.map(item => {
                        const isApproved = approvedIdsSet.has(item.id.toString());
                        if (isApproved) {
                            return { ...item, affiliate_status: 'approved' };
                        }
                        return item;
                    });

// Use the spread operator to create a new array
                    setItems([...updatedItems]);
                    setSelectedItems([])
                    alert(message || 'Orders approved successfully');
                } catch (error) {
                    console.error('Error approving orders:', error);
                    alert('Failed to approve orders');
                }
                finally {
                    setIsLoading(false); // Stop the spinner
                }
            }
        }
    ],
    // Add other entities and their actions here
};

export const getBulkActions = (entity) => bulkActionsConfig[entity] || [];
