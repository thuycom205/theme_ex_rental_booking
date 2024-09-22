// src/bulkActions/affiliateOrderActions.js
export const getBulkActions = (selectedItems, setItems, navigate, items) => [
    {
        content: 'Approve',
        onAction: async () => {
            console.log('Approving orders:', selectedItems);
            try {
                const response = await fetch('/api/affiliate_order/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: selectedItems }),
                });
                if (!response.ok) throw new Error('Failed to approve orders');

                const { approvedOrderIds, message } = await response.json();
                let updatedItems = [];
                // Using a for loop to update items
                // Using a for loop to update items
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    // Ensure both values are integers for comparison
                    if (approvedOrderIds.map(Number).includes(Number(item.id))) {
                        updatedItems.push({ ...item, affiliate_status: 'approved' }); // Update the status to 'approved'
                        console.log(`Order ${item.id} approved.`);
                    } else {
                        updatedItems.push(item);
                    }
                }


                console.log('Updated items:', updatedItems);
                setItems(updatedItems); // Update the state with the new items array
                alert(message || 'Orders approved successfully');
            } catch (error) {
                console.error('Error approving orders:', error);
                alert('Failed to approve orders');
            }
        },
    },
    // Other actions...
];
