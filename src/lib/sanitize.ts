/**
 * Security Input Sanitizer Utility
 * Adheres to OWASP Top 10 (A03:2021 – Injection & XSS Prevention)
 */

/**
 * Strips HTML tags, script fragments, and dangerous protocols from user inputs.
 */
export function sanitizeString(input: unknown, maxLength = 255): string {
    if (typeof input !== "string") return "";
    
    // Normalize unicode to prevent homograph / encoding bypasses
    let cleaned = input.normalize("NFKC").trim();

    // Strip HTML tags (<script>, <iframe>, <a>, etc.)
    cleaned = cleaned.replace(/<[^>]*>/g, "");

    // Strip common script/event injection vectors
    cleaned = cleaned
        .replace(/javascript:/gi, "")
        .replace(/data:/gi, "")
        .replace(/vbscript:/gi, "")
        .replace(/on\w+\s*=/gi, "");

    // Truncate to maximum permissible length to prevent memory exhaustion / DoS
    if (cleaned.length > maxLength) {
        cleaned = cleaned.slice(0, maxLength);
    }

    return cleaned;
}

/**
 * Validates and normalizes financial currency amounts.
 * Rejects NaN, negative amounts, Infinity, and amounts exceeding sane thresholds.
 */
export function sanitizeAmount(input: unknown, maxAmount = 100_000_000): number {
    const num = typeof input === "number" ? input : parseFloat(String(input));
    if (isNaN(num) || !isFinite(num) || num <= 0) {
        throw new Error("Amount must be a positive finite number.");
    }
    if (num > maxAmount) {
        throw new Error(`Amount exceeds maximum allowable threshold (${maxAmount}).`);
    }
    // Round to 2 decimal places to prevent floating point inaccuracies
    return Math.round(num * 100) / 100;
}

/**
 * Validates and parses dates safely.
 */
export function sanitizeDate(input: unknown): Date {
    if (!input) return new Date();
    const d = new Date(input as any);
    if (isNaN(d.getTime())) {
        throw new Error("Invalid date specification.");
    }
    // Restrict dates to reasonable historical and future boundaries (1970 - 2100)
    const year = d.getFullYear();
    if (year < 1970 || year > 2100) {
        throw new Error("Date is outside allowable operational boundaries.");
    }
    return d;
}
