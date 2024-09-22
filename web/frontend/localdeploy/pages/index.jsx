import {
    Card,
    Page,
    Layout,
    TextContainer,
    Image,
    Stack,
    Link,
    Text,
    Frame,
    Button,
    Modal,
    Heading,
} from "@shopify/polaris";
import { useTranslation, Trans } from "react-i18next";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trophyImage, whatsapp_chat_widget_phone_configuration, whatsapp_chat_widget_agents_section, whatsapp_chat_widget_multiple_agents_front_store } from "../assets";

export default function Index() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [answerVisible, setAnswerVisible] = useState({});
    const [modalVisible, setModalVisible] = useState(false); // State to manage modal visibility
    const [imageModalVisible, setImageModalVisible] = useState(false); // State to manage image modal visibility
    const [selectedImage, setSelectedImage] = useState(null);

    // Hardcoded shop and host values
    const shop = "wapstoremuoihai.myshopify.com";
    const host = "YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvd2Fwc3RvcmVtdW9paGFp"; // Hardcoded encoded host value

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
        const previewUrl = `${process.env.REACT_SERVER}/api/preview/widget?shop=${shop}`;
        window.open(previewUrl, "_blank");
    };

    const handleImageClick = (image) => {
        setSelectedImage(image);
        setImageModalVisible(true); // Open the image modal
    };

    const handleImageModalClose = () => {
        setImageModalVisible(false); // Close the image modal
        setSelectedImage(null); // Reset selected image
    };

    return (
        <Frame>
            <Page narrowWidth>
                <Layout>
                    <Layout.Section>
                        <Card title="Setup WhatsApp Widget" sectioned>
                            <TextContainer>
                                <p>Follow these steps to set up your WhatsApp widget:</p>
                                <ul>
                                    <li>Navigate to the WhatsApp Widget Settings.</li>
                                    <li>Configure the widget design and position.</li>
                                    <li>Set up the default phone number or multiple agents.</li>
                                </ul>
                                <TextContainer>
                                    <Link onClick={handleModalToggle}>Guideline to use app block</Link>
                                </TextContainer>
                                <Button onClick={() => navigate(`/page_form/pricing_schemes/hostz/${host}/`)}>Set up rental products</Button>
                            </TextContainer>
                        </Card>
                    </Layout.Section>
                    <Layout.Section>
                        <Button onClick={handlePreviewClick}>Preview</Button>
                    </Layout.Section>
                    <Layout.Section>
                        <Card title="Setup Follow-Up Messages" sectioned>
                            <TextContainer>
                                <p>Set up message templates and coupon codes to encourage customers to complete their purchases.</p>
                                <Button onClick={() => navigate(`/page_tree/pricing_schemes/hostz/${host}/`)}>Rental products management</Button>
                            </TextContainer>
                        </Card>
                    </Layout.Section>

                    <Layout.Section>
                        <Card title="Manage Abandoned Carts" sectioned>
                            <TextContainer>
                                <p>View and manage abandoned cart checkouts. Send follow-up messages to recover lost sales.</p>
                                <Button onClick={() => navigate(`/page_tree/rental_order/hostz/${host}/`)}>Manage Order</Button>
                            </TextContainer>
                        </Card>
                    </Layout.Section>

                    <Layout.Section>
                        <Card title="Follow-Up Orders" sectioned>
                            <TextContainer>
                                <p>Manage follow-up messages for orders. View statuses and send messages with a button click.</p>
                                <Button onClick={() => navigate(`/page_tree/whatsapp_order_message/hostz/${host}/`)}>Manage Follow-Up Orders</Button>
                            </TextContainer>
                        </Card>
                    </Layout.Section>
                    <Layout.Section>
                        <Card title="Q&A" sectioned>
                            <TextContainer>
                                <p>Find answers to frequently asked questions.</p>
                                <ul>
                                    {[
                                        {
                                            question: "How to set up the WhatsApp widget?",
                                            answer: "Navigate to the WhatsApp Widget Settings and configure the widget design, position, and default phone number.",
                                        },
                                        {
                                            question: "How to set up follow-up messages?",
                                            answer: "Set up message templates and coupon codes in the Follow-Up Messages section.",
                                        },
                                        {
                                            question: "How to manage abandoned carts?",
                                            answer: "View and manage abandoned cart checkouts in the Abandoned Carts section.",
                                        },
                                        {
                                            question: "How to follow up on orders?",
                                            answer: "Manage follow-up messages for orders in the Follow-Up Orders section.",
                                        },
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
                {modalVisible && (
                    <Modal
                        open={modalVisible}
                        onClose={handleModalToggle}
                        title="Guideline to Use App Block"
                        primaryAction={{
                            content: "Close",
                            onAction: handleModalToggle,
                        }}
                    >
                        <Modal.Section>
                            <Stack vertical spacing="loose">
                                <TextContainer>
                                    <Text as="p">This is the guideline on how to use the app block. Follow these steps to properly configure and use the app block within your Shopify store.</Text>
                                </TextContainer>
                                <TextContainer>
                                    <Text as="p">Click on image to view it with full size.</Text>
                                </TextContainer>

                                <Image
                                    source={whatsapp_chat_widget_phone_configuration}
                                    alt="sync"
                                    width={120}
                                    onClick={() => handleImageClick(whatsapp_chat_widget_phone_configuration)} // Add click handler to open image modal

                                    style={{ cursor: "pointer" }} // Change cursor to pointer to indicate it's clickable
                                />
                                <Card sectioned>
                                    <TextContainer>
                                        <Heading element="h2">How to Add a WhatsApp Chat Widget to Your Storefront</Heading>

                                        <Text as="p">
                                            <strong>Access the Theme Editor:</strong>
                                        </Text>
                                        <Text as="p">
                                            In your Shopify admin area, navigate to <strong>Online Store</strong> > <strong>Themes</strong>.
                                        </Text>
                                        <Text as="p">Click the <strong>Customize</strong> button for the theme you want to edit. This will open the theme editor page.</Text>

                                        <Text as="p">
                                            <strong>Add the WhatsApp Chat Widget:</strong>
                                        </Text>
                                        <Text as="p">
                                            In the theme editor, scroll to the <strong>Footer</strong> section. Click on <strong>Add section</strong>. Switch to the <strong>App</strong> tab, and select the <strong>WhatsApp Chat Button</strong> app block to add it to the footer of your page.
                                        </Text>

                                        <Text as="p">
                                            <strong>Customize the Widget:</strong>
                                        </Text>
                                        <Text as="p">
                                            Once added, you can customize the widget’s appearance. Click on <strong>Color</strong>, and choose a color from the palette that matches your store’s branding.
                                        </Text>

                                        <Text as="p">
                                            <strong>Save Your Changes:</strong>
                                        </Text>
                                        <Text as="p">After customizing, make sure to click <strong>Save</strong> to apply the changes to your store.</Text>
                                    </TextContainer>
                                    <TextContainer>
                                        <Text as="h2" variant="headingLg">
                                            WhatsApp Chat Widget: Modes and Configuration
                                        </Text>

                                        <Text as="p">
                                            The WhatsApp Chat Widget offers two modes: <strong>Single Mode</strong> and <strong>Multiple Agents Mode</strong>.
                                        </Text>

                                        <Text as="h3" variant="headingMd">
                                            1. Single Mode:
                                        </Text>
                                        <Text as="p">
                                            This mode is ideal for stores with a single customer support representative. In this mode, the WhatsApp chat widget is displayed as a button on the bottom right or bottom left of the store. When customers click the button, they can send a WhatsApp message directly to the WhatsApp account associated with the default phone number configured in the "Default Phone" settings.
                                        </Text>

                                        <Text as="h3" variant="headingMd">
                                            2. Multiple Agents Mode:
                                        </Text>
                                        <Text as="p">
                                            This mode is suitable for stores with multiple customer support representatives. When a customer clicks the chat button in this mode, a widget displaying multiple customer support agents, along with their names and roles, will appear. The customer can then choose which agent to start a conversation with.
                                        </Text>

                                        <Image
                                            source={whatsapp_chat_widget_multiple_agents_front_store}
                                            alt="sync"
                                            width={120}
                                            onClick={() => handleImageClick(whatsapp_chat_widget_multiple_agents_front_store)} // Add click handler to open image modal

                                            style={{ cursor: "pointer" }} // Change cursor to pointer to indicate it's clickable
                                        />
                                        <Text as="p">
                                            <strong>Important Note:</strong> The default phone number linked to the WhatsApp chat widget will also be listed as one of the customer support agents. If you select the multiple agents mode, you must provide a default name and role for this contact.
                                        </Text>

                                        <Text as="h3" variant="headingMd">
                                            Customer Service Section:
                                        </Text>
                                        <Text as="p">
                                            In the <strong>Customer Service</strong> section, you will need to fill in the name, role, phone number, start time, and end time for each support agent. Additionally, you can enable or disable a customer support agent here.
                                        </Text>
                                        <Image
                                            key={1}
                                            source={whatsapp_chat_widget_agents_section}
                                            alt={`image-1`}
                                            width={120}
                                            onClick={() => handleImageClick(whatsapp_chat_widget_agents_section)} // Add click handler to open image modal
                                            style={{ cursor: "pointer" }} // Change cursor to pointer to indicate it's clickable
                                        />
                                        <Text as="p">
                                            Remember that the availability of a customer support agent is determined by their start and end times, as well as the time zone configured in the "Time Zone" field. If an agent is not available, they will be grayed out on the widget.
                                        </Text>
                                    </TextContainer>
                                </Card>
                            </Stack>
                        </Modal.Section>
                    </Modal>
                )}

                {imageModalVisible && (
                    <Modal
                        open={imageModalVisible}
                        onClose={handleImageModalClose}
                        title="WhatsApp Chat Widget Configuration"
                        large // Display the modal in large size
                    >
                        <Modal.Section>
                            <Image
                                source={selectedImage}
                                alt="WhatsApp Chat Widget Configuration"
                                style={{ maxWidth: "100%" }} // Ensure the image fits within the modal
                            />
                        </Modal.Section>
                    </Modal>
                )}
            </Page>
        </Frame>
    );
}
