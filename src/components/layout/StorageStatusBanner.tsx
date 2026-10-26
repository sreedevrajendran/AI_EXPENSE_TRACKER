"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { AlertTriangle, X } from "lucide-react";

export function StorageStatusBanner() {
    const [dismissed, setDismissed] = useState(false);
    const { data } = trpc.system.getStorageStatus.useQuery(undefined, {
        refetchInterval: 30000,
    });

    if (!data?.isQuotaExceeded || dismissed) return null;

    return (
        <div className="w-full bg-amber-500/15 dark:bg-amber-950/50 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between gap-3 transition-all shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="leading-normal">
                    <span className="font-bold">Firebase Quota Limit Exceeded:</span> Operating in high-speed local device mode. Cloud quota refreshes daily at <span className="font-bold underline decoration-amber-500/50">{data.resetTimeFormatted}</span> (in ~{data.timeRemainingFormatted}).
                </p>
            </div>
            <button
                type="button"
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-amber-500/20 rounded-md text-amber-800 dark:text-amber-300 transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Dismiss banner"
                title="Dismiss banner"
            >
                <X size={14} />
            </button>
        </div>
    );
}
