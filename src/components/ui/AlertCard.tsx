"use client";

import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, TrendingDown, TrendingUp, Target, X, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface AlertOptions {
    type?: "expense" | "income" | "budget" | "general";
    status?: "success" | "error" | "info";
    title: string;
    message?: string;
    amount?: number;
    duration?: number;
}

export function showMatchingAlert({
    type = "general",
    status = "success",
    title,
    message,
    amount,
    duration = 2600,
}: AlertOptions) {
    // Dismiss previous toasts so they don't linger or stack
    toast.dismiss();

    const isError = status === "error";
    const isInfo = status === "info";

    // Industry-standard semantic icon colors
    const iconColor = isError
        ? "text-rose-600 dark:text-rose-400"
        : type === "expense"
        ? "text-rose-600 dark:text-rose-400"
        : type === "income"
        ? "text-emerald-600 dark:text-emerald-400"
        : type === "budget"
        ? "text-indigo-600 dark:text-indigo-400"
        : isInfo
        ? "text-blue-600 dark:text-blue-400"
        : "text-emerald-600 dark:text-emerald-400";

    const iconBg = isError
        ? "bg-rose-50 dark:bg-rose-500/15"
        : type === "expense"
        ? "bg-rose-50 dark:bg-rose-500/15"
        : type === "income"
        ? "bg-emerald-50 dark:bg-emerald-500/15"
        : type === "budget"
        ? "bg-indigo-50 dark:bg-indigo-500/15"
        : isInfo
        ? "bg-blue-50 dark:bg-blue-500/15"
        : "bg-emerald-50 dark:bg-emerald-500/15";

    const toastId = toast.custom(
        (t) => (
            <motion.div
                layout
                onClick={() => toast.dismiss(t.id)}
                initial={{ opacity: 0, y: -16, scale: 0.98 }}
                animate={{
                    opacity: t.visible ? 1 : 0,
                    y: t.visible ? 0 : -16,
                    scale: t.visible ? 1 : 0.98,
                }}
                exit={{
                    opacity: 0,
                    y: -16,
                    scale: 0.98,
                    transition: { duration: 0.15, ease: "easeOut" },
                }}
                transition={{
                    type: "spring",
                    stiffness: 480,
                    damping: 34,
                }}
                className="w-full max-w-[360px] sm:max-w-md mx-auto bg-white dark:bg-[#1E1E22] rounded-2xl p-3 sm:p-3.5 shadow-xl shadow-black/10 dark:shadow-black/60 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 select-none cursor-pointer"
                role="alert"
            >
                {/* Status Indicator Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
                    {isError ? (
                        <AlertCircle size={20} strokeWidth={2.4} />
                    ) : type === "expense" ? (
                        <TrendingDown size={20} strokeWidth={2.4} />
                    ) : type === "income" ? (
                        <TrendingUp size={20} strokeWidth={2.4} />
                    ) : type === "budget" ? (
                        <Target size={20} strokeWidth={2.4} />
                    ) : isInfo ? (
                        <Info size={20} strokeWidth={2.4} />
                    ) : (
                        <CheckCircle2 size={20} strokeWidth={2.4} />
                    )}
                </div>

                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold text-neutral-900 dark:text-white leading-tight truncate">
                        {title}
                    </p>
                    {message && (
                        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug line-clamp-2">
                            {message}
                        </p>
                    )}
                </div>

                {/* Optional Transaction Amount */}
                {amount !== undefined && (
                    <div className="text-right flex-shrink-0 font-bold text-sm tabular-nums pl-1">
                        <span className={type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                            {type === "expense" ? "-" : type === "income" ? "+" : ""}
                            {formatCurrency(amount)}
                        </span>
                    </div>
                )}

                {/* Dismiss Button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
                    aria-label="Dismiss notification"
                >
                    <X size={15} />
                </button>
            </motion.div>
        ),
        { duration, position: "top-center" }
    );

    // Guaranteed auto-close timer ensures it always dismisses automatically
    setTimeout(() => {
        toast.dismiss(toastId);
    }, duration);

    return toastId;
}
