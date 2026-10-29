"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { AlertTriangle, Clock, HardDrive, X } from "lucide-react";
import { quotaStateManager } from "@/lib/firebase/errorHandler";

/**
 * Calculates the next daily quota reset timestamp.
 * Google Cloud / Firebase Spark quotas reset daily at Midnight Pacific Time (00:00 PST / 07:00 UTC),
 * which corresponds directly to 12:30 PM IST.
 */
function getNextQuotaResetTime(): Date {
    const now = new Date();
    // 07:00:00 UTC = 12:30 PM IST (UTC+5:30)
    const resetToday = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 7, 0, 0, 0)
    );
    if (now.getTime() >= resetToday.getTime()) {
        resetToday.setUTCDate(resetToday.getUTCDate() + 1);
    }
    return resetToday;
}

interface TimeLeft {
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
}

function calculateTimeRemaining(target: Date): TimeLeft {
    const now = new Date();
    const diff = Math.max(0, target.getTime() - now.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return {
        hours,
        minutes,
        seconds,
        formatted: `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`,
    };
}

export function StorageStatusBanner() {
    const [dismissed, setDismissed] = useState(false);
    const [clientQuotaExceeded, setClientQuotaExceeded] = useState(() =>
        quotaStateManager.getIsExceeded()
    );

    // Live countdown timer state (ticks every second)
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
        calculateTimeRemaining(getNextQuotaResetTime())
    );

    // Subscribe to client-side quota state changes
    useEffect(() => {
        const unsubscribe = quotaStateManager.subscribe((exceeded) => {
            setClientQuotaExceeded(exceeded);
            if (exceeded) setDismissed(false); // Re-open banner if quota hit occurs
        });
        return unsubscribe;
    }, []);

    // Server-reported storage status query
    const { data } = trpc.system.getStorageStatus.useQuery(undefined, {
        refetchInterval: 60000,
    });

    const isExceeded = Boolean(data?.isQuotaExceeded || clientQuotaExceeded);

    // Active live countdown interval (1-second tick only when banner is active)
    useEffect(() => {
        if (!isExceeded || dismissed) return;
        const target = getNextQuotaResetTime();
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeRemaining(target));
        }, 1000);
        return () => clearInterval(interval);
    }, [isExceeded, dismissed]);

    if (!isExceeded || dismissed) return null;

    return (
        <div className="w-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 dark:from-amber-950/60 dark:via-amber-900/40 dark:to-amber-950/60 border-b border-amber-500/30 px-3.5 py-2.5 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between gap-3 transition-all shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <span className="absolute w-full h-full rounded-full animate-ping bg-amber-400/30 duration-1000" />
                    <AlertTriangle size={14} className="relative z-10" />
                </div>
                <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <HardDrive size={13} className="opacity-80" />
                        Firebase Quota Limit Exceeded:
                    </span>
                    <span className="text-amber-800/90 dark:text-amber-200/90">
                        Operating in high-speed local device storage mode. All your data is safely retained on this device.
                    </span>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 dark:bg-amber-400/15 border border-amber-500/40 text-amber-950 dark:text-amber-100 font-mono font-medium text-[11px] whitespace-nowrap shadow-xs">
                        <Clock size={11} className="text-amber-600 dark:text-amber-300" />
                        <span>Refreshes in:</span>
                        <span className="font-bold tracking-wider">{timeLeft.formatted}</span>
                        <span className="text-[10px] opacity-75">(12:30 PM IST)</span>
                    </div>
                </div>
            </div>
            <button
                type="button"
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-amber-500/25 active:scale-95 rounded-md text-amber-800 dark:text-amber-300 transition-all flex-shrink-0 cursor-pointer ml-1"
                aria-label="Dismiss quota banner"
                title="Dismiss quota notification"
            >
                <X size={14} />
            </button>
        </div>
    );
}
