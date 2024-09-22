import { BrowserRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavigationMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";

import {
    AppBridgeProvider,
    QueryProvider,
    PolarisProvider,
} from "./components";

export default function App() {
    // Any .tsx or .jsx files in /pages will become a route
    // See documentation for <Routes /> for more info
    const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");
    const { t } = useTranslation();

    const host = new URLSearchParams(location.search).get("host");
    const shop = new URLSearchParams(location.search).get("shop");
    const session = new URLSearchParams(location.search).get("session");

    return (
        <PolarisProvider>
            <BrowserRouter>
                <AppBridgeProvider>
                    <NavigationMenu
                        navigationLinks={[
                            {
                                label: t("Create rental price scheme"),
                                destination: `/page_form/pricing_schemes/hostz/${host}/shop/${shop}/session/${session}`,
                            },

                            {
                                label: t("Price scheme management"),
                                destination: `/page_tree/pricing_schemes/hostz/${host}/session/${session}`,
                            },
                            {
                                label: t("Rental Order Management"),
                                destination: `/page_tree/rental_order/hostz/${host}/shop/${shop}/session/${session}`,
                            },
                            {
                                label: t("Plan"),
                                destination: `/page_plan/hostz/${host}/shop/${shop}/session/${session}`,
                            }
                        ]}
                    />
                    <QueryProvider>
                        <Routes pages={pages} />
                    </QueryProvider>
                </AppBridgeProvider>
            </BrowserRouter>
        </PolarisProvider>
    );
}
