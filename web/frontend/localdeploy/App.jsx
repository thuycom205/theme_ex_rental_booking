import React, { useState, useEffect } from 'react';
import { BrowserRouter } from "react-router-dom";
import Routes from "./Routes";
import { QueryProvider, PolarisProvider } from "./components";
import { ShopProvider } from './components/providers/ShopProvider';
import {useTranslation} from "react-i18next";
import { useLocation } from "react-router-dom";

const App0 = () => {
    const { t } = useTranslation();

    const [isAppBridgeActive, setIsAppBridgeActive] = useState(false);
    const [AppBridgeProvider, setAppBridgeProvider] = useState(null);
    const [NavigationMenu, setNavigationMenu] = useState(null);
    const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");
    // const isRemote = process.env.REACT_APP_MODE === 'remote'; // Adjust accordingly
    // const isRemote = true; // Adjust accordingly
    const isLocalMode = process.env.REACT_APP_MODE === 'local'; // Adjust the variable as per your setup



    const renderContent = () => {
        const host =
            new URLSearchParams(location.search).get("host");
        console.log(host);
        console.log('host');
        const shop = new URLSearchParams(location.search).get("shop");
        const session = new URLSearchParams(location.search).get("session");
        if (false) {
            return (
                <AppBridgeProvider>
                    <NavigationMenu
                        navigationLinks={[
                            {
                                label: t("Data rule setting"),
                                destination: `/page_form/google_feed_setting/hostz/${host}/shop/${shop}/session/${session}`,
                            },
                            {
                                label: t("Report2"),
                                destination: `/fb/report_pivot?host=${host}&shop=${shop}&session=${session}`,
                            },
                            {
                                label: t("Google sync setting"),
                                destination: `/page_form/google_sync_setting/hostz/${host}/session/${session}`,
                            }
                            ,
                            {
                                label: t("Product Feed"),
                                destination: `/page_feed/hostz/${host}/shop/${shop}/session/${session}`,
                            },{
                                label: t("Facebook connect"),
                                destination: `/page_facebook_connect/hostz/${host}/shop/${shop}/session/${session}`,
                            }

                        ]}
                    />
                    <QueryProvider>
                        <Routes pages={pages} />
                    </QueryProvider>
                </AppBridgeProvider>
            );
        } else {
            return (
                <QueryProvider>
                    <Routes pages={pages} />
                </QueryProvider>
            );
        }
    };

    return (
        <ShopProvider>

            <PolarisProvider>
                <BrowserRouter>
                    {renderContent()}
                </BrowserRouter>
            </PolarisProvider>
        </ShopProvider>

    );
};

export default App0;


