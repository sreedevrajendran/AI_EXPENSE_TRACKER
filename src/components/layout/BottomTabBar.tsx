"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, List, PiggyBank, Settings, Plus, Wallet, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlobalActionSheet } from "@/components/layout/GlobalActionSheet";

const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/incomes", label: "Income", icon: Wallet },
    { isFab: true },
    { href: "/expenses", label: "Expense", icon: Receipt },
    { href: "/budgets", label: "Budget", icon: PiggyBank },
];

export function BottomTabBar() {
    const pathname = usePathname();
    const [actionSheetOpen, setActionSheetOpen] = useState(false);

    return (
        <>
            <nav className="fixed bottom-6 left-4 right-4 z-40 bg-white/70 dark:bg-black/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[32px] shadow-2xl md:hidden">
                <div className="flex items-center justify-around px-2 h-[72px]">
                    {navItems.map((item, index) => {
                        if (item.isFab) {
                            return (
                                <div key="fab" className="flex flex-col items-center justify-center flex-shrink-0 w-16 h-full relative z-50">
                                    <div className="absolute -top-6">
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setActionSheetOpen(true)}
                                            className="w-[60px] h-[60px] rounded-full shadow-[0_8px_30px_rgba(0,122,255,0.4)] flex items-center justify-center bg-gradient-to-br from-ios-blue to-[#005bb5] relative"
                                        >
                                            <Plus size={32} className="text-white relative z-10" strokeWidth={2.5} />
                                            {/* Glow effect */}
                                            <div className="absolute inset-x-2 -bottom-2 h-4 bg-ios-blue blur-xl opacity-60 rounded-full" />
                                        </motion.button>
                                    </div>
                                </div>
                            );
                        }

                        const isActive = pathname === item.href;
                        const Icon = item.icon!;
                        return (
                            <Link
                                key={item.href}
                                href={item.href!}
                                className="flex flex-col items-center justify-center flex-1 h-full gap-1 relative"
                            >
                                <motion.div
                                    animate={{ scale: isActive ? 1.1 : 0.9, y: isActive ? -2 : 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className="relative"
                                >
                                    <Icon
                                        size={24}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={cn(
                                            "transition-colors duration-200",
                                            isActive
                                                ? "text-ios-blue dark:text-ios-blue-dark drop-shadow-sm"
                                                : "text-[#8E8E93] dark:text-[#636366]"
                                        )}
                                    />
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ios-blue dark:bg-ios-blue-dark"
                                        />
                                    )}
                                </motion.div>
                                <span
                                    className={cn(
                                        "text-[10px] font-bold transition-colors duration-200 mt-0.5",
                                        isActive
                                            ? "text-ios-blue dark:text-ios-blue-dark opacity-100"
                                            : "text-[#8E8E93] dark:text-[#636366] opacity-0 h-0"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <GlobalActionSheet open={actionSheetOpen} onOpenChange={setActionSheetOpen} />
        </>
    );
}
