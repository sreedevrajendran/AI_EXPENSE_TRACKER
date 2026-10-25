import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface CurrencyConfig {
    code: string;
    symbol: string;
    locale: string;
    label: string;
    name: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
    INR: { code: "INR", symbol: "₹", locale: "en-IN", label: "₹ INR", name: "Indian Rupee" },
    USD: { code: "USD", symbol: "$", locale: "en-US", label: "$ USD", name: "US Dollar" },
    EUR: { code: "EUR", symbol: "€", locale: "de-DE", label: "€ EUR", name: "Euro" },
    GBP: { code: "GBP", symbol: "£", locale: "en-GB", label: "£ GBP", name: "British Pound" },
    JPY: { code: "JPY", symbol: "¥", locale: "ja-JP", label: "¥ JPY", name: "Japanese Yen" },
    CAD: { code: "CAD", symbol: "C$", locale: "en-CA", label: "C$ CAD", name: "Canadian Dollar" },
    AUD: { code: "AUD", symbol: "A$", locale: "en-AU", label: "A$ AUD", name: "Australian Dollar" },
    AED: { code: "AED", symbol: "AED", locale: "en-AE", label: "AED", name: "UAE Dirham" },
};

export function getStoredCurrency(): string {
    if (typeof window !== "undefined") {
        try {
            return localStorage.getItem("floww_currency") || "₹ INR";
        } catch {
            return "₹ INR";
        }
    }
    return "₹ INR";
}

export function getCurrencyConfig(currencyStr?: string | null): CurrencyConfig {
    const raw = currencyStr || getStoredCurrency();
    const clean = raw.replace(/[^A-Z]/g, "").toUpperCase();
    return SUPPORTED_CURRENCIES[clean] || SUPPORTED_CURRENCIES.INR;
}

export function getCurrencySymbol(currencyStr?: string | null): string {
    return getCurrencyConfig(currencyStr).symbol;
}

// Real-world conversion rates relative to base INR currency (1 INR = X foreign units)
export const EXCHANGE_RATES_FROM_INR: Record<string, number> = {
    INR: 1.0,
    USD: 0.0116,    // 1000 INR = $11.60 USD (1 USD ≈ 86.20 INR)
    EUR: 0.0107,    // 1000 INR = €10.70 EUR (1 EUR ≈ 93.45 INR)
    GBP: 0.0089,    // 1000 INR = £8.90 GBP (1 GBP ≈ 112.35 INR)
    JPY: 1.724,     // 1000 INR = ¥1,724 JPY (1 JPY ≈ 0.58 INR)
    CAD: 0.0161,    // 1000 INR = C$16.10 CAD (1 CAD ≈ 62.10 INR)
    AUD: 0.0177,    // 1000 INR = A$17.70 AUD (1 AUD ≈ 56.50 INR)
    AED: 0.0425,    // 1000 INR = AED 42.50 (1 AED ≈ 23.53 INR)
};

export function convertFromBaseCurrency(amountInInr: number, targetCurrencyStr?: string | null): number {
    const config = getCurrencyConfig(targetCurrencyStr);
    const rate = EXCHANGE_RATES_FROM_INR[config.code] ?? 1.0;
    return amountInInr * rate;
}

export function convertToBaseCurrency(amountInForeign: number, sourceCurrencyStr?: string | null): number {
    const config = getCurrencyConfig(sourceCurrencyStr);
    const rate = EXCHANGE_RATES_FROM_INR[config.code] ?? 1.0;
    if (rate <= 0) return amountInForeign;
    return amountInForeign / rate;
}

export function formatCurrency(amount: number, compact = false, currencyOverride?: string): string {
    const config = getCurrencyConfig(currencyOverride);
    const converted = convertFromBaseCurrency(amount, config.code);

    if (compact && Math.abs(converted) >= 1000) {
        return `${config.symbol}${(converted / 1000).toFixed(1)}k`;
    }
    try {
        return new Intl.NumberFormat(config.locale, {
            style: "currency",
            currency: config.code,
            minimumFractionDigits: config.code === "JPY" ? 0 : 2,
            maximumFractionDigits: config.code === "JPY" ? 0 : 2,
        }).format(converted);
    } catch {
        return `${config.symbol}${converted.toLocaleString(undefined, {
            minimumFractionDigits: config.code === "JPY" ? 0 : 2,
            maximumFractionDigits: config.code === "JPY" ? 0 : 2,
        })}`;
    }
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

export async function compressImage(file: File, maxDimension = 800): Promise<File> {
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height && width > maxDimension) {
                    height *= maxDimension / width;
                    width = maxDimension;
                } else if (height > maxDimension) {
                    width *= maxDimension / height;
                    height = maxDimension;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
                        resolve(new File([blob], newFileName, { type: 'image/jpeg' }));
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', 0.6);
            };
            img.onerror = (err) => {
                console.error("Image load failed for compression:", err);
                resolve(file); // Fallback
            };
        };
        reader.onerror = (err) => {
            console.error("FileReader failed during compression:", err);
            resolve(file); // Fallback
        };
    });
}
