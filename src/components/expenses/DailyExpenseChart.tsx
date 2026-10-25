"use client";

import { motion } from "framer-motion";
import { trpc } from "@/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    ReferenceLine,
} from "recharts";
import { useMemo, useEffect } from "react";
import { useCurrency } from "@/context/CurrencyContext";

export function DailyExpenseChart() {
    const { currency } = useCurrency();
    const { data, isLoading, refetch } = trpc.expense.getDailyExpenses.useQuery();
    const { data: activePeriod } = trpc.expense.getActivePeriod.useQuery();

    useEffect(() => {
        const handleUpdate = () => {
            refetch();
        };
        window.addEventListener("app:transactions-updated", handleUpdate);
        return () => window.removeEventListener("app:transactions-updated", handleUpdate);
    }, [refetch]);

    const avg = useMemo(() => {
        if (!data || data.length === 0) return 0;
        return data.reduce((s, d) => s + d.amount, 0) / data.length;
    }, [data]);

    const max = useMemo(() => {
        if (!data || data.length === 0) return 0;
        return Math.max(...data.map((d) => d.amount));
    }, [data]);

    if (isLoading) {
        return (
            <div className="ios-card w-full h-52 flex items-center justify-center">
                <Loader2 className="animate-spin ios-text-secondary" />
            </div>
        );
    }

    if (!data || data.length === 0) return null;

    const peakDay = max > 0 ? data.find((d) => d.amount === max) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] space-y-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold ios-text-secondary uppercase tracking-wider">
                        Daily Spending
                    </h2>
                    <p className="text-xs ios-text-secondary mt-0.5 opacity-70">
                        {activePeriod?.label || "This month"} · day by day
                    </p>
                </div>
                <div className="text-right">
                    {peakDay && (
                        <p className="text-xs ios-text-secondary">
                            Peak: <span className="font-semibold text-[#FF3B30]">{formatCurrency(max)}</span>
                            <span className="opacity-60"> on day {peakDay.day}</span>
                        </p>
                    )}
                    <p className="text-xs ios-text-secondary">
                        Avg: <span className="font-semibold ios-text-primary">{formatCurrency(avg)}</span>
                        <span className="opacity-60"> / day</span>
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart
                        key={`daily-chart-${currency}-${data.length}-${max}-${avg}`}
                        data={data}
                        margin={{ top: 8, right: 4, left: -28, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#FF3B30" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(142,142,147,0.15)"
                        />

                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "#8E8E93" }}
                            dy={4}
                            interval={data.length > 20 ? 4 : data.length > 10 ? 2 : 0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "#8E8E93" }}
                            tickFormatter={(v) => formatCurrency(v, true)}
                        />

                        {/* Dashed average line */}
                        {avg > 0 && (
                            <ReferenceLine
                                y={avg}
                                stroke="#8E8E93"
                                strokeDasharray="4 3"
                                strokeWidth={1}
                            />
                        )}

                        <Tooltip
                            cursor={{ stroke: "#FF3B30", strokeWidth: 1, strokeDasharray: "3 3" }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0]?.payload;
                                    const amount = payload[0]?.value as number;
                                    const isAboveAvg = amount > avg;
                                    return (
                                        <div className="bg-white dark:bg-[#2C2C2E] shadow-xl border border-[#E5E5EA] dark:border-[#3A3A3C] rounded-xl px-3 py-2.5 min-w-[110px]">
                                            <p className="text-[13px] ios-text-secondary mb-0.5">Day {d.day}</p>
                                            <p className="text-[16px] font-bold" style={{ color: isAboveAvg ? "#FF3B30" : "#34C759" }}>
                                                {formatCurrency(amount)}
                                            </p>
                                            <p className="text-[11px] mt-0.5" style={{ color: isAboveAvg ? "#FF3B30" : "#34C759" }}>
                                                {isAboveAvg ? `+${formatCurrency(amount - avg)} above avg` : `${formatCurrency(avg - amount)} below avg`}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#FF3B30"
                            strokeWidth={2}
                            fill="url(#dailyGradient)"
                            dot={(props) => {
                                const { cx, cy, payload } = props;
                                if (payload.amount === max && max > 0) {
                                    return (
                                        <circle
                                            key={`peak-${payload.day}`}
                                            cx={cx}
                                            cy={cy}
                                            r={4}
                                            fill="#FF3B30"
                                            stroke="white"
                                            strokeWidth={2}
                                        />
                                    );
                                }
                                return <g key={`dot-${payload.day}`} />;
                            }}
                            activeDot={{ r: 5, fill: "#FF3B30", stroke: "white", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[11px] ios-text-secondary">
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#FF3B30] inline-block rounded-full" />
                    Daily spend
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#8E8E93] inline-block rounded-full opacity-60" style={{ borderTop: "1px dashed #8E8E93", height: 0 }} />
                    Avg line
                </span>
            </div>
        </motion.div>
    );
}
