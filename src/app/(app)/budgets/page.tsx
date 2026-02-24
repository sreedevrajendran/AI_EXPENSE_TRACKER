"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, PiggyBank, MoreHorizontal } from "lucide-react";
import { Drawer } from "vaul";
import { trpc } from "@/trpc/client";
import { formatCurrency, getBudgetColor, getBudgetStatus } from "@/lib/utils";
import { PrivacyWrapper } from "@/components/ui/PrivacyWrapper";
import { getLucideIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { BudgetSheet, type BudgetWithSpent } from "@/components/budgets/BudgetSheet";

type BudgetCategory = { id: string; name: string; icon: string; color: string } | null;

function BudgetCard({ budget, onEdit }: { budget: BudgetWithSpent, onEdit: (b: BudgetWithSpent) => void }) {
    const status = getBudgetStatus(budget.spent, budget.amount);
    const color = getBudgetColor(status);
    const pct = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0;
    const Icon = getLucideIcon(budget.category?.icon ?? "circle");

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => onEdit(budget)}
            className="group relative w-full text-left bg-white dark:bg-[#1C1C1E] rounded-[32px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] border border-[#E5E5EA] dark:border-[#3A3A3C] space-y-5 cursor-pointer overflow-hidden transition-all"
        >
            <div
                className="absolute top-0 right-0 w-40 h-40 blur-3xl rounded-full opacity-10 pointer-events-none transition-opacity group-hover:opacity-20 -mr-4 -mt-4"
                style={{ backgroundColor: color }}
            />
            <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: budget.category?.color ?? "#007AFF" }} />
                        <Icon size={26} style={{ color: budget.category?.color ?? "#007AFF" }} className="relative z-10" />
                    </div>
                    <div>
                        <p className="text-[18px] font-bold ios-text-primary pr-8 truncate tracking-tight">
                            {budget.category?.name ?? "Overall"}
                        </p>
                        <p className="text-[13px] font-medium ios-text-secondary mt-0.5">{pct.toFixed(0)}% used</p>
                    </div>
                </div>
                <div className="text-right mt-1">
                    <PrivacyWrapper>
                        <p className="text-[19px] font-black tracking-tight" style={{ color }}>
                            {formatCurrency(budget.spent)}
                        </p>
                    </PrivacyWrapper>
                    <PrivacyWrapper>
                        <p className="text-[13px] ios-text-secondary font-medium mt-1">of {formatCurrency(budget.amount)}</p>
                    </PrivacyWrapper>
                </div>
            </div>

            <div className="relative z-10">
                <div className="relative h-3.5 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] overflow-hidden shadow-inner mb-3">
                    <motion.div
                        className="absolute top-0 left-0 h-full rounded-full"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}80`
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </div>
                <div className="flex justify-between text-[11px] font-bold ios-text-secondary uppercase tracking-wider">
                    <span style={{ color: pct >= 90 ? "#FF3B30" : undefined }}>
                        {status === "danger" ? "⚠️ OVER LIMIT" : `${formatCurrency(budget.amount - budget.spent)} LEFT`}
                    </span>
                    <span>BUDGET: <PrivacyWrapper>{formatCurrency(budget.amount)}</PrivacyWrapper></span>
                </div>
            </div>
        </motion.div>
    );
}

export default function BudgetsPage() {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null);
    const { data: budgets, isLoading } = trpc.budget.list.useQuery();

    const totalBudget = budgets?.reduce((s: number, b: BudgetWithSpent) => s + b.amount, 0) ?? 0;
    const totalSpent = budgets?.reduce((s: number, b: BudgetWithSpent) => s + b.spent, 0) ?? 0;

    return (
        <>
            <div className="px-4 pt-3 pb-32 space-y-4">
                {totalBudget > 0 && (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] dark:from-[#2C2C2E] dark:to-[#3A3A3C] p-6 text-white shadow-xl mb-2 border border-[#E5E5EA] dark:border-white/10">
                        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-ios-blue/20 blur-3xl pointer-events-none -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-purple-500/20 blur-2xl pointer-events-none -ml-10 -mb-10" />
                        <div className="relative z-10 flex items-center justify-between mb-6 pt-1">
                            <div>
                                <p className="text-[14px] font-medium text-white/70 tracking-wide uppercase mb-1">Total Budget</p>
                                <PrivacyWrapper><p className="text-3xl font-bold tracking-tight text-white">{formatCurrency(totalBudget)}</p></PrivacyWrapper>
                            </div>
                            <div className="text-right">
                                <p className="text-[14px] font-medium text-white/70 tracking-wide uppercase mb-1">Total Spent</p>
                                <PrivacyWrapper>
                                    <p className="text-3xl font-bold tracking-tight" style={{ color: getBudgetColor(getBudgetStatus(totalSpent, totalBudget)) }}>
                                        {formatCurrency(totalSpent)}
                                    </p>
                                </PrivacyWrapper>
                            </div>
                        </div>
                        <div className="relative h-3 rounded-full bg-white/10 overflow-hidden shadow-inner">
                            <motion.div
                                className="absolute top-0 left-0 h-full rounded-full"
                                style={{
                                    backgroundColor: getBudgetColor(getBudgetStatus(totalSpent, totalBudget)),
                                    boxShadow: `0 0 12px ${getBudgetColor(getBudgetStatus(totalSpent, totalBudget))}80`
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                )}

                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-ios bg-[#F2F2F7] dark:bg-[#1C1C1E] animate-pulse" />
                    ))
                ) : budgets?.length === 0 ? (
                    <div className="pt-20 text-center">
                        <PiggyBank size={48} className="mx-auto mb-4 ios-text-secondary opacity-30" />
                        <p className="text-lg font-semibold ios-text-primary">No budgets set</p>
                        <p className="text-sm ios-text-secondary mt-1">Create a budget to track your spending</p>
                    </div>
                ) : (
                    (budgets as BudgetWithSpent[])?.map((budget: BudgetWithSpent, i: number) => (
                        <motion.div key={budget.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                            <BudgetCard
                                budget={budget}
                                onEdit={(b) => {
                                    setEditingBudget(b);
                                    setSheetOpen(true);
                                }}
                            />
                        </motion.div>
                    ))
                )}
            </div>



            <BudgetSheet
                open={sheetOpen}
                onOpenChange={(open) => {
                    setSheetOpen(open);
                    if (!open) setTimeout(() => setEditingBudget(null), 300); // Clear state after animation
                }}
                existingBudget={editingBudget}
            />
        </>
    );
}
