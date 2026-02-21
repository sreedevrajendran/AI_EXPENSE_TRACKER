"use client";

import { motion } from "framer-motion";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from "recharts";
import { trpc } from "@/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function IncomeExpenseChart() {
    const { data, isLoading } = trpc.expense.getYearlyIncomeExpenseChart.useQuery();

    if (isLoading) {
        return (
            <div className="ios-card w-full h-64 flex items-center justify-center">
                <Loader2 className="animate-spin ios-text-secondary" />
            </div>
        );
    }

    if (!data || data.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ios-card p-4 space-y-4"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold ios-text-secondary uppercase tracking-wider">
                    Income vs Expense
                </h2>
                <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1 rounded-full bg-[#FF9500]" />
                        <span className="ios-text-primary">Income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1 rounded-full bg-[#FF2D55]" />
                        <span className="ios-text-primary">Expense</span>
                    </div>
                </div>
            </div>

            <div className="h-48 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#E5E5EA" className="dark:stroke-[#3A3A3C]" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#8E8E93" }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#8E8E93" }}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white dark:bg-[#2C2C2E] shadow-xl border border-[#E5E5EA] dark:border-[#3A3A3C] rounded-ios-sm px-3 py-2 space-y-1">
                                            <p className="text-xs font-semibold ios-text-secondary mb-1">{label}</p>

                                            {payload.map((entry: any) => (
                                                <div key={entry.name} className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: entry.color }}
                                                        />
                                                        <span className="text-xs capitalize ios-text-secondary">
                                                            {entry.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-[13px] font-semibold ios-text-primary" style={{ color: entry.color }}>
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
                        <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#FF9500"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: "#FF9500", stroke: "#fff" }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: "#FF9500" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="expense"
                            stroke="#FF2D55"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: "#FF2D55", stroke: "#fff" }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: "#FF2D55" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
