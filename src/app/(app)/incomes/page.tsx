"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Receipt, Paperclip, Wallet } from "lucide-react";
import { trpc } from "@/trpc/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrivacyWrapper } from "@/components/ui/PrivacyWrapper";
import { AddIncomeSheet } from "@/components/income/AddIncomeSheet";
import { getLucideIcon } from "@/lib/icons";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { cn } from "@/lib/utils";

type Category = { name: string; icon: string; color: string } | null;
type IncomeItem = {
    id: string;
    source: string;
    amount: number;
    date: Date;
    category?: Category;
    note?: string | null;
    receiptUrl?: string | null
};

export default function IncomesPage() {
    const [addOpen, setAddOpen] = useState(false);
    const [editIncome, setEditIncome] = useState<IncomeItem | null>(null);
    const { data: incomes, isLoading: isListLoading } = trpc.income.list.useQuery({ limit: 100 });
    const { data: monthTotal, isLoading: isTotalLoading } = trpc.income.getMonthTotal.useQuery();

    const isLoading = isListLoading || isTotalLoading;

    // Group by date
    const grouped = (incomes ?? []).reduce(
        (acc: Record<string, IncomeItem[]>, e: any) => {
            const key = formatDate(e.date);
            if (!acc[key]) acc[key] = [];
            acc[key].push(e);
            return acc;
        },
        {} as Record<string, IncomeItem[]>
    );

    const utils = trpc.useUtils();
    const handleRefresh = async () => {
        await utils.income.list.invalidate();
    };

    return (
        <>
            <PullToRefresh onRefresh={handleRefresh}>
                <div className="px-4 pt-3 pb-6 space-y-4">

                    {monthTotal !== undefined && monthTotal > 0 && (
                        <div className="ios-card p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs ios-text-secondary">Total Income</p>
                                <PrivacyWrapper><p className="text-2xl font-bold text-[#34C759] dark:text-[#32D74B]">+{formatCurrency(monthTotal)}</p></PrivacyWrapper>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                                <Wallet size={20} className="text-[#34C759]" />
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-16 rounded-ios bg-[#F2F2F7] dark:bg-[#1C1C1E] animate-pulse" />
                        ))
                    ) : grouped && Object.keys(grouped).length > 0 ? (
                        Object.entries(grouped).map(([date, items]) => (
                            <div key={date}>
                                <p className="text-xs font-semibold ios-text-secondary uppercase tracking-wider mb-2 px-1">{date}</p>
                                <div className="ios-card overflow-hidden divide-y ios-separator">
                                    {(grouped[date] ?? []).map((income: IncomeItem, i: number) => {
                                        const Icon = getLucideIcon(income.category?.icon ?? "circle");
                                        return (
                                            <motion.button
                                                type="button"
                                                onClick={() => setEditIncome(income)}
                                                key={income.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="w-full text-left flex items-center gap-3 px-4 py-3.5 focus:outline-none active:bg-[#F2F2F7] dark:active:bg-[#2C2C2E] transition-colors"
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: `${income.category?.color ?? "#34C759"}20` }}
                                                >
                                                    <Icon size={18} style={{ color: income.category?.color ?? "#34C759" }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[15px] font-medium ios-text-primary truncate">{income.source}</p>
                                                        {income.receiptUrl && (
                                                            <div className="text-ios-blue flex-shrink-0" title="Has Attachment">
                                                                <Paperclip size={14} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs ios-text-secondary">{income.category?.name ?? "Direct Income"}</span>
                                                        <span className="text-xs ios-text-secondary">·</span>
                                                        <span
                                                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                                            style={{
                                                                color: "#34C759",
                                                                backgroundColor: "#34C75920",
                                                            }}
                                                        >
                                                            Income
                                                        </span>
                                                    </div>
                                                </div>
                                                <PrivacyWrapper>
                                                    <p className="text-[15px] font-semibold text-[#34C759] dark:text-[#32D74B] whitespace-nowrap">
                                                        +{formatCurrency(income.amount)}
                                                    </p>
                                                </PrivacyWrapper>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="pt-20 text-center">
                            <Wallet size={48} className="mx-auto mb-4 ios-text-secondary opacity-30" />
                            <p className="text-lg font-semibold ios-text-primary">No incomes yet</p>
                            <p className="text-sm ios-text-secondary mt-1">Add your first income with the + button</p>
                        </div>
                    )}
                </div>
            </PullToRefresh>

            <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                    setEditIncome(null);
                    setAddOpen(true);
                }}
                className="fixed bottom-[calc(83px+env(safe-area-inset-bottom,0px)+16px)] right-5 w-14 h-14 rounded-full shadow-ios-lg flex items-center justify-center z-40"
                style={{ background: "linear-gradient(135deg, #34C759, #30D158)" }}
            >
                <Plus size={28} className="text-white" strokeWidth={2.5} />
            </motion.button>

            <AddIncomeSheet
                open={addOpen || !!editIncome}
                onOpenChange={(open) => {
                    if (!open) {
                        setAddOpen(false);
                        setEditIncome(null);
                    }
                }}
                editData={editIncome ? {
                    id: editIncome.id,
                    amount: editIncome.amount,
                    source: editIncome.source,
                    receiptUrl: editIncome.receiptUrl || undefined
                } : undefined}
            />
        </>
    );
}
