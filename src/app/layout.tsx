import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
    title: "Floww — AI Document Intelligence + Financial Analytics Platform",
    description: "Scan documents, categorize automatically, and get actionable financial insights.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Floww",
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
                <link rel="apple-touch-startup-image" href="/icons/splash-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
                <link rel="apple-touch-startup-image" href="/icons/splash-1668x2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" />
                <link rel="apple-touch-startup-image" href="/icons/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
                <link rel="apple-touch-startup-image" href="/icons/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
            </head>
            <body className="bg-[var(--ios-bg)] text-[var(--ios-text-primary)] overflow-x-hidden">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
