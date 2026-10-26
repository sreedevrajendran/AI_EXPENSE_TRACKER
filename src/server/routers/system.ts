import { publicProcedure, router } from "../trpc";
import { firestoreCircuitBreaker } from "@/lib/firebase/resilientDb";
import { isFirebaseConfigured } from "@/lib/firebase/admin";

export const systemRouter = router({
    getStorageStatus: publicProcedure.query(() => {
        const isQuotaExceeded = firestoreCircuitBreaker.isTripped();

        // Google Cloud Firestore daily free quotas reset at Midnight Pacific Time (00:00 PDT = 07:00 UTC = 12:30 PM IST)
        const now = new Date();
        const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 0, 0, 0));
        if (now.getTime() >= nextReset.getTime()) {
            nextReset.setUTCDate(nextReset.getUTCDate() + 1);
        }
        const diffMs = Math.max(0, nextReset.getTime() - now.getTime());
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        // Friendly formatted string in IST / Pacific Time
        const resetTimeFormatted = "12:30 PM IST (Midnight Pacific Time)";
        const timeRemainingFormatted = `${hours}h ${minutes}m`;

        return {
            isFirebaseConfigured,
            isQuotaExceeded,
            resetTimeUtc: nextReset.toISOString(),
            resetHours: hours,
            resetMinutes: minutes,
            resetTimeFormatted,
            timeRemainingFormatted,
        };
    }),
});
