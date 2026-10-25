"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, Settings } from "lucide-react";
import { usePrivacy } from "@/context/PrivacyContext";
import Link from "next/link";

interface HeaderProps {
    title?: string;
}

export function Header({ title = "Floww" }: HeaderProps) {
    const { isPrivate, togglePrivacy } = usePrivacy();

    return (
        <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#121214]/85 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 transition-all">
            {/* Status Bar Spacer: Safe area clearance below wifi, battery, camera hole */}
            <div className="h-[max(env(safe-area-inset-top),28px)] md:h-0" />

            {/* Standard Google Material 56px App Bar Row */}
            <div className="flex items-center justify-between h-14 px-5 sm:px-6 md:px-8">
                {/* Brand Name */}
                <div className="flex items-center">
                    <Link
                        href="/"
                        className="flex items-center transition-transform hover:opacity-90 active:scale-95"
                        aria-label="floww"
                    >
                        <span className="text-[22px] font-black tracking-tight text-neutral-900 dark:text-white">
                            floww
                        </span>
                    </Link>
                </div>

                {/* Right Action Icons: Privacy Mode & Settings */}
                <div className="flex items-center gap-1 justify-end">
                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={togglePrivacy}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 transition-colors"
                        aria-label={isPrivate ? "Show balances" : "Hide balances"}
                        title={isPrivate ? "Show balances" : "Hide balances"}
                    >
                        {isPrivate ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
                    </motion.button>

                    <Link
                        href="/settings"
                        className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 transition-colors"
                        aria-label="Settings"
                        title="Settings"
                    >
                        <Settings size={20} strokeWidth={2} />
                    </Link>
                </div>
            </div>
        </header>
    );
}
