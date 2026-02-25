"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Settings, Sparkles } from "lucide-react";
import { usePrivacy } from "@/context/PrivacyContext";
import { AgentOasisChatSheet } from "@/components/ai/AgentOasisChatSheet";
import Link from "next/link";

interface HeaderProps {
    title?: string;
}

export function Header({ title = "Floww" }: HeaderProps) {
    const { isPrivate, togglePrivacy } = usePrivacy();
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-40 ios-glass border-b ios-separator">
                <div className="flex items-center justify-between px-4 h-14 pt-[env(safe-area-inset-top,0px)] md:px-8">

                    {/* Assistant Trigger — Mobile only */}
                    <div className="flex flex-1 items-center justify-start md:hidden">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setChatOpen(true)}
                            className="relative w-9 h-9 flex items-center justify-center rounded-full border-2 border-ios-blue bg-ios-blue/10 dark:bg-ios-blue-dark/20 text-ios-blue dark:text-ios-blue-dark"
                            aria-label="Open Agent Oasis"
                        >
                            <Sparkles size={16} strokeWidth={2.5} />
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-ios-blue dark:bg-ios-blue-dark rounded-full border-2 border-white dark:border-black" />
                        </motion.button>
                    </div>

                    {/* Desktop left spacer */}
                    <div className="hidden md:flex flex-1" />

                    {/* Title & Logo */}
                    <div className="flex-[2] flex justify-center items-center gap-2">
                        <img src="/logo.png?v=3" alt="Floww Logo" className="w-7 h-7 rounded-lg" />
                        <h1 className="text-[17px] font-semibold ios-text-primary tracking-tight truncate">
                            {title === "Floww" ? "Floww" : title}
                        </h1>
                    </div>

                    {/* Actions (Privacy & Settings) */}
                    <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={togglePrivacy}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] ios-text-secondary"
                            aria-label={isPrivate ? "Show balances" : "Hide balances"}
                        >
                            {isPrivate ? <EyeOff size={17} /> : <Eye size={17} />}
                        </motion.button>
                        <Link href="/settings" className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] ios-text-secondary active:scale-95 transition-transform md:hidden">
                            <Settings size={17} />
                        </Link>
                    </div>
                </div>
            </header>

            <AgentOasisChatSheet open={chatOpen} onOpenChange={setChatOpen} />
        </>
    );
}
