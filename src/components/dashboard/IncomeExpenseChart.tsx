"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from "recharts";
import { trpc } from "@/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { Loader2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

export function IncomeExpenseChart() {
    const { currency } = useCurrency();
    const { data, isLoading, refetch } = trpc.expense.getYearlyIncomeExpenseChart.useQuery();
    const [activeRange, setActiveRange] = useState<"6M" | "1Y">("1Y");

    useEffect(() => {
        const handleUpdate = () => {
            refetch();
        };
        window.addEventListener("app:transactions-updated", handleUpdate);
        return () => window.removeEventListener("app:transactions-updated", handleUpdate);
    }, [refetch]);

    if (isLoading) {
        return (
            <div className="w-full h-72 rounded-[28px] bg-white/60 dark:bg-[#1C1C1E]/60 border border-neutral-200/50 dark:border-neutral-800/50 p-5 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="h-4 w-32 rounded-lg bg-neutral-200/80 dark:bg-neutral-800/80" />
                    <div className="h-6 w-16 rounded-xl bg-neutral-200/60 dark:bg-neutral-800/60" />
                </div>
                <div className="h-48 w-full rounded-2xl bg-neutral-100/80 dark:bg-neutral-850/50" />
            </div>
        );
    }

    if (!data || data.length === 0) return null;

    const displayData = activeRange === "6M" ? data.slice(-6) : data;

    const totalIncome = displayData.reduce((sum, d) => sum + (d.income || 0), 0);
    const totalExpense = displayData.reduce((sum, d) => sum + (d.expense || 0), 0);
    const netCashflow = totalIncome - totalExpense;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] space-y-4 overflow-hidden relative"
        >
            {/* Header & Net Flow Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
                            Cashflow Analytics
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${netCashflow >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                            {netCashflow >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {netCashflow >= 0 ? "+" : ""}{formatCurrency(netCashflow)} Net
                        </span>
                    </div>
                    <div className="flex items-baseline gap-4 mt-1.5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                            <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">
                                {formatCurrency(totalIncome)} In
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/40" />
                            <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">
                                {formatCurrency(totalExpense)} Out
                            </span>
                        </div>
                    </div>
                </div>

                {/* Range Filter Pills */}
                <div className="flex items-center gap-1 self-start sm:self-auto bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setActiveRange("6M")}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${activeRange === "6M" ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"}`}
                    >
                        6M
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveRange("1Y")}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${activeRange === "1Y" ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs" : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"}`}
                    >
                        1Y
                    </button>
                </div>
            </div>

            {/* Smooth Gradient Area Chart */}
            <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="4 4"
                            vertical={false}
                            stroke="currentColor"
                            className="text-neutral-200 dark:text-neutral-800"
                        />

                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#8E8E93" }}
                            dy={8}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#8E8E93" }}
                            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                        />

                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white/95 dark:bg-[#1E1E22]/95 backdrop-blur-md shadow-xl border border-neutral-200/80 dark:border-neutral-700/80 rounded-2xl px-3.5 py-2.5 space-y-1.5 min-w-[130px]">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{label}</p>
                                            {payload.map((entry: any) => (
                                                <div key={entry.name} className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: entry.color }}
                                                        />
                                                        <span className="text-xs font-semibold capitalize text-neutral-600 dark:text-neutral-300">
                                                            {entry.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-[13px] font-extrabold text-neutral-900 dark:text-white">
                                                        {formatCurrency(entry.value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#10B981"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#incomeGradient)"
                        />

                        <Area
                            type="monotone"
                            dataKey="expense"
                            stroke="#F43F5E"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#expenseGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
