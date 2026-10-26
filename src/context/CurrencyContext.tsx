"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
    SUPPORTED_CURRENCIES,
    getCurrencyConfig,
    CurrencyConfig,
    formatCurrency as formatCurrencyUtil,
    convertFromBaseCurrency,
    convertToBaseCurrency,
} from "@/lib/utils";

interface CurrencyContextType {
    currency: string;
    currencyCode: string;
    currencySymbol: string;
    config: CurrencyConfig;
    setCurrency: (newCurrency: string) => void;
    formatCurrency: (amount: number, compact?: boolean) => string;
    convertFromBase: (amountInInr: number) => number;
    convertToBase: (amountInActiveCurrency: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType>({
    currency: "₹ INR",
    currencyCode: "INR",
    currencySymbol: "₹",
    config: SUPPORTED_CURRENCIES.INR,
    setCurrency: () => {},
    formatCurrency: (amount: number, compact?: boolean) => formatCurrencyUtil(amount, compact, "INR"),
    convertFromBase: (amount: number) => amount,
    convertToBase: (amount: number) => amount,
});

import { appStorage } from "@/lib/storage";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<string>("₹ INR");

    useEffect(() => {
        appStorage.getItem("floww_currency").then((stored) => {
            if (stored) setCurrencyState(stored);
        });

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "floww_currency" && e.newValue) {
                setCurrencyState(e.newValue);
            }
        };

        const handleCustomEvent = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (customEvent.detail) {
                setCurrencyState(customEvent.detail);
            } else {
                appStorage.getItem("floww_currency").then((latest) => {
                    if (latest) setCurrencyState(latest);
                });
            }
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("floww_currency_change", handleCustomEvent);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("floww_currency_change", handleCustomEvent);
        };
    }, []);

    const setCurrency = useCallback((newCurrency: string) => {
        setCurrencyState(newCurrency);
        appStorage.setItem("floww_currency", newCurrency);
        window.dispatchEvent(new CustomEvent("floww_currency_change", { detail: newCurrency }));
    }, []);

    const config = getCurrencyConfig(currency);

    const format = useCallback(
        (amount: number, compact = false) => {
            return formatCurrencyUtil(amount, compact, currency);
        },
        [currency]
    );

    const convertFromBase = useCallback(
        (amountInInr: number) => {
            return convertFromBaseCurrency(amountInInr, currency);
        },
        [currency]
    );

    const convertToBase = useCallback(
        (amountInActiveCurrency: number) => {
            return convertToBaseCurrency(amountInActiveCurrency, currency);
        },
        [currency]
    );

    return (
        <CurrencyContext.Provider
            value={{
                currency,
                currencyCode: config.code,
                currencySymbol: config.symbol,
                config,
                setCurrency,
                formatCurrency: format,
                convertFromBase,
                convertToBase,
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
}

export const useCurrency = () => useContext(CurrencyContext);
