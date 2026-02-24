"use client";

import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, TrendingDown, ArrowUpRight, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { toast } from "react-hot-toast";

interface StatementReviewSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transactions: any[];
}

export function StatementReviewSheet({ open, onOpenChange, transactions }: StatementReviewSheetProps) {
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Select all transactions when the sheet opens with new data
    useEffect(() => {
        if (transactions.length > 0) {
            setSelectedIndices(new Set(transactions.map((_, i) => i)));
        }
    }, [transactions]);

    const utils = trpc.useUtils();
    const bulkCreateExpenses = trpc.expense.bulkCreateWithCategories.useMutation();
    const bulkCreateIncomes = trpc.income.bulkCreate.useMutation();

    const toggleSelection = (index: number) => {
        const next = new Set(selectedIndices);
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        setSelectedIndices(next);
    };

    const handleSave = async () => {
        if (selectedIndices.size === 0) {
            toast.error("No transactions selected");
            return;
        }

        setIsSaving(true);
        const selected = transactions.filter((_, i) => selectedIndices.has(i));

        const VALID_PAYMENT_METHODS = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "OTHER"];

        const expenses = selected.filter(t => t.type === "expense").map(t => ({
            amount: Number(t.amount) || 0,
            merchant: t.title || "Unknown Merchant",
            date: t.date ? new Date(t.date) : new Date(),
            categoryName: t.category || undefined, // Pass the AI category name for server-side resolution
            paymentMethod: t.paymentMethod && VALID_PAYMENT_METHODS.includes(t.paymentMethod)
                ? (t.paymentMethod as any)
                : "BANK_TRANSFER",
        }));

        const incomes = selected.filter(t => t.type === "income").map(t => ({
            amount: Number(t.amount) || 0,
            source: t.title || "Unknown Source",
            date: t.date ? new Date(t.date) : new Date(),
            categoryId: undefined,
        }));


        try {
            const promises = [];
            if (expenses.length > 0) promises.push(bulkCreateExpenses.mutateAsync(expenses));
            if (incomes.length > 0) promises.push(bulkCreateIncomes.mutateAsync(incomes));

            await Promise.all(promises);

            await Promise.all([
                utils.expense.list.invalidate(),
                utils.expense.getMonthTotal.invalidate(),
                utils.income.list.invalidate(),
                utils.income.getMonthTotal.invalidate(),
                utils.ai.getInsights.invalidate(),
            ]);

            toast.success(`Saved ${selected.length} transactions successfully!`);
            handleClose();
        } catch (error: any) {
            console.error("Failed to save statement:", error);
            toast.error(error.message || "Failed to save transactions.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            setSelectedIndices(new Set());
            setIsSaving(false);
        }, 300);
    };

    return (
        <Drawer.Root open={open} onOpenChange={(val) => !isSaving && (val ? onOpenChange(true) : handleClose())}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm transition-opacity" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-[#F2F2F7] dark:bg-[#000000] rounded-t-[28px] flex flex-col outline-none overflow-hidden max-h-[90vh]">
                    <Drawer.Title className="sr-only">Review Statement Transactions</Drawer.Title>

                    <div className="flex justify-center pt-3 pb-2 bg-white dark:bg-[#1C1C1E] rounded-t-[28px] z-10">
                        <div className="w-10 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C]" />
                    </div>

                    <div className="px-5 py-4 bg-white dark:bg-[#1C1C1E] border-b ios-separator">
                        <h2 className="text-xl font-bold ios-text-primary text-center">Review Statement</h2>
                        <p className="text-[13px] text-center ios-text-secondary mt-1">
                            We found {transactions.length} transactions. Uncheck any duplicates before saving.
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-safe">
                        <AnimatePresence>
                            {transactions.map((t, index) => {
                                const isSelected = selectedIndices.has(index);
                                const isIncome = t.type === "income";
                                const Icon = isIncome ? ArrowUpRight : TrendingDown;
                                const colorClass = isIncome ? "text-[#34C759]" : "text-[#FF453A]";
                                const bgClass = isIncome ? "bg-[#34C759]/10" : "bg-[#FF453A]/10";

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border ${isSelected ? 'border-ios-blue shadow-sm' : 'border-[#E5E5EA] dark:border-[#3A3A3C] opacity-60'} transition-all cursor-pointer`}
                                        onClick={() => toggleSelection(index)}
                                    >
                                        <button
                                            type="button"
                                            className="flex-shrink-0 focus:outline-none transition-transform active:scale-95"
                                        >
                                            {isSelected ? (
                                                <CheckCircle2 size={24} className="text-ios-blue fill-ios-blue/10" />
                                            ) : (
                                                <Circle size={24} className="text-[#C7C7CC] dark:text-[#636366]" />
                                            )}
                                        </button>

                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass}`}>
                                            <Icon size={20} className={colorClass} strokeWidth={2.5} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold ios-text-primary truncate pr-2 text-[15px]">{t.title}</p>
                                                <p className={`font-bold whitespace-nowrap ${colorClass}`}>
                                                    {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 opacity-80">
                                                <span className="text-[12px] ios-text-secondary">
                                                    {t.date ? formatDate(new Date(t.date)) : "Unknown Date"}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-[#C7C7CC] dark:bg-[#636366]" />
                                                <span className="text-[12px] ios-text-secondary truncate">
                                                    {t.category || "Uncategorized"}
                                                </span>
                                                {!isIncome && t.paymentMethod && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-[#C7C7CC] dark:bg-[#636366]" />
                                                        <span className="text-[12px] ios-text-secondary">
                                                            {t.paymentMethod}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    <div className="p-4 bg-white dark:bg-[#1C1C1E] border-t ios-separator pb-safe pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || selectedIndices.size === 0}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-ios-blue to-[#005bb5] text-white font-bold text-[17px] shadow-lg shadow-ios-blue/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Saving...
                                </>
                            ) : (
                                `Save ${selectedIndices.size} Selected`
                            )}
                        </button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
