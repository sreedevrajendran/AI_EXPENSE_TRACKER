"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, List, PiggyBank, Settings, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/incomes", label: "Incomes", icon: Wallet },
    { href: "/expenses", label: "Expenses", icon: List },
    { href: "/budgets", label: "Budgets", icon: PiggyBank },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomTabBar() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 ios-glass border-t ios-separator tab-bar-safe md:hidden">
            <div className="flex items-center justify-around px-2 h-[49px]">
                {tabs.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
                        >
                            <motion.div
                                animate={{ scale: isActive ? 1 : 0.85 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className="relative"
                            >
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                    className={cn(
                                        "transition-colors duration-150",
                                        isActive
                                            ? "text-ios-blue dark:text-ios-blue-dark"
                                            : "text-[#8E8E93] dark:text-[#636366]"
                                    )}
                                />
                            </motion.div>
                            <span
                                className={cn(
                                    "text-[10px] font-medium transition-colors duration-150",
                                    isActive
                                        ? "text-ios-blue dark:text-ios-blue-dark"
                                        : "text-[#8E8E93] dark:text-[#636366]"
                                )}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
