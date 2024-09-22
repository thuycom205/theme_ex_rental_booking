import React, { useState } from 'react';
import { Card, FormLayout, TextField, Button, Stack } from '@shopify/polaris';

const KolSpecificComponent = ({ formData }) => {
    const [kolData, setKolData] = useState({
        instagramFollowers:  0,

    });

    const handleChange = (value, field) => {
        setKolData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        console.log('Updated KOL Data:', kolData);
        // Typically, you would send this data back to the server here
        alert('KOL data has been updated!');
    };

    console.log('KOL Data:', kolData);
    console.log('KOL Data:', formData);
    return (
        <Card sectioned>
            <FormLayout>
                <TextField
                    label="Instagram Followers"
                    type="number"
                    value={kolData.instagramFollowers.toString()}
                    onChange={(value) => handleChange(value, 'instagramFollowers')}
                    autoComplete="off"
                />

                <Stack distribution="trailing">
                    <Button primary onClick={handleSubmit}>Update KOL Data</Button>
                </Stack>
            </FormLayout>
        </Card>
    );
};

export default KolSpecificComponent;
