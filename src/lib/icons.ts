import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { DEFAULT_CATEGORY_METAS, normalizeCategoryName } from "./categories";

/**
 * Standard icon mapping for canonical category names.
 */
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    "Food & Dining": LucideIcons.Utensils,
    "Groceries": LucideIcons.ShoppingCart,
    "Transport": LucideIcons.Car,
    "Shopping": LucideIcons.ShoppingBag,
    "Bills & Utilities": LucideIcons.Zap,
    "Entertainment": LucideIcons.Film,
    "Health": LucideIcons.HeartPulse,
    "Travel": LucideIcons.Plane,
    "Investments": LucideIcons.TrendingUp,
    "Salary": LucideIcons.Briefcase,
    "UPI Transfer": LucideIcons.ArrowLeftRight,
    "Transfers": LucideIcons.Repeat,
    "Cashback & Rewards": LucideIcons.Gift,
    "Interest & Dividends": LucideIcons.TrendingUp,
    "Refunds": LucideIcons.RotateCcw,
    "Education": LucideIcons.BookOpen,
    "General": LucideIcons.Wallet,
    "Income": LucideIcons.ArrowDownLeft,
    "Other": LucideIcons.Wallet,
};

/**
 * Common icon alias mapping.
 */
const ICON_ALIASES: Record<string, LucideIcon> = {
    "utensils": LucideIcons.Utensils,
    "shopping-cart": LucideIcons.ShoppingCart,
    "shopping_cart": LucideIcons.ShoppingCart,
    "cart": LucideIcons.ShoppingCart,
    "car": LucideIcons.Car,
    "auto": LucideIcons.Car,
    "fuel": LucideIcons.Fuel,
    "shopping-bag": LucideIcons.ShoppingBag,
    "shopping_bag": LucideIcons.ShoppingBag,
    "bag": LucideIcons.ShoppingBag,
    "zap": LucideIcons.Zap,
    "bolt": LucideIcons.Zap,
    "electricity": LucideIcons.Zap,
    "film": LucideIcons.Film,
    "movie": LucideIcons.Film,
    "heart-pulse": LucideIcons.HeartPulse,
    "heart_pulse": LucideIcons.HeartPulse,
    "health": LucideIcons.HeartPulse,
    "plane": LucideIcons.Plane,
    "flight": LucideIcons.Plane,
    "travel": LucideIcons.Plane,
    "bar-chart-2": LucideIcons.TrendingUp,
    "bar-chart": LucideIcons.TrendingUp,
    "briefcase": LucideIcons.Briefcase,
    "salary": LucideIcons.Briefcase,
    "arrow-left-right": LucideIcons.ArrowLeftRight,
    "upi": LucideIcons.ArrowLeftRight,
    "repeat": LucideIcons.Repeat,
    "transfer": LucideIcons.Repeat,
    "gift": LucideIcons.Gift,
    "cashback": LucideIcons.Gift,
    "trending-up": LucideIcons.TrendingUp,
    "trending_up": LucideIcons.TrendingUp,
    "rotate-ccw": LucideIcons.RotateCcw,
    "refund": LucideIcons.RotateCcw,
    "book-open": LucideIcons.BookOpen,
    "book": LucideIcons.BookOpen,
    "education": LucideIcons.BookOpen,
    "wallet": LucideIcons.Wallet,
    "receipt": LucideIcons.Receipt,
    "circle": LucideIcons.Wallet,
};

/**
 * Safely resolve a Lucide icon by kebab-case, camelCase, PascalCase, or Category name.
 */
export function getLucideIcon(nameOrCategory?: string | null): LucideIcon {
    if (!nameOrCategory || typeof nameOrCategory !== "string") {
        return LucideIcons.Wallet;
    }

    const clean = nameOrCategory.trim();
    if (!clean) return LucideIcons.Wallet;

    // 1. Check direct category mapping
    if (CATEGORY_ICON_MAP[clean]) {
        return CATEGORY_ICON_MAP[clean];
    }

    // 2. Check canonical normalized category
    const canonical = normalizeCategoryName(clean);
    if (canonical && CATEGORY_ICON_MAP[canonical]) {
        return CATEGORY_ICON_MAP[canonical];
    }

    // 3. Check alias mapping
    const lower = clean.toLowerCase();
    if (ICON_ALIASES[lower]) {
        return ICON_ALIASES[lower];
    }

    // 4. Try converting kebab-case / snake_case to PascalCase
    const key = clean
        .replace(/_/g, "-")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("") as keyof typeof LucideIcons;

    const icon = LucideIcons[key];
    if (icon && typeof icon === "object") {
        return icon as unknown as LucideIcon;
    }

    // 5. Direct key lookup in Lucide
    const directIcon = (LucideIcons as unknown as Record<string, unknown>)[clean];
    if (directIcon && typeof directIcon === "object") {
        return directIcon as unknown as LucideIcon;
    }

    return LucideIcons.Wallet;
}

export interface CategoryVisual {
    Icon: LucideIcon;
    color: string;
    bgColor: string;
    label: string;
}

/**
 * Unified visual resolver for category logos and badge styling.
 * Guaranteed to never return "Uncategorized" or a broken logo.
 */
export function getCategoryVisual(
    categoryName?: string | null,
    iconName?: string | null,
    type?: "EXPENSE" | "INCOME" | "expense" | "income" | string | null
): CategoryVisual {
    const isIncome = type?.toLowerCase() === "income";

    // Normalize category name
    let label = categoryName?.trim() || "";
    if (!label || label.toLowerCase() === "uncategorized" || label.toLowerCase() === "other") {
        label = isIncome ? "Salary" : "Shopping";
    } else {
        const canonical = normalizeCategoryName(label);
        if (canonical && canonical !== "Other") {
            label = canonical;
        }
    }

    // Determine color
    const meta = DEFAULT_CATEGORY_METAS[label];
    let color = meta?.color;
    if (!color) {
        color = isIncome ? "#30D158" : "#007AFF";
    }

    // Determine icon
    let Icon: LucideIcon = LucideIcons.Wallet;
    if (CATEGORY_ICON_MAP[label]) {
        Icon = CATEGORY_ICON_MAP[label];
    } else if (iconName) {
        Icon = getLucideIcon(iconName);
    } else if (meta?.icon) {
        Icon = getLucideIcon(meta.icon);
    }

    return {
        Icon,
        color,
        bgColor: `${color}18`,
        label,
    };
}
