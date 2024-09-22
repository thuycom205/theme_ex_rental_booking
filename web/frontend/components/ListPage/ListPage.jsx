import React, { useState, useCallback, useEffect } from 'react';
import {
    Page,
    Button,
    ResourceList,
    Card,
    ResourceItem,
    TextStyle,
    Stack,
    Pagination,
    EmptyState,
    Frame,
    Toast, Select,
} from '@shopify/polaris';
import { QuestionMarkMajor,QuestionMarkMinor } from '@shopify/polaris-icons';
import { Tooltip, Icon } from '@shopify/polaris';

// import { useNavigate } from "@shopify/app-bridge-react";
import { useLocation, useNavigate } from "react-router-dom";
import {useShop} from "../providers/ShopProvider";
import { getEntityActionHandlers } from './entityActionHandlers';
import { getShortcutActions } from './shortcutActionHandlers';
import { getBulkActions } from './bulkActionsRegistry';  // Updated import
import { Spinner } from '@shopify/polaris'; // Import Spinner for loading indicator

function useForceUpdate() {
    const [, setTick] = useState(0);
    const update = useCallback(() => {
        setTick(tick => tick + 1);
    }, []);
    return update;
}
const ListPage = ({ title, resourceName, fetchUrl, deleteUrl, createUrl, editUrl, itemsPerPage = 50 ,entity ,schema}) => {
    const forceUpdate = useForceUpdate();

    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const editId = query.get('id'); // Assuming the URL parameter name is 'id'

    const  navigate = useNavigate();
    // Improved logic to use shopxName or fall back to localStorage
    //todo: fixit
    const [shop, setShop] = useState('');

    const [host,setHost] = useState('');
    const actionHandlers = getEntityActionHandlers(entity, navigate, shop, 'token');

    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalItemCount, setTotalItemCount] = useState(0);
    const [assignMapId, setAssignMapId] = useState(null);

    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastError, setToastError] = useState(false);
    const [bulkActions, setBulkActions] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // State to track loading
    const [filters, setFilters] = useState({
        rental_status: '',
        time_unit: ''
    });

    const base64Decode = (encodedString) => {
        try {
            return atob(encodedString);
        } catch (e) {
            console.error("Failed to decode base64 string:", e);
            return null;
        }
    };
    useEffect(() => {
        //update the shop name
        const url = window.location.href;
        const match = url.match(/hostz\/([^\/]+)/);
        if (match) {
            const encodedString = match[1];
            console.log("Encoded String:", encodedString);
            const decodedHost = base64Decode(encodedString);
            console.log('decodedHost ' + decodedHost);
            setHost(decodedHost);
            const parts = decodedHost.split('/');
            const storeName = parts[parts.length - 1];
            setShop(storeName + ".myshopify.com");
        } else {
            console.log("Encoded String not found.");
        }

    }, []);
    useEffect(() => {
        const handleDeleteSelected = async () => {
            console.log('Selected items to delete:', selectedItems);
            try {
                const response = await fetch(deleteUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: selectedItems, shop_name: shop }),
                });
                if (!response.ok) throw new Error('Network response was not ok.');
                const data = await response.json();
                setToastMessage(data.message || 'Items deleted successfully.');
                setToastActive(true);
                const remainingItems = items.filter(item => !selectedItems.includes(item.id.toString()));
                setItems(remainingItems);
            } catch (error) {
                console.error('Error:', error);
                setToastMessage('Failed to delete items.');
                setToastActive(true);
            }
        };

        setBulkActions([
            {
                content: 'Delete',
                onAction: handleDeleteSelected,
            },
            // Load other dynamic actions as needed
        ]);
    }, [deleteUrl, selectedItems, shop, items]);


    useEffect(() => {
        // Define default actions that apply to all entities
        const defaultBulkActions = [
            {
                content: 'Delete',
                onAction: async () => {
                    console.log('Deleting selected items:', selectedItems);
                    try {
                        const response = await fetch(deleteUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ids: selectedItems,shop_name:shop })
                        });
                        if (!response.ok) throw new Error('Failed to delete items.');

                        // Update the UI to reflect the deletion
                        setItems(prevItems => prevItems.filter(item => !selectedItems.includes(item.id)));

                        setSelectedItems([]);
                        alert('Items deleted successfully.');
                    } catch (error) {
                        console.error('Error deleting items:', error);
                        alert('Failed to delete items.');
                    }
                }
            }
        ];

        const entitySpecificActions = getBulkActions(entity).map(action => ({
            content: action.content,
            helpText: action.helpText? action.helpText: '',
            onAction: () => {
                action.handler(selectedItems, setItems, items,setSelectedItems, setIsLoading);
                forceUpdate(); // This forces the component to re-render after the action
            }
        }));
        // Combine default and entity-specific actions
        const combinedBulkActions = [...defaultBulkActions, ...entitySpecificActions];
        setBulkActions(combinedBulkActions);


        //fixit:fao
        if (entity == 'whatsapp_ao_message' || entity == 'whatsapp_order_message') {
            const whatsappBulkActions = [
                {
                    content: 'Send Message',
                    onAction: async () => {

                    }
                }
            ];
        }

        //fixit:fao
        // Any other setup logic for page load
    }, [entity, selectedItems, items, deleteUrl]);


    const toggleActive = useCallback(() => setToastActive((active) => !active), []);
    const toastMarkup = toastActive ? (
        <Toast content={toastMessage} onDismiss={toggleActive} error={toastError} />
    ) : null;
    const handleNextPage = useCallback(() => {
        setCurrentPage(currentPage + 1);
    }, [currentPage]);
    const toggleToastActive = useCallback(() => {
        setToastActive((active) => !active);
    }, []);

    const renderAdditionalFields = (item) => {
        // Assuming schema.tree.fields exists and is an array
        return schema.tree.fields.map((field) => {
            switch (field.type) {
                case 'text':
                    return <div key={field.name}>{field.label}: {item[field.name]}</div>;
                // You can handle other types (e.g., 'select') similarly
                default:
                    return null;
            }
        });
    };

    const handlePreviousPage = useCallback(() => {
        setCurrentPage(currentPage - 1);
    }, [currentPage]);

    const handleSelectionChange = useCallback((items) => {
        setSelectedItems(items);
    }, []);
    const fetchData = useCallback(async (storezName) => {
        setIsLoading(true);
        const params = {
            shop_name: storezName,
            page: currentPage,
            items_per_page: itemsPerPage,
            filter: filters // Include filters in the request
        };

        try {
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setItems(data.items);
            setTotalItemCount(data.totalItemCount);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filters, currentPage, itemsPerPage, fetchUrl]);
    const fetchDataLiveOrder = useCallback(async (storezName) => {
        if (entity !== 'rental_order') return;

        setIsLoading(true);
        try {
            const params = { shop_name: storezName };
            const fetchLiveOrderUrl = `/api/${entity}/fetchListCO`;

            const response = await fetch(fetchLiveOrderUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Handle data as needed
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setIsLoading(false);
        }
    }, [entity]);

    useEffect(() => {
        // Fetch data whenever filters change
        const initializeDataFetch = async () => {
            const url = window.location.href;
            const match = url.match(/hostz\/([^\/]+)/);
            let storezName;

            if (match) {
                const encodedString = match[1];
                const decodedHost = base64Decode(encodedString);
                const parts = decodedHost.split('/');
                const storeName = parts[parts.length - 1];
                setShop(storeName + '.myshopify.com');
                storezName = storeName + '.myshopify.com';
            }
            if (entity === 'rental_order') {
                await fetchDataLiveOrder(storezName);
            }
            await fetchData(storezName);
        };

        initializeDataFetch();
    }, [filters, currentPage, itemsPerPage, fetchUrl, location, entity]);

    const handleRefresh = useCallback(async () => {
        const url = window.location.href;
        const match = url.match(/hostz\/([^\/]+)/);
        let storezName;

        if (match) {
            const encodedString = match[1];
            const decodedHost = base64Decode(encodedString);
            const parts = decodedHost.split('/');
            const storeName = parts[parts.length - 1];
            storezName = storeName + '.myshopify.com';
        }

        if (entity === 'rental_order') {
            await fetchDataLiveOrder(storezName);
        }

        await fetchData(storezName);
    }, [entity, fetchData, fetchDataLiveOrder]);

    const handleCreateNew = useCallback(() => {
        const url = window.location.href;
        const match = url.match(/hostz\/([^\/]+)/);
        let hostPart = '';
        if (match) {
            hostPart = `hostz/${match[1]}/`;
        }
        navigate(`/${hostPart}${createUrl}?editId=0`);
    }, [createUrl, navigate]);

    const handleEdit = useCallback((id) => {
        const url = window.location.href;
        const match = url.match(/hostz\/([^\/]+)/);
        let hostPart = '';
        if (match) {
            hostPart = `hostz/${match[1]}/`;
        }
        navigate(`/${hostPart}${editUrl}?editId=${id}&shop_name=${shop}`);
    }, [editUrl, navigate, shop]);

    const handleAssignProduct =useCallback((id,name) => {
        console.log(id);
        setAssignMapId(id);
        window.assign_map_id = id;
        window.assign_map_name = name;
        console.log(assignMapId);
        // Use the editUrl to navigate to the edit page
        navigate('/page_seat_assign_product' + `?editId=${id}` + `&shop_name=${shop}`) ;
    },[assignMapId]);



    const handleAssignProducts = useCallback(async () => {
        console.log(selectedItems);

    },[ selectedItems]);
    const handleFilterChange = useCallback((filterName, value) => {
        console.log('Filter changed:', filterName, value);
        setFilters((prevFilters) => {
            const newFilters = {
                ...prevFilters,
                [filterName]: value,
            };
            console.log('Updated filters:', newFilters);
            return newFilters;
        });
    }, []);
    const renderFilters = () => {
        if (!schema || !schema.tree || !schema.tree.filters) return null;

        return (
            <Card sectioned title="Filters">
                {Object.entries(schema.tree.filters).map(([filterName, filterConfig]) => (
                    <Select
                        key={filterName}
                        label={filterConfig.label}
                        options={filterConfig.options.map(opt => ({ label: opt.label, value: opt.value }))}
                        onChange={(value) => handleFilterChange(filterName, value)}
                        value={filters[filterName]}
                    />
                ))}
            </Card>
        );
    };

    const renderContent = useCallback(() => {
        if (items.length === 0 && totalItemCount === 0) {
            return (
                <EmptyState
                    heading={`No ${resourceName.plural.toLowerCase()} found`}
                    action={{
                        content: `Create ${resourceName.singular}`,
                        onAction: handleCreateNew,
                    }}
                >
                    <p>Click the button to start creating a new item.</p>
                </EmptyState>
            );
        } else {
            return (
                <ResourceList
                    resourceName={resourceName}
                    items={items}
                    selectedItems={selectedItems}
                    onSelectionChange={handleSelectionChange}
                    bulkActions={bulkActions}
                    renderItem={(item) => {
                        const { id, title } = item;
                        const shortcutActions = getShortcutActions(editId, entity, item, actionHandlers, schema.tree.actions);

                        return (
                            <ResourceItem
                                id={id.toString()}
                                accessibilityLabel={`Edit ${title}`}
                                name={title}
                                persistActions
                                shortcutActions={shortcutActions}
                            >
                                {renderAdditionalFields(item)}
                            </ResourceItem>
                        );
                    }}
                />
            );
        }
    }, [items, resourceName, selectedItems, bulkActions, totalItemCount, handleCreateNew, handleSelectionChange, editId, entity, actionHandlers, schema.tree.actions]);
    if (isLoading) {
        console.log('is loading');
        return <Spinner accessibilityLabel="Loading items" size="large" />;
    }

    const helpText= schema.tree.helpText?schema.tree.helpText:`Showing ${items.length} of ${totalItemCount} ${resourceName.plural.toLowerCase()}`;
    return (
            <Page
                title={title}

                helpText={helpText}
            >
                <Stack alignment="center" spacing="tight">
                    <span style={{ marginRight: '8px' }}>Help</span>
                    <Tooltip content={helpText} dismissOnMouseOut>
                        <div style={{ display: 'inline-block', lineHeight: 0, verticalAlign: 'middle' }}>
                            <Icon source={QuestionMarkMinor} color="highlight" />
                        </div>
                    </Tooltip>
                    {entity === 'rental_order' && (
                        <Tooltip
                            content="Fetch the latest rental orders from Shopify"
                            dismissOnMouseOut
                        >
                            <Button
                                onClick={handleRefresh}
                                primary
                                icon="refresh"
                                style={{ marginLeft: '8px' }}
                            >
                                Refresh
                            </Button>
                        </Tooltip>
                    )}

                </Stack>
                {renderFilters()}

                <Card sectioned>
                    {renderContent()}
                </Card>
                {toastMarkup}
                  <Stack distribution="trailing">
                        <Pagination
                            hasPrevious={currentPage > 1}
                            onPrevious={handlePreviousPage}
                            hasNext={currentPage * itemsPerPage < totalItemCount}
                            onNext={handleNextPage}
                        />
                  </Stack>
            </Page>
    );
};

export default ListPage;
