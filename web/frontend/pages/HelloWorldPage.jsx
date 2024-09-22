import {
    Card,
    Page,
    Layout,
    TextContainer
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";

export default function HelloWorldPage() {
    const { t } = useTranslation();

    return (
        <Page narrowWidth>
            <Layout>
                <Layout.Section>
                    <Card sectioned>
                        <TextContainer>
                            <h2>{t("HelloWorldPage.greeting")}</h2>
                            <p>Hello World!</p>
                        </TextContainer>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
