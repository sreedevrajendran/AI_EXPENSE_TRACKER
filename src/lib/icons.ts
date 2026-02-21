import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

/**
 * Safely resolve a lucide icon by kebab-case name.
 * Falls back to Circle if not found.
 */
export function getLucideIcon(name: string): LucideIcon {
    const key = name
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("") as keyof typeof LucideIcons;

    const icon = LucideIcons[key];
    if (icon && typeof icon === "function") {
        return icon as LucideIcon;
    }
    return LucideIcons.Circle;
}
