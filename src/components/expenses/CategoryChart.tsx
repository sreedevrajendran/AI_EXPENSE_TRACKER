"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { trpc } from "@/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { Loader2, PieChart as PieIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { getLucideIcon } from "@/lib/icons";

export function CategoryChart() {
    const { currency } = useCurrency();
    const { data, isLoading, refetch } = trpc.expense.getCategoryChartData.useQuery();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const handleUpdate = () => {
            refetch();
        };
        window.addEventListener("app:transactions-updated", handleUpdate);
        return () => window.removeEventListener("app:transactions-updated", handleUpdate);
    }, [refetch]);

    if (isLoading) {
        return (
            <div className="w-full h-56 rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center shadow-sm">
                <Loader2 className="animate-spin text-neutral-400" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="w-full rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <PieIcon size={20} />
                </div>
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">No Category Expenses Yet</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Log an expense or scan a receipt to see your category breakdown.
                </p>
            </div>
        );
    }

    const totalSpend = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    const sortedCategories = [...data].sort((a, b) => b.amount - a.amount);
    const displayedCategories = showAll ? sortedCategories : sortedCategories.slice(0, 4);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] space-y-4"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        Spending By Category
                    </h2>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                        {formatCurrency(totalSpend)} Total
                    </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                    <PieIcon size={18} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Donut Chart */}
                <div className="h-44 w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Pie
                                data={data}
                                dataKey="amount"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={72}
                                paddingAngle={3}
                                stroke="none"
                                onMouseEnter={(_, idx) => setActiveIndex(idx)}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                                        style={{ transition: "opacity 0.2s ease" }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const item = payload[0].payload;
                                        const pct = totalSpend > 0 ? ((item.amount / totalSpend) * 100).toFixed(0) : "0";
                                        return (
                                            <div className="bg-white/95 dark:bg-[#1E1E22]/95 backdrop-blur-md shadow-xl border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl px-3 py-2 flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <div>
                                                    <p className="text-[13px] font-bold text-neutral-900 dark:text-white leading-tight">
                                                        {item.name} ({pct}%)
                                                    </p>
                                                    <p className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
                                                        {formatCurrency(item.amount)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                            {activeIndex !== null ? data[activeIndex]?.name : "Breakdown"}
                        </span>
                        <span className="text-sm font-extrabold text-neutral-900 dark:text-white">
                            {activeIndex !== null
                                ? formatCurrency(data[activeIndex]?.amount || 0)
                                : `${data.length} Categories`}
                        </span>
                    </div>
                </div>

                {/* Categories Progress Bars */}
                <div className="space-y-2.5">
                    {displayedCategories.map((cat, idx) => {
                        const pct = totalSpend > 0 ? (cat.amount / totalSpend) * 100 : 0;
                        const IconComponent = cat.icon ? getLucideIcon(cat.icon) : null;
                        return (
                            <div
                                key={cat.name}
                                onMouseEnter={() => setActiveIndex(idx)}
                                onMouseLeave={() => setActiveIndex(null)}
                                className="space-y-1 cursor-pointer transition-opacity"
                            >
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                        {IconComponent && <IconComponent size={12} className="text-neutral-400" />}
                                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[140px]">{cat.name}</span>
                                    </div>
                                    <span className="font-bold text-neutral-600 dark:text-neutral-300">
                                        {formatCurrency(cat.amount)} <span className="text-[11px] font-normal text-neutral-400">({pct.toFixed(0)}%)</span>
                                    </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: cat.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {sortedCategories.length > 4 && (
                        <button
                            type="button"
                            onClick={() => setShowAll(!showAll)}
                            className="w-full py-1 text-center text-[11px] font-bold text-ios-blue dark:text-ios-blue-dark flex items-center justify-center gap-1 hover:underline pt-1"
                        >
                            <span>{showAll ? "Show Top 4" : `View All ${sortedCategories.length} Categories`}</span>
                            {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
