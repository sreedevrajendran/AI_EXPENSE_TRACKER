"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Receipt, Paperclip } from "lucide-react";
import { trpc } from "@/trpc/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrivacyWrapper } from "@/components/ui/PrivacyWrapper";
import { AddExpenseSheet } from "@/components/expenses/AddExpenseSheet";
import { getLucideIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Category = { name: string; icon: string; color: string } | null;
type ExpenseItem = { id: string; merchant: string; amount: number; date: Date; paymentMethod: string; category: Category; note: string | null; receiptUrl?: string | null };

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
    const { data: expenses, isLoading } = trpc.expense.list.useQuery({ limit: 100 });

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

    return (
        <>
            <div className="px-4 pt-4 pb-6 space-y-2">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-ios bg-[#F2F2F7] dark:bg-[#1C1C1E] animate-pulse" />
                    ))
                ) : grouped && Object.keys(grouped).length > 0 ? (
                    Object.entries(grouped).map(([date, items]) => (
                        <div key={date}>
                            <p className="text-xs font-semibold ios-text-secondary uppercase tracking-wider mb-2 px-1">{date}</p>
                            <div className="ios-card overflow-hidden divide-y ios-separator">
                                {(grouped[date] ?? []).map((expense: ExpenseItem, i: number) => {
                                    const Icon = getLucideIcon(expense.category?.icon ?? "circle");
                                    return (
                                        <motion.button
                                            type="button"
                                            onClick={() => setEditExpense(expense)}
                                            key={expense.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="w-full text-left flex items-center gap-3 px-4 py-3.5 focus:outline-none active:bg-[#F2F2F7] dark:active:bg-[#2C2C2E] transition-colors"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${expense.category?.color ?? "#007AFF"}20` }}
                                            >
                                                <Icon size={18} style={{ color: expense.category?.color ?? "#007AFF" }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[15px] font-medium ios-text-primary truncate">{expense.merchant}</p>
                                                    {expense.receiptUrl && (
                                                        <div className="text-ios-blue flex-shrink-0" title="Has Attachment">
                                                            <Paperclip size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs ios-text-secondary">{expense.category?.name ?? "Uncategorized"}</span>
                                                    <span className="text-xs ios-text-secondary">·</span>
                                                    <span
                                                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                                        style={{
                                                            color: PM_COLORS[expense.paymentMethod],
                                                            backgroundColor: `${PM_COLORS[expense.paymentMethod]}20`,
                                                        }}
                                                    >
                                                        {PM_LABELS[expense.paymentMethod]}
                                                    </span>
                                                </div>
                                            </div>
                                            <PrivacyWrapper>
                                                <p className="text-[15px] font-semibold ios-text-primary whitespace-nowrap">
                                                    -{formatCurrency(expense.amount)}
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
                        <Receipt size={48} className="mx-auto mb-4 ios-text-secondary opacity-30" />
                        <p className="text-lg font-semibold ios-text-primary">No expenses yet</p>
                        <p className="text-sm ios-text-secondary mt-1">Add your first expense with the + button</p>
                    </div>
                )}
            </div>

            <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                    setEditExpense(null);
                    setAddOpen(true);
                }}
                className="fixed bottom-[calc(83px+env(safe-area-inset-bottom,0px)+16px)] right-5 w-14 h-14 rounded-full shadow-ios-lg flex items-center justify-center z-40"
                style={{ background: "linear-gradient(135deg, #007AFF, #5856D6)" }}
            >
                <Plus size={28} className="text-white" strokeWidth={2.5} />
            </motion.button>

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
