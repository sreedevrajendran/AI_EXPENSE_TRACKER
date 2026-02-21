"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TRPCProvider } from "@/trpc/client";
import { PrivacyProvider } from "@/context/PrivacyContext";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <TRPCProvider>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <PrivacyProvider>
                        {children}
                        <Toaster position="top-center" />
                    </PrivacyProvider>
                </ThemeProvider>
            </TRPCProvider>
        </SessionProvider>
    );
}
