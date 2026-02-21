"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function ExpenseChart() {
    const { data, isLoading } = trpc.expense.getMonthlyChartData.useQuery();

    if (isLoading) {
        return (
            <div className="ios-card w-full h-48 flex items-center justify-center">
                <Loader2 className="animate-spin ios-text-secondary" />
            </div>
        );
    }

    if (!data || data.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ios-card p-4 space-y-3"
        >
            <h2 className="text-sm font-semibold ios-text-secondary uppercase tracking-wider">
                Monthly Spending
            </h2>
            <div className="h-40 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#8E8E93" }}
                            dy={5}
                        />
                        <Tooltip
                            cursor={{ fill: "rgba(0,122,255,0.05)" }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white dark:bg-[#2C2C2E] shadow-xl border border-[#E5E5EA] dark:border-[#3A3A3C] rounded-ios-sm px-3 py-2">
                                            <p className="text-[15px] font-semibold ios-text-primary">
                                                {formatCurrency(payload[0].value as number)}
                                            </p>
                                            <p className="text-xs ios-text-secondary">
                                                Day {payload[0].payload.day}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="amount"
                            fill="#007AFF"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
