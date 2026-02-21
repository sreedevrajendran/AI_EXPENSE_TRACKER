"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Info, Sparkles } from "lucide-react";
import { usePrivacy } from "@/context/PrivacyContext";
import { AppInfoSheet } from "@/components/ui/AppInfoSheet";
import { AgentOasisChatSheet } from "@/components/ai/AgentOasisChatSheet";

interface HeaderProps {
    title?: string;
}

export function Header({ title = "Expense Tracker" }: HeaderProps) {
    const { isPrivate, togglePrivacy } = usePrivacy();
    const [infoOpen, setInfoOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-40 ios-glass border-b ios-separator">
                <div className="flex items-center justify-between px-4 h-14 pt-[env(safe-area-inset-top,0px)] md:px-8">

                    {/* Assistant Trigger — Mobile only */}
                    <div className="flex-1 md:hidden">
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

                    {/* Desktop left spacer (if keeping structure) */}
                    <div className="hidden md:block flex-1" />

                    {/* Title & Logo — Mobile only */}
                    <div className="flex-[2] md:hidden flex justify-center items-center gap-2">
                        <img src="/logo.png?v=2" alt="Oasis Logo" className="w-7 h-7 rounded-lg" />
                        <h1 className="text-[17px] font-semibold ios-text-primary tracking-tight truncate">
                            {title === "Expense Tracker" ? "Oasis" : title}
                        </h1>
                    </div>

                    {/* Actions (Privacy & Info Bot) */}
                    <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setInfoOpen(true)}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] ios-text-secondary md:hidden"
                            aria-label="App Info"
                        >
                            <Info size={17} />
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={togglePrivacy}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] ios-text-secondary"
                            aria-label={isPrivate ? "Show balances" : "Hide balances"}
                        >
                            {isPrivate ? <EyeOff size={17} /> : <Eye size={17} />}
                        </motion.button>
                    </div>
                </div>
            </header>

            <AppInfoSheet open={infoOpen} onOpenChange={setInfoOpen} />
            <AgentOasisChatSheet open={chatOpen} onOpenChange={setChatOpen} />
        </>
    );
}
