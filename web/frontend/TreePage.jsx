import React, { useEffect, useState } from 'react';
import { Frame, Page } from '@shopify/polaris';
import ListPage from './components/ListPage/ListPage';
import { useParams, useNavigate } from 'react-router-dom';

const TreePage = () => {
    const navigate = useNavigate();
    const { entity } = useParams();
    const [schema, setSchema] = useState(null);

    useEffect(() => {
        // Load the appropriate schema based on the entity
        import(`./schema/schema_${entity}.json`)
            .then((loadedSchema) => {
                setSchema(loadedSchema);
            })
            .catch((error) => {
                console.error(`Failed to load schema for entity ${entity}:`, error);
                // Handle the error or set a default schema
            });
    }, [entity]);

    // Fallback or loading state
    if (!schema) {
        return <div>Loading...</div>;
    }

    // Define URLs and other properties based on the entity
    const fetchUrl = `/api/${entity}/fetchList`;
    const deleteUrl = `/api/${entity}/delete`;
    const createUrl = `/page_form/${entity}`;
    const editUrl = `/page_form/${entity}`;

    // Define title and resource name
    const title = schema.title?schema.title:entity.charAt(0).toUpperCase() + entity.slice(1);

    // const title = `${entity.charAt(0).toUpperCase() + entity.slice(1)} List`;
    const resourceName = {
        singular: entity.charAt(0).toUpperCase() + entity.slice(1),
        plural: `${entity.charAt(0).toUpperCase() + entity.slice(1)}s`,
    };

    return (
        <Frame>
            <Page
                secondaryActions={[
                    {
                        content: 'Back to Home',
                        onAction: () => navigate('/'),
                    },
                ]}
            >
                <ListPage
                    title={title}
                    resourceName={resourceName}
                    fetchUrl={fetchUrl}
                    deleteUrl={deleteUrl}
                    createUrl={createUrl}
                    editUrl={editUrl}
                    entity={entity}
                    schema={ schema}
                />
            </Page>
        </Frame>
    );
};

export default TreePage;
