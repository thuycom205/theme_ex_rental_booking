import React, { useState, useEffect } from 'react';
import { Page, Card, Button, Layout, DataTable, Stack, Modal, Icon, Badge } from '@shopify/polaris';
import { TickSmallMinor } from '@shopify/polaris-icons';
import { getSessionToken } from '@shopify/app-bridge-utils';
import { useAppBridge } from '@shopify/app-bridge-react';

const SubscriptionPage = () => {
    const app = useAppBridge(); // Get the App Bridge instance
    const [shop, setShop] = useState('');
    const [host, setHost] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [currentPlan, setCurrentPlan] = useState(null);

    const freeFeatures = [
        ['Customer Support Agents', '5 customer support agents'],
        ['Abandoned Cart Follow Up Messages', '100 abandoned cart follow up messages'],
        ['Follow Up Messages for Orders', '100 follow up messages for orders'],
    ];

    const paidFeatures = [
        ['Customer Support Agents', 'Unlimited agents'],
        ['Abandoned Cart Follow Up Messages', 'Unlimited abandoned cart follow up messages'],
        ['Follow Up Messages for Orders', 'Unlimited follow up messages for orders'],
    ];
    const base64Decode = (encodedString) => {
        try {
            return atob(encodedString);
        } catch (e) {
            console.error("Failed to decode base64 string:", e);
            return null;
        }
    };

    useEffect(() => {
        function getEncodedStringFromStoreName(storeName) {
            const storeUrl = `admin.shopify.com/store/${storeName}`;
            const encodedString = btoa(storeUrl);
            return encodedString;
        }

        getSessionToken(app).then((token) => {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const hostParamb2 = decodedToken.dest.split('/')[2];
            const hostParamb = hostParamb2.split('.')[0];

            const hostParam = getEncodedStringFromStoreName(hostParamb);
            setHost(hostParam);

            const decodedHost = base64Decode(hostParam);
            const parts = decodedHost.split('/');
            const storeName = parts[parts.length - 1];
            setShop(hostParamb);
        }).catch(console.error);
    }, [app]);

    useEffect(() => {
        if (shop) {
            fetch(`/api/recurring-charges/active?shop=${shop}.myshopify.com`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.length > 0) {
                        setCurrentPlan(data[0]); // Assuming the API returns an array of active plans
                    }
                })
                .catch(error => {
                    console.error('Error fetching current plan:', error);
                });
        }
    }, [shop]);

    const handleSubscribe = async () => {
        try {
            const response = await fetch('/api/create-charge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shop: shop + '.myshopify.com',
                }),
            });

            const data = await response.json();

            if (data.confirmation_url) {
                window.open(data.confirmation_url, '_blank');
            } else {
                setShowModal(true);
                setModalContent('Subscription failed: ' + data.error);
            }
        } catch (error) {
            console.error('Subscription error:', error);
            setShowModal(true);
            setModalContent('Subscription error: ' + error.message);
        }
    };

    const handleSubscribeFreePlan = async () => {
        try {
            const response = await fetch('/api/create-charge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shop: shop + '.myshopify.com',
                    plan: 'free'
                }),
            });

            const data = await response.json();

            if (data.confirmation_url) {
                window.open(data.confirmation_url, '_blank');
            } else {
                setShowModal(true);
                setModalContent('Subscription failed: ' + data.error);
            }
        } catch (error) {
            console.error('Subscription error:', error);
            setShowModal(true);
            setModalContent('Subscription error: ' + error.message);
        }
    };

    const handleUnsubscribe = async () => {
        if (!currentPlan) return;

        try {
            const response = await fetch(`/api/plan/unsubscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shop: shop + '.myshopify.com',
                    charge_id: currentPlan.charge_id,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCurrentPlan(null); // Clear the current plan after successful unsubscription
                setShowModal(true);
                setModalContent('You have successfully unsubscribed.');
            } else {
                setShowModal(true);
                setModalContent('Unsubscription failed: ' + data.error);
            }
        } catch (error) {
            console.error('Unsubscription error:', error);
            setShowModal(true);
            setModalContent('Unsubscription error: ' + error.message);
        }
    };

    const isPaidPlanSelected = currentPlan && (currentPlan.name === '$9.9 Monthly Plan' || currentPlan.name === '$9.90 Monthly Plan');

    const selectedCardStyle = {
        border: '2px solid #5C6AC4',
        position: 'relative',
    };

    const tickIconStyle = {
        position: 'absolute',
        top: '10px',
        right: '10px',
    };

    return (
        <Page title="Subscription Plans">
            <Layout>
                <Layout.Section>
                    <Stack vertical spacing="loose">
                        <Card
                            title={
                                <Stack alignment="center">
                                    <span>Free Scheme</span>
                                    {!isPaidPlanSelected && <Badge status="success">Selected</Badge>}
                                </Stack>
                            }
                            sectioned
                            style={!isPaidPlanSelected ? selectedCardStyle : {}}
                        >
                            <DataTable
                                columnContentTypes={['text', 'text']}
                                headings={['Feature', 'Description']}
                                rows={freeFeatures}
                            />
                            {!isPaidPlanSelected && (
                                <div style={tickIconStyle}>
                                    <Icon source={TickSmallMinor} color="highlight" />
                                </div>
                            )}
                        </Card>
                        <Card
                            title={
                                <Stack alignment="center">
                                    <span>$9.90 per Month Scheme with 7 days free trial</span>
                                    {isPaidPlanSelected && <Badge status="success">Selected</Badge>}
                                </Stack>
                            }
                            sectioned
                            style={isPaidPlanSelected ? selectedCardStyle : {}}
                        >
                            <DataTable
                                columnContentTypes={['text', 'text']}
                                headings={['Feature', 'Description']}
                                rows={paidFeatures}
                            />
                            {isPaidPlanSelected ? (
                                <Button onClick={handleUnsubscribe} destructive fullWidth>
                                    Unsubscribe from $9.90 Plan
                                </Button>
                            ) : (
                                <Button onClick={handleSubscribe} primary fullWidth>
                                    Subscribe to $9.90 Plan
                                </Button>
                            )}
                            {isPaidPlanSelected && (
                                <div style={tickIconStyle}>
                                    <Icon source={TickSmallMinor} color="highlight" />
                                </div>
                            )}
                        </Card>
                    </Stack>
                </Layout.Section>
            </Layout>
            {showModal && (
                <Modal
                    open={showModal}
                    onClose={() => setShowModal(false)}
                    title="Subscription Status"
                    primaryAction={{
                        content: 'Close',
                        onAction: () => setShowModal(false),
                    }}
                >
                    <Modal.Section>
                        <p>{modalContent}</p>
                    </Modal.Section>
                </Modal>
            )}
        </Page>
    );
};

export default SubscriptionPage;
