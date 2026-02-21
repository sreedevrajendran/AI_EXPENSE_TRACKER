"use client";

import { usePrivacy } from "@/context/PrivacyContext";
import { cn } from "@/lib/utils";

interface PrivacyWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export function PrivacyWrapper({ children, className }: PrivacyWrapperProps) {
    const { isPrivate } = usePrivacy();
    return (
        <span
            className={cn(
                "transition-all duration-300",
                isPrivate ? "blur-md select-none pointer-events-none" : "",
                className
            )}
        >
            {children}
        </span>
    );
}
