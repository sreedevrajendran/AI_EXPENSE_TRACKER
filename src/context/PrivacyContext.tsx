"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PrivacyContextType {
    isPrivate: boolean;
    togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
    isPrivate: false,
    togglePrivacy: () => { },
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("privacy-mode");
        if (stored === "true") setIsPrivate(true);
    }, []);

    const togglePrivacy = () => {
        setIsPrivate((prev) => {
            const next = !prev;
            localStorage.setItem("privacy-mode", String(next));
            return next;
        });
    };

    return (
        <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
            {children}
        </PrivacyContext.Provider>
    );
}

export const usePrivacy = () => useContext(PrivacyContext);
