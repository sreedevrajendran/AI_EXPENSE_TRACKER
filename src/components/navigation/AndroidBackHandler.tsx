"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import toast from "react-hot-toast";

export function AndroidBackHandler() {
    const pathname = usePathname();
    const router = useRouter();
    const lastBackTimeRef = useRef<number>(0);

    useEffect(() => {
        let isNative = false;
        try {
            isNative = typeof (window as any).Capacitor !== "undefined" && (window as any).Capacitor.isNativePlatform();
        } catch {
            isNative = false;
        }

        const handleBackButton = async (data: { canGoBack: boolean }) => {
            // 1. Check if any drawer/sheet/dialog/modal is open in the DOM
            const openVaul = document.querySelector('[data-vaul-drawer]');
            const openOverlay = document.querySelector('[data-vaul-overlay]');
            const openDialog = document.querySelector('[role="dialog"]');
            const customModal = document.querySelector('.floww-modal-active');

            // Dispatch global event for custom components listening for back-press
            const event = new CustomEvent("app:back-press", { cancelable: true });
            const wasNotPrevented = window.dispatchEvent(event);

            // Also dispatch Escape key on document (Vaul & Radix listen to Escape to close)
            const escEvent = new KeyboardEvent("keydown", {
                key: "Escape",
                code: "Escape",
                keyCode: 27,
                which: 27,
                bubbles: true,
                cancelable: true,
            });
            document.dispatchEvent(escEvent);

            if (openVaul || openOverlay || openDialog || customModal || !wasNotPrevented) {
                // An overlay/sheet/drawer was open and has been closed. Consume event, don't exit!
                return;
            }

            // 2. If no modal is open and user is on a subpage, navigate to Home
            if (pathname !== "/") {
                router.push("/");
                return;
            }

            // 3. If on home page, double-press back to exit gracefully
            const now = Date.now();
            if (now - lastBackTimeRef.current < 2000) {
                App.exitApp();
            } else {
                lastBackTimeRef.current = now;
                toast.dismiss();
                toast("Press back again to exit", {
                    id: "exit-toast",
                    duration: 2000,
                    style: {
                        borderRadius: "14px",
                        background: "#1C1C1E",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: "600",
                    },
                });
            }
        };

        const listenerHandle = App.addListener("backButton", handleBackButton);

        return () => {
            listenerHandle.then((h) => h.remove()).catch(() => {});
        };
    }, [pathname, router]);

    return null;
}
