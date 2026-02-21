import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, compact = false): string {
    if (compact && amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}k`;
    }
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
}

export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function getBudgetStatus(spent: number, budget: number): "safe" | "warning" | "danger" {
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    if (pct >= 90) return "danger";
    if (pct >= 70) return "warning";
    return "safe";
}

export function getBudgetColor(status: "safe" | "warning" | "danger"): string {
    switch (status) {
        case "danger": return "#FF3B30";
        case "warning": return "#FF9F0A";
        default: return "#34C759";
    }
}
