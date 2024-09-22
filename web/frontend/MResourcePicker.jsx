import React, { useState, useEffect } from 'react';
import { Modal, TextField, IndexTable, Card, Button,Spinner, useIndexResourceState } from '@shopify/polaris';

// import {useShop} from "./components/providers/ShopProvider.jsx";

const MResourcePicker = ({ activeTable, isOpen, onClose, onAddItems }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const {shopxName, setShopxName } = useState('');


    const [items, setItems] = useState([]);
    const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(items);
    const [selectedItemsInfo, setSelectedItemsInfo] = useState([]);


    useEffect(() => {
        if (activeTable && isOpen) {
            fetchItems();
        }
    }, [activeTable, isOpen]);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/${activeTable.relatedTableName}/fetchList`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shop_name: shopxName,
                    search_term: searchTerm,
                    search_column: activeTable.searchableColumn

                }),
            });

            if (response.ok) {
                const data = await response.json();
                setItems(data.items);
            } else {
                throw new Error('Network response was not ok');
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
        }
        setIsLoading(false);
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            fetchItems();
        }
    };
    const handleSearch1 = (e) => {
            fetchItems();
    };
    useEffect(() => {
        const newSelectedItemsInfo = selectedResources.map(id => items.find(item => item.id.toString() === id)).filter(Boolean);
        setSelectedItemsInfo(newSelectedItemsInfo);
    }, [selectedResources, items]);

    const handleAddItems = () => {
        if (activeTable) {
            onAddItems(activeTable.name, selectedItemsInfo);
            onClose();
        }
    };

    const resourceName = { singular: 'item', plural: 'items' };

    return (
        <div>
            {activeTable && (
                <Modal
                    open={isOpen}
                    onClose={onClose}
                    title={`Browse ${activeTable.label}`}
                    primaryAction={{ content: 'Add Selected', onAction: handleAddItems }}
                    secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
                >
                    <Modal.Section>
                        <TextField
                            value={searchTerm}
                            onChange={(value) => setSearchTerm(value)}
                            label={`Search ${activeTable.label}`}
                            placeholder="Type to search"
                            onKeyDown={handleSearch}
                            connectedRight={isLoading ? <Spinner size="small" /> : null}
                        />
                        <Button onClick={handleSearch1}>Search </Button>
                        <Card>
                            <IndexTable
                                resourceName={resourceName}
                                itemCount={items.length}
                                selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
                                onSelectionChange={handleSelectionChange}
                                headings={[{ title: 'Name' }]}
                            >
                                {items.map((item, index) => (
                                    <IndexTable.Row
                                        id={item.id.toString()}
                                        key={item.id}
                                        selected={selectedResources.includes(item.id.toString())}
                                        position={index}
                                    >
                                        {activeTable.displayColumns.map((column, colIndex) => (
                                            <IndexTable.Cell key={`${item.id}-${colIndex}`}>
                                                {item[column]}
                                            </IndexTable.Cell>
                                        ))}
                                    </IndexTable.Row>
                                ))}
                            </IndexTable>
                        </Card>
                    </Modal.Section>
                </Modal>
            )}
        </div>
    );
};

export default MResourcePicker;
