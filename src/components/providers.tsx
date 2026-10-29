"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TRPCProvider } from "@/trpc/client";
import { PrivacyProvider } from "@/context/PrivacyContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { NotificationManager } from "@/components/notifications/NotificationManager";
import { AndroidBackHandler } from "@/components/navigation/AndroidBackHandler";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Enables instant :active CSS pseudo-classes on mobile WebKit and Android WebView
        const touchHandler = () => {};
        document.addEventListener("touchstart", touchHandler, { passive: true });
        return () => document.removeEventListener("touchstart", touchHandler);
    }, []);
    return (
        <SessionProvider>
            <TRPCProvider>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <PrivacyProvider>
                        <CurrencyProvider>
                            <AndroidBackHandler />
                            <NotificationManager />
                            {children}
                            <Toaster
                                position="top-center"
                                containerStyle={{
                                    top: "calc(env(safe-area-inset-top, 24px) + 64px)",
                                }}
                                toastOptions={{
                                    duration: 2600,
                                }}
                            />
                        </CurrencyProvider>
                    </PrivacyProvider>
                </ThemeProvider>
            </TRPCProvider>
        </SessionProvider>
    );
}
