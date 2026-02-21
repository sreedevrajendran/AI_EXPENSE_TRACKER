"use client";

import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { Sparkles, TrendingUp, TrendingDown, Minus, X, Lightbulb, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface AICoachSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SLIDES = [
    { id: 'score', title: 'Financial Health' },
    { id: 'categories', title: 'Top Spending' },
    { id: 'insights', title: 'AI Insights' },
    { id: 'tip', title: 'Pro Tip' },
];

function ScoreRing({ score }: { score: number }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = "white";

    return (
        <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                <motion.circle
                    cx="64" cy="64" r={radius}
                    stroke={color} strokeWidth="8" fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <motion.span
                    className="text-6xl font-bold"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    {score}
                </motion.span>
                <span className="text-sm opacity-60 font-medium">/ 100</span>
            </div>
        </div>
    );
}

function ScoreLabel({ score }: { score: number }) {
    if (score >= 80) return <span className="text-ios-green font-semibold">Excellent 🎉</span>;
    if (score >= 60) return <span className="text-ios-yellow font-semibold">Good 👍</span>;
    if (score >= 40) return <span className="text-ios-orange font-semibold">Fair ⚠️</span>;
    return <span className="text-ios-red font-semibold">Needs Work 🔴</span>;
}

import { useState, useEffect, useCallback } from "react";

export function AICoachSheet({ open, onOpenChange }: AICoachSheetProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { data, isLoading } = trpc.ai.getInsights.useQuery(undefined, {
        enabled: open,
        refetchOnWindowFocus: false,
    });

    const nextSlide = useCallback(() => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            onOpenChange(false);
        }
    }, [currentSlide, onOpenChange]);

    const prevSlide = useCallback(() => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    }, [currentSlide]);

    useEffect(() => {
        // Don't start the timer if sheet is closed, or if we are still loading data
        if (!open || isLoading || !data) {
            setCurrentSlide(0);
            return;
        }

        const timer = setInterval(nextSlide, 6000);
        return () => clearInterval(timer);
    }, [open, isLoading, data, nextSlide]);

    if (!open) return null;

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black z-50" />
                <Drawer.Content className="fixed inset-0 z-50 outline-none flex flex-col">
                    <Drawer.Title className="sr-only">AI Coach Status</Drawer.Title>

                    <div className="flex-1 bg-gradient-to-b from-[#1C1C1E] to-black relative overflow-hidden flex flex-col pt-safe-top">
                        {/* Status Bars */}
                        <div className="px-3 pt-4 flex gap-1 z-20">
                            {SLIDES.map((_, i) => (
                                <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-white"
                                        initial={{ width: "0%" }}
                                        animate={{ width: (!isLoading && data && i < currentSlide) ? "100%" : (!isLoading && data && i === currentSlide) ? "100%" : "0%" }}
                                        transition={{
                                            duration: (!isLoading && data && i === currentSlide) ? 6 : 0,
                                            ease: "linear"
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Top Context */}
                        <div className="px-4 py-4 flex items-center justify-between z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ios-blue to-ios-indigo flex items-center justify-center p-0.5 border-2 border-white/20">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-[15px]">AI Coach</h3>
                                    <p className="text-white/60 text-[11px] uppercase tracking-wider">{SLIDES[currentSlide].title}</p>
                                </div>
                            </div>
                            <button onClick={() => onOpenChange(false)} className="text-white/80 p-2">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Slide Content */}
                        <div className="flex-1 relative z-10 px-6 flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center space-y-4"
                                    >
                                        <div className="w-48 h-48 rounded-full border-4 border-white/10 border-t-white/80 animate-spin mx-auto" />
                                        <p className="text-white/60 font-medium">Analyzing your finances...</p>
                                    </motion.div>
                                ) : data && (
                                    <motion.div
                                        key={currentSlide}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 1.1, y: -20 }}
                                        className="flex-1 flex flex-col justify-center"
                                    >
                                        {currentSlide === 0 && (
                                            <div className="text-center space-y-8">
                                                <ScoreRing score={data.score} />
                                                <div className="space-y-2">
                                                    <div className="text-white/60 text-lg">You spent</div>
                                                    <div className="text-6xl font-bold text-white tracking-tight">
                                                        {formatCurrency(data.totalSpent)}
                                                    </div>
                                                    <div className="text-xl">
                                                        <ScoreLabel score={data.score} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {currentSlide === 1 && (
                                            <div className="space-y-6">
                                                <h2 className="text-3xl font-bold text-white mb-8 text-center">Top Categories</h2>
                                                <div className="space-y-4">
                                                    {data.topCategories.map((cat: { name: string; amount: number }, i: number) => (
                                                        <motion.div
                                                            key={cat.name}
                                                            initial={{ opacity: 0, x: -30 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.1 }}
                                                            className="bg-white/10 backdrop-blur-md rounded-2xl p-5 flex items-center justify-between border border-white/10"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-ios-blue flex items-center justify-center text-white font-bold">
                                                                    {i + 1}
                                                                </div>
                                                                <span className="text-xl text-white font-medium">{cat.name}</span>
                                                            </div>
                                                            <span className="text-xl text-white font-semibold">{formatCurrency(cat.amount)}</span>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {currentSlide === 2 && (
                                            <div className="space-y-6 text-center">
                                                <h2 className="text-3xl font-bold text-white mb-8">AI Insights</h2>
                                                <div className="space-y-4">
                                                    {data.insights.map((insight: string, i: number) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.2 }}
                                                            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-xl text-white leading-relaxed border border-white/10"
                                                        >
                                                            {insight}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {currentSlide === 3 && (
                                            <div className="text-center space-y-10">
                                                <div className="w-24 h-24 bg-ios-yellow/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <Lightbulb size={48} className="text-ios-yellow" />
                                                </div>
                                                <div className="space-y-4">
                                                    <h2 className="text-3xl font-bold text-white">AI Strategy</h2>
                                                    <p className="text-2xl text-white/90 leading-relaxed font-medium px-4">
                                                        "{data.tip}"
                                                    </p>
                                                </div>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => onOpenChange(false)}
                                                    className="mt-12 bg-white text-black font-bold py-4 px-12 rounded-full text-lg shadow-xl"
                                                >
                                                    Got it!
                                                </motion.button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Controls Overlay */}
                        <div className="absolute inset-0 flex z-30">
                            <div className="flex-1 cursor-pointer" onClick={prevSlide} />
                            <div className="flex-1 cursor-pointer" onClick={nextSlide} />
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
