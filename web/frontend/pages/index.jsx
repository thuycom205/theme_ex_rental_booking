import {
    Card,
    Page,
    Layout,
    TextContainer,
    Image,
    Stack,
    Link,
    Text,
    Navigation,
    Frame,
    Button,
    Modal,
    Heading,

} from "@shopify/polaris";
import { useTranslation, Trans } from "react-i18next";
import { trophyImage,whatsapp_chat_widget_phone_configuration ,
    whatsapp_chat_widget_agents_section,whatsapp_chat_widget_multiple_agents_front_store} from "../assets";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSessionToken } from '@shopify/app-bridge-utils';
import { useAppBridge } from '@shopify/app-bridge-react';
import GuideModal from '../components/GuideModal'; // Import the GuideModal component

export default function Index() {
    const app = useAppBridge(); // Get the App Bridge instance

    const { t } = useTranslation();
    const [shop, setShop] = useState('');
    const [host, setHost] = useState('');
    const navigate = useNavigate();
    const [answerVisible, setAnswerVisible] = useState({});
    const [modalVisible, setModalVisible] = useState(false); // State to manage guide modal visibility
    const [imageModalVisible, setImageModalVisible] = useState(false); // State to manage image modal visibility
    const [selectedImage, setSelectedImage] = useState(null);

    const images = [
        whatsapp_chat_widget_phone_configuration,
        // Add more image imports here
    ];
    const toggleAnswerVisibility = (index) => {
        setAnswerVisible((prevState) => ({
            ...prevState,
            [index]: !prevState[index],
        }));
    };
    const handleModalToggle = () => {
        setModalVisible(!modalVisible);
    };
    const handlePreviewClick = () => {
        const previewUrl = `${process.env.REACT_SERVER}/api/preview/widget?shop=${shop}.myshopify.com`;
        window.open(previewUrl, '_blank');
    };
    const handleImageClick = (image) => {
        setSelectedImage(image);
        setImageModalVisible(true); // Open the image modal
    };

    const handleImageModalClose = () => {
        setImageModalVisible(false); // Close the image modal
        setSelectedImage(null); // Reset selected image
    };
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
            console.log(token);
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const hostParamb2 = decodedToken.dest.split('/')[2]; // Assuming host is part of the token's dest field
            const hostParamb = hostParamb2.split('.')[0]; // Extract the store name part only

            const hostParam = getEncodedStringFromStoreName(hostParamb);
            setHost(hostParam);
            console.log('hostParam22', hostParam);


            const decodedHost = base64Decode(hostParam);
            const parts = decodedHost.split('/');
            const storeName = parts[parts.length - 1];
            console.log('storeName', storeName);
            setShop(hostParamb);
        }).catch(console.error);
    }, [app]);

    const handleAppBlockLinkClick = () => {
        const appBlockLink = `https://${shop}.myshopify.com/admin/themes/current/editor?template=product&addAppBlockId=13c4ed99-bd4f-4e0b-a4ec-ec19dfe168ea/rental_booking&target=mainSection`;
        window.open(appBlockLink, '_blank');
    };
    return (
        <Frame

        >
            <Page narrowWidth>
                <Layout>

                    <Layout.Section>
                        <Card title="Setup rental booking Widget" sectioned>
                            <TextContainer>
                                <p>Follow these steps to set up your Rental widget:</p>
                                <ul>
                                    <li>Navigate to the rental booking Widget Settings.</li>
                                    <li>Configure the widget design and position.</li>
                                </ul>
                                <TextContainer>
                                    <Link onClick={handleAppBlockLinkClick}>
                                        Click here to add the Rental Booking App Block to your product page.
                                        Note that it works only with Storefront 2.0 themes.
                                    </Link>
                                    <p>Adding the app block is necessary to make the app fully functional on your store.</p>
                                </TextContainer>
                                <TextContainer>
                                    <Link onClick={handleModalToggle}>Guideline to use app block</Link>
                                </TextContainer>
                                <Button onClick={() => navigate(`/page_form/pricing_schemes/hostz/${host}/`)}>Set up rental products</Button>
                            </TextContainer>
                        </Card>
                    </Layout.Section>
                    <Layout.Section>
                        <Card title="Rental price scheme management sectioned" sectioned>
                            <TextContainer>
                                <p>View,edit rental price schemes and associated products.</p>
                                <Button onClick={() => navigate(`/page_tree/pricing_schemes/hostz/${host}/`)}>Rental price scheme management</Button>
                            </TextContainer>
                        </Card>
                    </Layout.Section>

                    <Layout.Section>
                        <Card title="Manage rental order" sectioned>
                            <TextContainer>
                                <p>View and manage rental orders</p>
                                <Button onClick={() => navigate(`/page_tree/rental_order/hostz/${host}/`)}>Manage rental order</Button>
                            </TextContainer>
                        </Card>
                    </Layout.Section>

                    <Layout.Section>
                        <Card title="Q&A" sectioned>
                            <TextContainer>
                                <p>Find answers to frequently asked questions.</p>
                                <ul>
                                    {[
                                        { question: "How to setup rental widget widget?", answer: "Click on the button Add rental widget to add the widget to your store." },
                                        { question: "How flat rate of rental product work?", answer: "Flat rate pricing means customers pay a fixed price to rent a product for a specific period, regardless of how long they actually use it. It's simple, transparent, and easy to understand." },
                                        { question: "How tiered rate of rental product works?", answer: "Tiered rate pricing offers a base price for an initial period, with additional charges for extended use. The longer the rental, the more the customer pays, based on pre-set rates for each time tier." },
                                        { question: "How daily rate with hourly overages works?", answer: "Daily rate pricing charges a fixed amount for a full day, with additional hourly fees if the rental extends beyond that day." },
                                    ].map((item, index) => (
                                        <li key={index}>
                                            <Text variant="bodyMd">{item.question}</Text>
                                            <Button plain onClick={() => toggleAnswerVisibility(index)}>
                                                {answerVisible[index] ? "Hide Answer" : "View Answer"}
                                            </Button>
                                            {answerVisible[index] && (
                                                <TextContainer>
                                                    <Text as="p">{item.answer}</Text>
                                                </TextContainer>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </TextContainer>
                        </Card>
                    </Layout.Section>
                </Layout>

            </Page>
            <GuideModal isVisible={modalVisible} onClose={handleModalToggle} />

        </Frame>
    );
}
