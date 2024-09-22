import {
    Card,
    Page,
    Layout,
    TextContainer,
    Button,
    Stack,
    RadioButton,
    FormLayout,
    TextField,
    Select,
    IndexTable,
    Thumbnail,
} from "@shopify/polaris";
import { TitleBar, ResourcePicker } from "@shopify/app-bridge-react";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

export default function PricingSchemePage() {
    const { t } = useTranslation();
    const [selectedScheme, setSelectedScheme] = useState(null);
    const [pricingDetails, setPricingDetails] = useState({
        initialPeriod: "",
        initialRate: "",
        subsequentRate: "",
        timeUnit: "hours", // Default time unit
    });
    const [isPickerOpen, setPickerOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [shopName, setShopName] = useState("your-shop-name.myshopify.com"); // Update with actual shop name

    const handleSchemeChange = (value) => {
        setSelectedScheme(value);
        setPricingDetails({
            initialPeriod: "",
            initialRate: "",
            subsequentRate: "",
            timeUnit: "hours", // Reset time unit on scheme change
        });
    };

    const handleInputChange = (field) => (value) => {
        setPricingDetails((prevDetails) => ({
            ...prevDetails,
            [field]: value,
        }));
    };

    const handleNext = () => {
        setPickerOpen(true); // Open the Resource Picker
    };

    const handlePickerSelection = (resources) => {
        setSelectedProducts(resources.selection);
        setPickerOpen(false);
    };

    const handleDeleteProduct = useCallback((id) => {
        setSelectedProducts((prevProducts) =>
            prevProducts.filter((product) => product.id !== id)
        );
    }, []);

    const handleSaveAndNext = async () => {
        try {
            // Save the pricing scheme to the server
            const pricingSchemeResponse = await fetch("/api/pricing-schemes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    scheme_type: selectedScheme,
                    initial_period: pricingDetails.initialPeriod,
                    initial_rate: pricingDetails.initialRate,
                    subsequent_rate: pricingDetails.subsequentRate,
                    time_unit: pricingDetails.timeUnit,
                    rental_limit: pricingDetails.rentalLimit || null,
                    membership_fee: pricingDetails.membershipFee || null,
                    shop_name: shopName,
                }),
            });

            if (!pricingSchemeResponse.ok) {
                throw new Error("Failed to save pricing scheme");
            }

            const pricingScheme = await pricingSchemeResponse.json();

            // Save the selected products to the server with the pricing scheme
            const productPricingPromises = selectedProducts.map((product) =>
                fetch("/api/product-pricing-schemes", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        product_id: product.id,
                        product_handler: product.handle,
                        product_img: product.images[0]?.originalSrc || "",
                        product_name: product.title,
                        pricing_scheme_id: pricingScheme.id,
                    }),
                })
            );

            await Promise.all(productPricingPromises);

            console.log("Pricing scheme and products saved successfully");
        } catch (error) {
            console.error("Error saving pricing scheme or products:", error);
        }
    };

    return (
        <Page narrowWidth>
            <TitleBar title={t("PricingSchemePage.title")} primaryAction={null} />
            <Layout>
                <Layout.Section>
                    <TextContainer>
                        <h2>{t("PricingSchemePage.choosePricingScheme")}</h2>
                    </TextContainer>
                    <Card sectioned>
                        <Stack vertical>
                            <RadioButton
                                label={t("PricingSchemePage.tieredHourlyPricing")}
                                checked={selectedScheme === "tieredHourly"}
                                onChange={() => handleSchemeChange("tieredHourly")}
                            />
                            <RadioButton
                                label={t("PricingSchemePage.dailyRateWithOverages")}
                                checked={selectedScheme === "dailyRate"}
                                onChange={() => handleSchemeChange("dailyRate")}
                            />
                            <RadioButton
                                label={t("PricingSchemePage.flatRateFixedPeriod")}
                                checked={selectedScheme === "flatRate"}
                                onChange={() => handleSchemeChange("flatRate")}
                            />
                            <RadioButton
                                label={t("PricingSchemePage.membershipSubscription")}
                                checked={selectedScheme === "membership"}
                                onChange={() => handleSchemeChange("membership")}
                            />
                        </Stack>
                    </Card>
                </Layout.Section>

                {selectedScheme && (
                    <Layout.Section>
                        <Card sectioned>
                            <FormLayout>
                                <Select
                                    label={t("PricingSchemePage.timeUnit")}
                                    options={[
                                        { label: t("PricingSchemePage.hours"), value: "hours" },
                                        { label: t("PricingSchemePage.days"), value: "days" },
                                    ]}
                                    value={pricingDetails.timeUnit}
                                    onChange={handleInputChange("timeUnit")}
                                />

                                {selectedScheme === "tieredHourly" && (
                                    <>
                                        <TextField
                                            label={t("PricingSchemePage.initialPeriod")}
                                            value={pricingDetails.initialPeriod}
                                            onChange={handleInputChange("initialPeriod")}
                                            type="number"
                                            suffix={t(`PricingSchemePage.${pricingDetails.timeUnit}`)}
                                        />
                                        <TextField
                                            label={t("PricingSchemePage.initialRate")}
                                            value={pricingDetails.initialRate}
                                            onChange={handleInputChange("initialRate")}
                                            type="number"
                                        />
                                        <TextField
                                            label={t("PricingSchemePage.subsequentRate")}
                                            value={pricingDetails.subsequentRate}
                                            onChange={handleInputChange("subsequentRate")}
                                            type="number"
                                        />
                                    </>
                                )}

                                {selectedScheme === "dailyRate" && (
                                    <>
                                        <TextField
                                            label={t("PricingSchemePage.dailyRate")}
                                            value={pricingDetails.initialRate}
                                            onChange={handleInputChange("initialRate")}
                                            type="number"
                                        />
                                        <TextField
                                            label={t("PricingSchemePage.hourlyOverageRate")}
                                            value={pricingDetails.subsequentRate}
                                            onChange={handleInputChange("subsequentRate")}
                                            type="number"
                                        />
                                    </>
                                )}

                                {selectedScheme === "flatRate" && (
                                    <>
                                        <TextField
                                            label={t("PricingSchemePage.flatRatePeriod")}
                                            value={pricingDetails.initialPeriod}
                                            onChange={handleInputChange("initialPeriod")}
                                            type="number"
                                            suffix={t(`PricingSchemePage.${pricingDetails.timeUnit}`)}
                                        />
                                        <TextField
                                            label={t("PricingSchemePage.flatRate")}
                                            value={pricingDetails.initialRate}
                                            onChange={handleInputChange("initialRate")}
                                            type="number"
                                        />
                                    </>
                                )}

                                {selectedScheme === "membership" && (
                                    <>
                                        <TextField
                                            label={t("PricingSchemePage.membershipFee")}
                                            value={pricingDetails.initialRate}
                                            onChange={handleInputChange("initialRate")}
                                            type="number"
                                        />
                                        <TextField
                                            label={t("PricingSchemePage.rentalLimit")}
                                            value={pricingDetails.initialPeriod}
                                            onChange={handleInputChange("initialPeriod")}
                                            type="number"
                                            suffix={t("PricingSchemePage.rentals")}
                                        />
                                    </>
                                )}
                            </FormLayout>
                            <div style={{ marginTop: "20px" }}>
                                <Stack distribution="equalSpacing">
                                    <Button onClick={handleNext}>{t("PricingSchemePage.next")}</Button>
                                    <Button primary onClick={handleSaveAndNext}>
                                        {t("PricingSchemePage.saveAndNext")}
                                    </Button>
                                </Stack>
                            </div>
                        </Card>
                    </Layout.Section>
                )}

                {/* Display selected products in an Index Table */}
                {selectedProducts.length > 0 && (
                    <Layout.Section>
                        <Card>
                            <IndexTable
                                itemCount={selectedProducts.length}
                                headings={[
                                    { title: "Product" },
                                    { title: "Product Name" },
                                    { title: "Product ID" },
                                    { title: "Actions" },
                                ]}
                                selectable={false}
                            >
                                {selectedProducts.map((product, index) => (
                                    <IndexTable.Row id={product.id} key={product.id} position={index}>
                                        <IndexTable.Cell>
                                            <Thumbnail
                                                source={product.images[0]?.originalSrc || ""}
                                                alt={product.title}
                                            />
                                        </IndexTable.Cell>
                                        <IndexTable.Cell>{product.title}</IndexTable.Cell>
                                        <IndexTable.Cell>{product.id}</IndexTable.Cell>
                                        <IndexTable.Cell>
                                            <Button
                                                destructive
                                                onClick={() => handleDeleteProduct(product.id)}
                                            >
                                                {t("PricingSchemePage.delete")}
                                            </Button>
                                        </IndexTable.Cell>
                                    </IndexTable.Row>
                                ))}
                            </IndexTable>
                        </Card>
                    </Layout.Section>
                )}
            </Layout>

            {/* Resource Picker for selecting products */}
            <ResourcePicker
                resourceType="Product"
                showVariants={false}
                open={isPickerOpen}
                onSelection={handlePickerSelection}
                onCancel={() => setPickerOpen(false)}
            />
        </Page>
    );
}
