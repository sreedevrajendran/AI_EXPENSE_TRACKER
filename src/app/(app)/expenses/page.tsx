"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Receipt, Paperclip, TrendingDown, Hash } from "lucide-react";
import { trpc } from "@/trpc/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrivacyWrapper } from "@/components/ui/PrivacyWrapper";
import { AddExpenseSheet } from "@/components/expenses/AddExpenseSheet";
import { getLucideIcon } from "@/lib/icons";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { cn } from "@/lib/utils";

type Category = { name: string; icon: string; color: string } | null;
type ExpenseItem = { id: string; merchant: string; amount: number; date: Date; paymentMethod: string; category: Category; note: string | null; icon?: string | null; receiptUrl?: string | null };

const PM_COLORS: Record<string, string> = {
    CASH: "#34C759", CARD: "#007AFF", UPI: "#FF2D55",
    BANK_TRANSFER: "#FF9F0A", OTHER: "#8E8E93",
};
const PM_LABELS: Record<string, string> = {
    CASH: "Cash", CARD: "Card", UPI: "UPI",
    BANK_TRANSFER: "Bank", OTHER: "Other",
};

export default function ExpensesPage() {
    const [addOpen, setAddOpen] = useState(false);
    const [editExpense, setEditExpense] = useState<ExpenseItem | null>(null);
    const { data: expenses, isLoading: isListLoading } = trpc.expense.list.useQuery({ limit: 100 });
    const { data: monthTotal, isLoading: isTotalLoading } = trpc.expense.getMonthTotal.useQuery();

    const isLoading = isListLoading || isTotalLoading;

    // Group by date
    const grouped = (expenses ?? []).reduce(
        (acc: Record<string, ExpenseItem[]>, e: ExpenseItem) => {
            const key = formatDate(e.date);
            if (!acc[key]) acc[key] = [];
            acc[key].push(e);
            return acc;
        },
        {} as Record<string, ExpenseItem[]>
    );

    const utils = trpc.useUtils();
    const handleRefresh = async () => {
        await utils.expense.list.invalidate();
    };

    return (
        <>
            <PullToRefresh onRefresh={handleRefresh}>
                <div className="px-4 pt-3 pb-32 space-y-4">

                    {monthTotal !== undefined && (
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF3B30]/90 to-[#FF2D55]/90 backdrop-blur-2xl mb-2 border border-white/20 dark:border-white/10">
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/20 blur-2xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black/20 blur-xl pointer-events-none" />
                            <div className="p-6 text-white space-y-5 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[14px] font-medium text-white/90 tracking-wide uppercase mb-1">Total Expenses</p>
                                        <PrivacyWrapper><p className="text-4xl font-bold tracking-tight">{formatCurrency(monthTotal)}</p></PrivacyWrapper>
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-sm flex-shrink-0">
                                        <Receipt size={28} className="text-white drop-shadow-sm" />
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
                                            {expenses?.length ?? 0}
                                        </p>
                                    </div>
                                    <div className="w-[1px] h-8 bg-white/20 rounded-full" />
                                    <div className="flex-1 pl-2">
                                        <p className="text-[12px] text-white/70 font-medium uppercase tracking-wider mb-0.5">Largest</p>
                                        <PrivacyWrapper>
                                            <p className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 mt-0.5">
                                                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center inline-flex">
                                                    <TrendingDown size={12} className="text-white" />
                                                </span>
                                                {formatCurrency(expenses?.length ? Math.max(...expenses.map(e => e.amount)) : 0)}
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
                                    {(grouped[date] ?? []).map((expense: ExpenseItem, i: number) => {
                                        const Icon = getLucideIcon(expense.category?.icon ?? expense.icon ?? "circle");
                                        return (
                                            <motion.button
                                                type="button"
                                                onClick={() => setEditExpense(expense)}
                                                key={expense.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="group relative w-full text-left bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-2xl rounded-3xl p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] border border-white/50 dark:border-white/5 flex items-center gap-4 active:scale-[0.98] transition-all overflow-hidden"
                                            >
                                                <div
                                                    className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none"
                                                    style={{ backgroundColor: expense.category?.color ?? "#007AFF" }}
                                                />
                                                <div className="relative w-14 h-14 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                                                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: expense.category?.color ?? "#007AFF" }} />
                                                    <Icon size={26} style={{ color: expense.category?.color ?? "#007AFF" }} className="relative z-10" />
                                                </div>
                                                <div className="flex-1 min-w-0 relative z-10">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-[17px] font-bold ios-text-primary truncate tracking-tight">{expense.merchant}</p>
                                                        {expense.receiptUrl && (
                                                            <div className="text-ios-blue flex-shrink-0 bg-ios-blue/10 p-1 rounded-full" title="Has Attachment">
                                                                <Paperclip size={12} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-[12px] font-medium ios-text-secondary bg-[#F2F2F7] dark:bg-[#2C2C2E] px-2 py-0.5 rounded-md">
                                                            {expense.category?.name ?? "Uncategorized"}
                                                        </span>
                                                        <span
                                                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md"
                                                            style={{
                                                                color: PM_COLORS[expense.paymentMethod],
                                                                backgroundColor: `${PM_COLORS[expense.paymentMethod]}15`,
                                                            }}
                                                        >
                                                            {PM_LABELS[expense.paymentMethod]}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="relative z-10 text-right pr-1">
                                                    <PrivacyWrapper>
                                                        <p className="text-[19px] font-black text-[#FF3B30] dark:text-[#FF453A] tracking-tight whitespace-nowrap">
                                                            -{formatCurrency(expense.amount)}
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
                            <Receipt size={48} className="mx-auto mb-4 ios-text-secondary opacity-30" />
                            <p className="text-lg font-semibold ios-text-primary">No expenses yet</p>
                            <p className="text-sm ios-text-secondary mt-1">Add your first expense with the + button</p>
                        </div>
                    )}
                </div>
            </PullToRefresh>



            <AddExpenseSheet
                open={addOpen || !!editExpense}
                onOpenChange={(open) => {
                    if (!open) {
                        setAddOpen(false);
                        setEditExpense(null);
                    }
                }}
                editData={editExpense ? {
                    id: editExpense.id,
                    amount: editExpense.amount,
                    merchant: editExpense.merchant,
                    categoryId: editExpense.category?.name ? undefined : undefined, // Quick hack for typing, real category mapping works in sheets
                    paymentMethod: editExpense.paymentMethod as any,
                    date: editExpense.date,
                    receiptUrl: editExpense.receiptUrl
                } as any : undefined}
            />
        </>
    );
}
