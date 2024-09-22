// src/contexts/ShopContext.js
//
// import React, { createContext, useContext, useState ,useEffect} from 'react';
//
// const ShopContext = createContext();
//
// export const ShopProvider = ({ children }) => {
//     const [shopName, setShopName] = useState(() => {
//         // Attempt to retrieve the shop name from URL or fallback to local storage
//         const params = new URLSearchParams(window.location.search);
//         return params.get('shop') || localStorage.getItem('shopName') || '';
//     });
//
//     // Whenever shopName changes, update it in localStorage
//     useEffect(() => {
//         if (shopName) {
//             localStorage.setItem('shopName', shopName);
//         }
//     }, [shopName]);
//
//     return (
//         <ShopContext.Provider value={{ shopName, setShopName }}>
//             {children}
//         </ShopContext.Provider>
//     );
// };

// export const useShop = () => useContext(ShopContext);



// ShopContext.js
import React, { createContext, useContext, useState,useMemo } from 'react';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
    const [shopxName, setShopxName] = useState('');
    const [apiKeyx, setApiKeyx] = useState('');
    const [token, setToken] = useState('');
    const [listIdx, setListIdx] = useState('');
    const [formData, setFormData] = useState({});
    // Method to update formData
    const updateFormData = (newFormData) => {
        setFormData(prevFormData => ({ ...prevFormData, ...newFormData }));
    };
    // const updateFormData = (updateFunction) => {
    //     setFormData(prevFormData => {
    //         // Assuming updateFunction is a function returning the updated state
    //         return updateFunction(prevFormData);
    //     });
    // };

    // Methods to update apiKey and token
    // Possibly fetch these from an API or local storage

    // setApiKeyx(process.env.SHOPIFY_API_KEY);
    const value = useMemo(() => ({
        shopxName,
        setShopxName,
        apiKeyx,
        setApiKeyx,
        token,
        setToken,
        listIdx,
        setListIdx,
        formData,
        updateFormData
    }), [shopxName, apiKeyx, token, listIdx, formData]);

    return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => useContext(ShopContext);
