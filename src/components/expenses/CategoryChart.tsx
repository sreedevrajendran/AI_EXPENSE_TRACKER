"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { trpc } from "@/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function CategoryChart() {
    const { data, isLoading } = trpc.expense.getCategoryChartData.useQuery();

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
                Spend by Category
            </h2>
            <div className="h-48 w-full mt-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                            data={data}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white dark:bg-[#2C2C2E] shadow-xl border border-[#E5E5EA] dark:border-[#3A3A3C] rounded-ios-sm px-3 py-2 flex items-center gap-2">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: data.color }}
                                            />
                                            <div>
                                                <p className="text-[14px] font-medium ios-text-primary">
                                                    {data.name}
                                                </p>
                                                <p className="text-[15px] font-semibold tracking-tight">
                                                    {formatCurrency(data.amount)}
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
                {/* Center text for Donut Chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-medium ios-text-secondary">Expenses</span>
                </div>
            </div>
        </motion.div>
    );
}
