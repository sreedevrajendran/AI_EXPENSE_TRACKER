import { Preferences } from "@capacitor/preferences";

// In-memory cache for ultra-fast synchronous reads
const memCache = new Map<string, string>();
let isInitialized = false;

// Preload cache from localStorage if available in browser
if (typeof window !== "undefined") {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const val = localStorage.getItem(key);
                if (val !== null) memCache.set(key, val);
            }
        }
    } catch {
        // Restricted storage fallback
    }

    // Async hydration from Preferences
    Preferences.keys()
        .then(async ({ keys }) => {
            for (const key of keys) {
                const res = await Preferences.get({ key });
                if (res.value !== null) {
                    memCache.set(key, res.value);
                    try {
                        localStorage.setItem(key, res.value);
                    } catch {
                        // ignore
                    }
                }
            }
            isInitialized = true;
        })
        .catch(() => {
            isInitialized = true;
        });
}

export const appStorage = {
    /**
     * Get an item asynchronously from @capacitor/preferences with localStorage fallback.
     */
    async getItem(key: string): Promise<string | null> {
        try {
            const res = await Preferences.get({ key });
            if (res.value !== null) {
                memCache.set(key, res.value);
                return res.value;
            }
        } catch {
            // Fall back to localStorage / memory
        }

        if (typeof window !== "undefined") {
            try {
                const val = localStorage.getItem(key);
                if (val !== null) {
                    memCache.set(key, val);
                    return val;
                }
            } catch {
                // ignore
            }
        }

        return memCache.get(key) || null;
    },

    /**
     * Set an item asynchronously to @capacitor/preferences, localStorage, and memory cache.
     */
    async setItem(key: string, value: string): Promise<void> {
        memCache.set(key, value);

        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(key, value);
            } catch {
                // ignore
            }
        }

        try {
            await Preferences.set({ key, value });
        } catch {
            // ignore
        }
    },

    /**
     * Remove an item from @capacitor/preferences, localStorage, and memory cache.
     */
    async removeItem(key: string): Promise<void> {
        memCache.delete(key);

        if (typeof window !== "undefined") {
            try {
                localStorage.removeItem(key);
            } catch {
                // ignore
            }
        }

        try {
            await Preferences.remove({ key });
        } catch {
            // ignore
        }
    },

    /**
     * Synchronous get (reads from memory cache or window.localStorage immediately).
     */
    getItemSync(key: string, fallback: string | null = null): string | null {
        if (memCache.has(key)) {
            return memCache.get(key)!;
        }

        if (typeof window !== "undefined") {
            try {
                const val = localStorage.getItem(key);
                if (val !== null) {
                    memCache.set(key, val);
                    return val;
                }
            } catch {
                // ignore
            }
        }

        return fallback;
    },

    /**
     * Synchronous set (updates memory cache and localStorage immediately, then writes to Preferences).
     */
    setItemSync(key: string, value: string): void {
        memCache.set(key, value);

        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(key, value);
            } catch {
                // ignore
            }
        }

        Preferences.set({ key, value }).catch(() => {});
    },

    /**
     * Synchronous remove (clears memory cache and localStorage immediately, then removes from Preferences).
     */
    removeItemSync(key: string): void {
        memCache.delete(key);

        if (typeof window !== "undefined") {
            try {
                localStorage.removeItem(key);
            } catch {
                // ignore
            }
        }

        Preferences.remove({ key }).catch(() => {});
    },
};
