"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Receipt, Paperclip, Wallet, TrendingUp, Hash } from "lucide-react";
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
    icon?: string | null;
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
                <div className="px-4 pt-3 pb-32 space-y-4">

                    {monthTotal !== undefined && (
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#34C759]/90 to-[#30D158]/90 backdrop-blur-2xl mb-2 border border-white/20 dark:border-white/10 shadow-xl shadow-[#34C759]/20">
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/20 blur-2xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black/20 blur-xl pointer-events-none" />
                            <div className="p-6 text-white space-y-5 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[14px] font-medium text-white/90 tracking-wide uppercase mb-1">Total Income</p>
                                        <PrivacyWrapper><p className="text-4xl font-bold tracking-tight">{formatCurrency(monthTotal)}</p></PrivacyWrapper>
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-sm flex-shrink-0">
                                        <Wallet size={28} className="text-white drop-shadow-sm" />
                                    </div>
                                </div>
                                <div className="h-[1px] w-full bg-white/20 rounded-full" />
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-[12px] text-white/70 font-medium uppercase tracking-wider mb-0.5">Transactions</p>
                                        <p className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 mt-0.5">
                                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center inline-flex">
                                                <Hash size={12} className="text-white" />
                                            </span>
                                            {incomes?.length ?? 0}
                                        </p>
                                    </div>
                                    <div className="w-[1px] h-8 bg-white/20 rounded-full" />
                                    <div className="flex-1 pl-2">
                                        <p className="text-[12px] text-white/70 font-medium uppercase tracking-wider mb-0.5">Largest</p>
                                        <PrivacyWrapper>
                                            <p className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 mt-0.5">
                                                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center inline-flex">
                                                    <TrendingUp size={12} className="text-white" />
                                                </span>
                                                {formatCurrency(incomes?.length ? Math.max(...incomes.map(i => i.amount)) : 0)}
                                            </p>
                                        </PrivacyWrapper>
                                    </div>
                                </div>
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
                                <p className="text-[13px] font-semibold ios-text-secondary uppercase tracking-wider mb-3 px-1 mt-2">{date}</p>
                                <div className="space-y-3">
                                    {(grouped[date] ?? []).map((income: IncomeItem, i: number) => {
                                        const Icon = getLucideIcon(income.category?.icon ?? income.icon ?? "circle");
                                        return (
                                            <motion.button
                                                type="button"
                                                onClick={() => setEditIncome(income)}
                                                key={income.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="group relative w-full text-left bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-2xl rounded-3xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] border border-white/50 dark:border-white/5 flex items-center gap-4 active:scale-[0.98] transition-all overflow-hidden"
                                            >
                                                <div
                                                    className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none"
                                                    style={{ backgroundColor: income.category?.color ?? "#34C759" }}
                                                />
                                                <div className="relative w-14 h-14 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                                                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: income.category?.color ?? "#34C759" }} />
                                                    <Icon size={26} style={{ color: income.category?.color ?? "#34C759" }} className="relative z-10" />
                                                </div>
                                                <div className="flex-1 min-w-0 relative z-10">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-[17px] font-bold ios-text-primary truncate tracking-tight">{income.source}</p>
                                                        {income.receiptUrl && (
                                                            <div className="text-ios-blue flex-shrink-0 bg-ios-blue/10 p-1 rounded-full" title="Has Attachment">
                                                                <Paperclip size={12} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-[12px] font-medium ios-text-secondary bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2 py-0.5 rounded-md">
                                                            {income.category?.name ?? "Direct Income"}
                                                        </span>
                                                        <span
                                                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md"
                                                            style={{
                                                                color: "#34C759",
                                                                backgroundColor: "#34C75915",
                                                            }}
                                                        >
                                                            INCOME
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="relative z-10 text-right pr-1">
                                                    <PrivacyWrapper>
                                                        <p className="text-[19px] font-black text-[#34C759] dark:text-[#32D74B] tracking-tight whitespace-nowrap">
                                                            +{formatCurrency(income.amount)}
                                                        </p>
                                                    </PrivacyWrapper>
                                                </div>
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
