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

export async function compressImage(file: File, maxDimension = 1600): Promise<File> {
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
                }, 'image/jpeg', 0.8);
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
