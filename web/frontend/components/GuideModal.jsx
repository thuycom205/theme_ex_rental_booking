import React from 'react';
import { Modal, TextContainer, Button, Heading, Image } from "@shopify/polaris";
import { embedded_block } from "../assets/index.js";

function GuideModal({ isVisible, onClose }) {
    return (
        <Modal
            open={isVisible}
            onClose={onClose}
            title="Guideline to Use App Block"
            primaryAction={{
                content: 'Got it',
                onAction: onClose,
            }}
        >
            <Modal.Section>
                <TextContainer>
                    <Heading>Step-by-Step Guide</Heading>

                    <div>Method 1</div>
                    <p>
                        Click on the link with the text "Configure the widget design and position.
                        Click here to add the Rental Booking App Block to your product page. Note that it works only with Storefront 2.0 themes."
                        This will automatically add the app block to your product page. Remember to save your changes.
                    </p>

                    <div>Method 2</div>
                    <p>Follow these steps to manually add and configure the Rental Booking App Block:</p>
                    <ol>
                        <li>Go to your Shopify Admin dashboard.</li>
                        <li>Navigate to the "Themes" section under "Online Store". Ensure that your current theme is compatible
                            with Storefront 2.0.</li>
                        <li>Click on "Customize" next to your current theme.</li>
                        <li>In the theme editor, select the "Product" template from the dropdown.</li>
                        <li>Click on "Add section" or "Add block" within the main content area.</li>
                        <li>Find the "Rental Booking App Block" and click "Add".</li>
                        <li>Configure the block as per your preferences and click "Save".</li>
                    </ol>

                    <Image alt="Embedded block demo" source={embedded_block}  width={400}/>
                </TextContainer>
            </Modal.Section>
        </Modal>
    );
}

export default GuideModal;
