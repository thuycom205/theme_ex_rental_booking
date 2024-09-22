import React, { useState, useEffect } from 'react';
import {
    Card,
    Page,
    Layout,
    TextContainer,
    Button,
    Spinner,
    Frame,
    Modal,
    ResourceList,
    Stack,
    TextStyle,
    Heading,
    DisplayText,
    Icon,
    Select,
    Collapsible,
} from "@shopify/polaris";
import { useNavigate } from 'react-router-dom';
import { CircleTickMajor, ChevronDownMinor, ChevronUpMinor } from '@shopify/polaris-icons';
import { getSessionToken } from '@shopify/app-bridge-utils';
import { useAppBridge } from '@shopify/app-bridge-react';

export default function FBConnectPage() {
    const app = useAppBridge(); // Get the App Bridge instance
    const base64Decode = (encodedString) => {
        try {
            return atob(encodedString);
        } catch (e) {
            console.error("Failed to decode base64 string:", e);
            return null;
        }
    };
    function getEncodedStringFromStoreName(storeName) {
        const storeUrl = `admin.shopify.com/store/${storeName}`;
        const encodedString = btoa(storeUrl);
        return encodedString;
    }
    const navigate = useNavigate(); // Get the navigate function from react-router-dom
    const [shop, setShop] = useState('');
    const [host, setHost] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [adAccount, setAdAccount] = useState(null);
    const [adAccounts, setAdAccounts] = useState([]);
    const [selectedAdAccount, setSelectedAdAccount] = useState('');
    const [modalActive, setModalActive] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [faqOpen, setFaqOpen] = useState({});

    useEffect(() => {
        getSessionToken(app).then((token) => {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const hostParamb2 = decodedToken.dest.split('/')[2];
            const hostParamb = hostParamb2.split('.')[0];

            const hostParam = getEncodedStringFromStoreName(hostParamb);
            setHost(hostParam);

            const decodedHost = base64Decode(hostParam);
            const parts = decodedHost.split('/');
            const storeName = parts[parts.length - 1] + '.myshopify.com';
            setShop(hostParamb);
        }).catch(console.error);
    }, [app]);

    useEffect(() => {
        if (!shop) return;

        const fetchConnectionStatus = async () => {
            try {
                const response = await fetch(`/api/facebook/status?shop=${shop}`);
                const data = await response.json();
                setConnected(data.connected);
                if (data.connected) {
                    const adAccountResponse = await fetch(`/api/facebook/ad-accounts?shop=${shop}`);
                    const adAccountData = await adAccountResponse.json();
                    const businessAccounts = adAccountData.data.filter(account => account.account_status === 2);
                    setAdAccounts(businessAccounts);
                    const activeAccount = businessAccounts.find(account => account.is_active);
                    setAdAccount(activeAccount);
                    if (!activeAccount && businessAccounts.length > 0) {
                        setSelectedAdAccount(businessAccounts[0].ad_account_id);
                    }
                }
            } catch (error) {
                console.error('Error fetching connection status:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConnectionStatus();
    }, [shop]);


    const handleConnect = () => {
        window.location.href =  process.env.HOST + `/api/auth/facebook??shop=${shop}`;
    };

    const handleSelectChange = (value) => {
        setSelectedAdAccount(value);
    };

    const handleSetActiveAdAccount = async () => {
        try {
            const response = await fetch('/api/facebook/set-active-ad-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shop:`${shop}`,
                    ad_account_id: selectedAdAccount,
                }),
            });
            const data = await response.json();
            if (data.success) {
                setAdAccount(adAccounts.find(account => account.ad_account_id === selectedAdAccount));
                setModalMessage('Active ad account set successfully.');
            } else {
                setModalMessage('Failed to set active ad account.');
            }
        } catch (error) {
            console.error('Error setting active ad account:', error);
            setModalMessage('Error setting active ad account.');
        } finally {
            toggleModal();
        }
    };

    const toggleModal = () => setModalActive(!modalActive);

    const handleToggleFaq = (id) => {
        setFaqOpen((prevState) => ({ ...prevState, [id]: !prevState[id] }));
    };

    const handleReportClick = () => {
        navigate(`/report?shop=${shop}`);
    };
    const handleRecommendationClick = () => {
        navigate(`/recommendation/shop/${shop}/`);
    };

    if (loading) {
        return (
            <Page narrowWidth>
                <Layout>
                    <Layout.Section>
                        <Card sectioned>
                            <Spinner size="large" />
                        </Card>
                    </Layout.Section>
                </Layout>
            </Page>
        );
    }

    return (
        <Frame>
            <Page narrowWidth>
                <Layout>
                    <Layout.Section>
                        <Card sectioned>
                            <TextContainer>
                                {connected ? (
                                    adAccount ? (
                                        <>
                                            <p>Your account is connected to Facebook.</p>
                                            <Button onClick={handleConnect}>Reconnect to Facebook</Button>
                                            <Card title="Ad Account Details" sectioned>
                                                <TextContainer>
                                                    <p><strong>Ad Account Name:</strong> {adAccount.ad_account_name}</p>
                                                    <p><strong>Ad Account ID:</strong> {adAccount.ad_account_id}</p>
                                                </TextContainer>
                                            </Card>
                                            <Card title="Q&A" sectioned>
                                                <Button onClick={handleReportClick}>Report</Button>
                                                <Button onClick={handleRecommendationClick}>Recommendation</Button>
                                                <TextContainer>
                                                    <Heading>Frequently Asked Questions</Heading>
                                                    <div>
                                                        <Button
                                                            plain
                                                            onClick={() => handleToggleFaq('connect')}
                                                            ariaExpanded={faqOpen['connect']}
                                                            ariaControls="faqConnect"
                                                            icon={faqOpen['connect'] ? ChevronUpMinor : ChevronDownMinor}
                                                        >
                                                            How to connect?
                                                        </Button>
                                                        <Collapsible
                                                            open={faqOpen['connect']}
                                                            id="faqConnect"
                                                            transition={{ duration: '150ms', timingFunction: 'ease' }}
                                                        >
                                                            <TextContainer>
                                                                <p>Click on the 'Connect to Facebook' button and follow the on-screen instructions.</p>
                                                            </TextContainer>
                                                        </Collapsible>
                                                    </div>
                                                    <div>
                                                        <Button
                                                            plain
                                                            onClick={() => handleToggleFaq('reconnect')}
                                                            ariaExpanded={faqOpen['reconnect']}
                                                            ariaControls="faqReconnect"
                                                            icon={faqOpen['reconnect'] ? ChevronUpMinor : ChevronDownMinor}
                                                        >
                                                            How to reconnect?
                                                        </Button>
                                                        <Collapsible
                                                            open={faqOpen['reconnect']}
                                                            id="faqReconnect"
                                                            transition={{ duration: '150ms', timingFunction: 'ease' }}
                                                        >
                                                            <TextContainer>
                                                                <p>If you need to reconnect, simply click on the 'Reconnect to Facebook' button.</p>
                                                            </TextContainer>
                                                        </Collapsible>
                                                    </div>
                                                    <div>
                                                        <Button
                                                            plain
                                                            onClick={() => handleToggleFaq('pivot')}
                                                            ariaExpanded={faqOpen['pivot']}
                                                            ariaControls="faqPivot"
                                                            icon={faqOpen['pivot'] ? ChevronUpMinor : ChevronDownMinor}
                                                        >
                                                            How to read the result of the pivot table?
                                                        </Button>
                                                        <Collapsible
                                                            open={faqOpen['pivot']}
                                                            id="faqPivot"
                                                            transition={{ duration: '150ms', timingFunction: 'ease' }}
                                                        >
                                                            <TextContainer>
                                                                <p>The pivot table shows aggregated data based on the selected criteria. Use the filters and grouping options to customize the view according to your needs.</p>
                                                            </TextContainer>
                                                        </Collapsible>
                                                    </div>
                                                </TextContainer>
                                            </Card>
                                        </>
                                    ) : (
                                        <>
                                            <Select
                                                label="Select Active Ad Account"
                                                options={adAccounts.map(account => ({
                                                    label: account.ad_account_name,
                                                    value: account.ad_account_id,
                                                }))}
                                                onChange={handleSelectChange}
                                                value={selectedAdAccount}
                                            />
                                            <Button primary onClick={handleSetActiveAdAccount}>Set Active Ad Account</Button>
                                        </>
                                    )
                                ) : (
                                    <>
                                        <h2>Connect to Facebook</h2>
                                        <p>Connect your account to Facebook to start using our features.</p>
                                        <Button onClick={handleConnect}>Connect to Facebook</Button>
                                    </>
                                )}
                            </TextContainer>
                        </Card>
                    </Layout.Section>
                    <Modal
                        open={modalActive}
                        onClose={toggleModal}
                        title="Connection Status"
                        primaryAction={{
                            content: 'Close',
                            onAction: toggleModal,
                        }}
                    >
                        <Modal.Section>
                            <TextContainer>
                                <p>{modalMessage}</p>
                            </TextContainer>
                        </Modal.Section>
                    </Modal>
                </Layout>
            </Page>
        </Frame>
    );
}
