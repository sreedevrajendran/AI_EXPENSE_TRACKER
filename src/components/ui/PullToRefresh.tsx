"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAtTop, setIsAtTop] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            setIsAtTop(window.scrollY <= 0);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isAtTop || isRefreshing) return;
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isAtTop || isRefreshing || startY === 0) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            // Prevent default scroll behavior when pulling down
            e.preventDefault();
            // Apply resistance
            const distance = Math.min(diff * 0.5, MAX_PULL);
            setPullDistance(distance);
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(PULL_THRESHOLD); // Hold at threshold while refreshing

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
                setStartY(0);
            }
        } else {
            // Spring back if didn't reach threshold
            setPullDistance(0);
            setStartY(0);
        }
    };

    const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

    return (
        <div
            className="relative min-h-screen"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <AnimatePresence>
                {(pullDistance > 0 || isRefreshing) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: pullDistance - 40 // Offset above screen initially
                        }}
                        exit={{ opacity: 0, scale: 0.8, y: -40 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
                    >
                        <div className="bg-white dark:bg-[#2C2C2E] shadow-ios-md rounded-full w-10 h-10 flex items-center justify-center border border-[#E5E5EA] dark:border-[#3A3A3C]">
                            {isRefreshing ? (
                                <Loader2 size={20} className="text-ios-blue animate-spin" />
                            ) : (
                                <motion.div
                                    animate={{ rotate: progress >= 1 ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ArrowDown
                                        size={20}
                                        className="text-ios-secondary"
                                        style={{ opacity: 0.3 + (progress * 0.7) }}
                                    />
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                animate={{ y: isRefreshing ? PULL_THRESHOLD : pullDistance }}
                transition={isRefreshing ? { type: "spring", stiffness: 300, damping: 25 } : { duration: 0 }}
                className="w-full h-full"
            >
                {children}
            </motion.div>
        </div>
    );
}
