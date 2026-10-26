"use client";

/**
 * Unified Firestore & Database Error Handling Wrapper
 * Detects quota limits, immediately turns off hanging loading states,
 * and maintains global quota state across the client.
 */

// Check if an error represents a Firebase / Firestore quota or resource exhaustion
export function isQuotaError(error: any): boolean {
    if (!error) return false;
    const code = String(error?.code || "");
    const msg = String(error?.message || error?.toString() || "");
    return (
        code === "resource-exhausted" ||
        code === "RESOURCE_EXHAUSTED" ||
        code === "8" ||
        code === "functions/resource-exhausted" ||
        msg.includes("Quota exceeded") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("8 RESOURCE_EXHAUSTED") ||
        msg.includes("quota") ||
        msg.includes("resource-exhausted") ||
        msg.includes("exceeded quota")
    );
}

// Global client quota tracking
class QuotaStateManager {
    private isExceeded = false;
    private listeners = new Set<(exceeded: boolean) => void>();

    constructor() {
        if (typeof window !== "undefined") {
            // Check session storage or initial state
            try {
                this.isExceeded = sessionStorage.getItem("floww_quota_exceeded") === "true";
            } catch {
                // ignore
            }

            // Listen for global custom events
            window.addEventListener("floww_quota_exceeded", () => {
                this.setExceeded(true);
            });

            window.addEventListener("floww_quota_restored", () => {
                this.setExceeded(false);
            });
        }
    }

    public getIsExceeded(): boolean {
        return this.isExceeded;
    }

    public setExceeded(val: boolean) {
        if (this.isExceeded === val) return;
        this.isExceeded = val;
        if (typeof window !== "undefined") {
            try {
                if (val) {
                    sessionStorage.setItem("floww_quota_exceeded", "true");
                } else {
                    sessionStorage.removeItem("floww_quota_exceeded");
                }
            } catch {
                // ignore
            }
        }
        this.listeners.forEach((listener) => listener(val));
    }

    public subscribe(listener: (exceeded: boolean) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}

export const quotaStateManager = new QuotaStateManager();

/**
 * Immediately flags the global quota state and emits window event
 */
export function flagQuotaExceeded(reason?: string) {
    if (typeof window !== "undefined") {
        console.warn(`[QuotaManager] Flagging quota exceeded: ${reason || "Quota limit hit"}`);
        quotaStateManager.setExceeded(true);
        window.dispatchEvent(
            new CustomEvent("floww_quota_exceeded", {
                detail: { reason, timestamp: Date.now() },
            })
        );
    }
}

/**
 * Resets the quota state when quota becomes available
 */
export function resetQuotaExceeded() {
    if (typeof window !== "undefined") {
        quotaStateManager.setExceeded(false);
        window.dispatchEvent(new CustomEvent("floww_quota_restored"));
    }
}

/**
 * Unified Firestore Operation Wrapper:
 * - Executes async operations with a timeout (default 3500ms) to prevent infinite hanging
 * - Automatically catches quota exhaustion errors
 * - Immediately flags global quota state
 * - Returns optional fallback data to turn off loading states gracefully
 */
export async function withFirestoreErrorHandling<T>(
    operation: () => Promise<T>,
    fallback?: T,
    timeoutMs: number = 3500
): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new Error("Firestore operation timed out (quota/network delay)."));
        }, timeoutMs);
    });

    try {
        return await Promise.race([operation(), timeoutPromise]);
    } catch (err: any) {
        if (isQuotaError(err)) {
            flagQuotaExceeded(err?.message || "Quota exhausted");
        }

        if (fallback !== undefined) {
            console.warn("[withFirestoreErrorHandling] Falling back to local data:", err?.message || err);
            return fallback;
        }

        throw err;
    }
}
