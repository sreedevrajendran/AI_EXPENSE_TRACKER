"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, List, PiggyBank, Settings, Sparkles, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AgentOasisChatSheet } from "@/components/ai/AgentOasisChatSheet";
import { GlobalActionSheet } from "@/components/layout/GlobalActionSheet";
import { Plus } from "lucide-react";

const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/incomes", label: "Incomes", icon: Wallet },
    { href: "/expenses", label: "Expenses", icon: List },
    { href: "/budgets", label: "Budgets", icon: PiggyBank },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function DesktopSidebar() {
    const pathname = usePathname();
    const [actionSheetOpen, setActionSheetOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <>
            <aside className="hidden md:flex flex-col w-64 h-dvh sticky top-0 border-r ios-separator ios-glass pb-6">
                {/* Branding / App Info */}
                <div className="p-6 pb-2 flex flex-col items-center">
                    <img src="/logo.png?v=3" alt="Floww Logo" className="w-20 h-20 rounded-[20px] shadow-sm mb-3" />
                    <h1 className="text-xl font-bold ios-text-primary tracking-tight">Floww</h1>
                    <p className="text-xs ios-text-secondary font-medium tracking-wide">AI EXPENSE TRACKER</p>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {tabs.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-ios-sm transition-all duration-200 font-medium",
                                    isActive
                                        ? "bg-ios-blue text-white shadow-md shadow-ios-blue/20"
                                        : "ios-text-secondary hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] hover:text-ios-primary"
                                )}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Actions Area */}
                <div className="px-4 mt-auto space-y-3">
                    {/* Add Transaction Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActionSheetOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-ios-sm bg-gradient-to-r from-ios-blue to-[#005bb5] text-white font-semibold shadow-md shadow-ios-blue/30 mt-2"
                    >
                        <Plus size={20} strokeWidth={3} />
                        Add Transaction
                    </motion.button>

                    {/* Chatbot Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setChatOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-ios-sm border-2 border-ios-blue bg-ios-blue/10 dark:bg-ios-blue-dark/20 text-ios-blue dark:text-ios-blue-dark font-semibold group"
                    >
                        <Sparkles size={18} strokeWidth={2.5} className="group-hover:animate-spin-slow" />
                        Ask Agent Floww
                    </motion.button>
                </div>
            </aside>

            <GlobalActionSheet open={actionSheetOpen} onOpenChange={setActionSheetOpen} />
            <AgentOasisChatSheet open={chatOpen} onOpenChange={setChatOpen} />
        </>
    );
}
