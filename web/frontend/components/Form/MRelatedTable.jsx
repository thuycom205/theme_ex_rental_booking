import React from 'react';
import {Card, IndexTable, Button, Icon, TextStyle} from '@shopify/polaris';
import {DragDropContext, Draggable, Droppable} from 'react-beautiful-dnd';
import { DeleteMinor } from '@shopify/polaris-icons';
const MRelatedTable = ({ tableName, tableData, displayColumns, onOpenPicker, onDeleteItem ,reorderable,onReorder}) => {
    const resourceName = { singular: 'item', plural: 'items' };
    const onDragEnd = (result) => {
        if (!result.destination) return;

        const reorderedItems = Array.from(tableData);
        const [reorderedItem] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, reorderedItem);

        // Call the passed onReorder function with the new reordered items
        onReorder(reorderedItems);
    };
    if (tableData.length === 0|| tableData[0] == null) {
        return (
            <Card  sectioned>
                <TextStyle variation="subdued">There are no existing items. Click the button below to start adding items.</TextStyle>
            </Card>
        );
    }
    const rowMarkup = tableData.map((item, index) => (
        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>

                    <IndexTable.Row id={index.toString()} key={index} position={index}>
                        {displayColumns.map((column, colIndex) => (
                            <IndexTable.Cell key={`${index}-${colIndex}`}>
                                {column.type === 'thumbnail' ? (
                                    // Render an image if the column type is 'thumbnail'
                                    <img src={item[column.name]} alt="" style={{ width: '50px', height: 'auto' }} />
                                ) : (
                                    // Display the item's property as text for other column types
                                    item[column]
                                )}
                            </IndexTable.Cell>
                        ))}
                        <IndexTable.Cell>
                            <Button plain icon={<Icon source={DeleteMinor} />} onClick={() => onDeleteItem(index)} />
                        </IndexTable.Cell>
                    </IndexTable.Row>
                </div>
            )}
        </Draggable>

    ));

    return (

        <>

            <Card>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="droppable">
                        {(provided, snapshot) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                <IndexTable
                                    resourceName={resourceName}
                                    itemCount={tableData.length}
                                    headings={displayColumns.map(column => ({ title: column })).concat({ title: '' })}
                                    selectable={false}
                                >
                                    {rowMarkup}
                                    {provided.placeholder}

                                </IndexTable>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </Card>
        </>
    );
};
export default MRelatedTable;
