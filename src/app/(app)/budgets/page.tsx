"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, PiggyBank, MoreHorizontal } from "lucide-react";
import { Drawer } from "vaul";
import { trpc } from "@/trpc/client";
import { formatCurrency, getBudgetColor, getBudgetStatus } from "@/lib/utils";
import { PrivacyWrapper } from "@/components/ui/PrivacyWrapper";
import { getLucideIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

type BudgetCategory = { id: string; name: string; icon: string; color: string } | null;
type BudgetWithSpent = { id: string; amount: number; spent: number; period: string; userId: string; categoryId: string | null; createdAt: Date; updatedAt: Date; category: BudgetCategory };

function BudgetCard({ budget, onEdit }: { budget: BudgetWithSpent, onEdit: (b: BudgetWithSpent) => void }) {
    const status = getBudgetStatus(budget.spent, budget.amount);
    const color = getBudgetColor(status);
    const pct = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0;
    const Icon = getLucideIcon(budget.category?.icon ?? "circle");

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => onEdit(budget)}
            className="ios-card p-4 space-y-3 relative cursor-pointer active:opacity-80 transition-opacity"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                        style={{ backgroundColor: `${budget.category?.color ?? "#007AFF"}20` }}
                    >
                        <Icon size={17} style={{ color: budget.category?.color ?? "#007AFF" }} />
                    </div>
                    <div>
                        <p className="text-[15px] font-semibold ios-text-primary pr-8 truncate">
                            {budget.category?.name ?? "Overall"}
                        </p>
                        <p className="text-xs ios-text-secondary">{pct.toFixed(0)}% used</p>
                    </div>
                </div>
                <div className="text-right mt-1">
                    <PrivacyWrapper>
                        <p className="text-[15px] font-bold" style={{ color }}>
                            {formatCurrency(budget.spent)}
                        </p>
                    </PrivacyWrapper>
                    <PrivacyWrapper>
                        <p className="text-xs ios-text-secondary">of {formatCurrency(budget.amount)}</p>
                    </PrivacyWrapper>
                </div>
            </div>



            <div className="h-2.5 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
            <div className="flex justify-between text-xs ios-text-secondary">
                <span style={{ color: pct >= 90 ? "#FF3B30" : undefined }}>
                    {status === "danger" ? "⚠️ Over limit!" : `${formatCurrency(budget.amount - budget.spent)} left`}
                </span>
                <span>Budget: <PrivacyWrapper>{formatCurrency(budget.amount)}</PrivacyWrapper></span>
            </div>
        </motion.div>
    );
}

function BudgetSheet({ open, onOpenChange, existingBudget }: { open: boolean; onOpenChange: (o: boolean) => void; existingBudget?: BudgetWithSpent | null }) {
    const [amount, setAmount] = useState(existingBudget ? existingBudget.amount.toString() : "");
    const [categoryId, setCategoryId] = useState<string | undefined>(existingBudget?.categoryId || undefined);
    const [isCustom, setIsCustom] = useState(false);
    const [customCategoryName, setCustomCategoryName] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Automatically keep state in sync when editing a different budget
    useEffect(() => {
        if (open) {
            setAmount(existingBudget ? existingBudget.amount.toString() : "");
            setCategoryId(existingBudget?.categoryId || undefined);
            setIsCustom(false);
            setCustomCategoryName("");
            setShowDeleteConfirm(false);
        }
    }, [open, existingBudget]);

    const utils = trpc.useUtils();
    const { data: categories } = trpc.category.listAll.useQuery(undefined, { enabled: open });

    const handleSuccess = () => {
        utils.budget.list.invalidate();
        setAmount("");
        setCategoryId(undefined);
        onOpenChange(false);
    };

    const create = trpc.budget.create.useMutation({ onSuccess: handleSuccess });
    const update = trpc.budget.update.useMutation({ onSuccess: handleSuccess });
    const deleteBudget = trpc.budget.delete.useMutation({ onSuccess: handleSuccess });
    const createCategory = trpc.category.create.useMutation();
    const isPending = create.isPending || update.isPending || createCategory.isPending || deleteBudget.isPending;

    const handleSave = async () => {
        if (!amount) return;
        const parsedAmount = parseFloat(amount);

        let finalCategoryId = categoryId;
        if (isCustom && customCategoryName.trim()) {
            try {
                const newCat = await createCategory.mutateAsync({
                    name: customCategoryName.trim(),
                    icon: "circle",
                    color: "#8E8E93"
                });
                finalCategoryId = newCat.id;
                utils.category.listAll.invalidate();
            } catch (err) {
                console.error("Failed to create custom category", err);
            }
        }

        if (existingBudget) {
            update.mutate({ id: existingBudget.id, amount: parsedAmount, categoryId: finalCategoryId, period: "MONTHLY" });
        } else {
            create.mutate({ amount: parsedAmount, categoryId: finalCategoryId, period: "MONTHLY" });
        }
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 outline-none">
                    <Drawer.Title className="sr-only">Add Budget</Drawer.Title>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-t-[28px]">
                        <div className="flex justify-center pt-3 pb-0"><div className="w-10 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C]" /></div>
                        <div className="flex items-center justify-between px-6 py-4">
                            <button onClick={() => onOpenChange(false)} className="ios-text-secondary text-[17px]">Cancel</button>
                            <h2 className="text-[17px] font-semibold ios-text-primary">{existingBudget ? "Edit Budget" : "Add Budget"}</h2>
                            <button
                                onClick={handleSave}
                                disabled={!amount || isPending}
                                className={cn("text-[17px] font-semibold", !amount ? "text-ios-blue/40" : "text-ios-blue dark:text-ios-blue-dark")}
                            >
                                {isPending ? <Loader2 size={18} className="animate-spin" /> : "Save"}
                            </button>
                        </div>
                        <div className="px-6 pb-10 space-y-4">
                            <div className="ios-card p-5 text-center">
                                <div className="text-xs ios-text-secondary mb-1 uppercase tracking-wider">Monthly Budget</div>
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-4xl font-light ios-text-secondary">₹</span>
                                    <input type="number" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                                        className="text-5xl font-semibold ios-text-primary bg-transparent outline-none text-center w-52 placeholder-[#E5E5EA] dark:placeholder-[#3A3A3C]" />
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-semibold ios-text-secondary mb-2 uppercase tracking-wider">Category (optional)</div>
                                <div className="flex flex-wrap gap-2">
                                    {categories?.map((cat: { id: string; name: string; icon: string; color: string }) => {
                                        const Icon = getLucideIcon(cat.icon);
                                        const sel = categoryId === cat.id && !isCustom;
                                        return (
                                            <button key={cat.id} onClick={() => { setCategoryId(sel ? undefined : cat.id); setIsCustom(false); }}
                                                className={cn("flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all",
                                                    sel ? "text-white border-transparent" : "ios-text-primary border-[#E5E5EA] dark:border-[#3A3A3C]")}
                                                style={sel ? { backgroundColor: cat.color } : {}}>
                                                <Icon size={14} style={{ color: sel ? "white" : cat.color }} />{cat.name}
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCustom(!isCustom);
                                            setCategoryId(undefined);
                                        }}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all border",
                                            isCustom
                                                ? "bg-ios-blue text-white border-transparent"
                                                : "ios-text-primary border-[#E5E5EA] dark:border-[#3A3A3C] bg-transparent"
                                        )}
                                    >
                                        <MoreHorizontal size={14} />
                                        Custom
                                    </button>
                                </div>
                                {isCustom && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mt-3"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Enter custom category name"
                                            value={customCategoryName}
                                            onChange={(e) => setCustomCategoryName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-ios-sm bg-ios-surface-light dark:bg-ios-surface-dark border border-[#E5E5EA] dark:border-[#3A3A3C] outline-none ios-text-primary placeholder-[#C7C7CC] dark:placeholder-[#636366]"
                                        />
                                    </motion.div>
                                )}
                            </div>

                            {/* Delete Button (Editing only) */}
                            {existingBudget && (
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={deleteBudget.isPending}
                                    className="w-full py-3.5 mt-4 rounded-ios-sm bg-ios-red/10 text-ios-red font-semibold flex items-center justify-center gap-2"
                                >
                                    {deleteBudget.isPending ? <Loader2 size={18} className="animate-spin" /> : "Delete Budget"}
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Centered Popup for Deletion Confirmation */}
                    {showDeleteConfirm && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white dark:bg-[#1C1C1E] rounded-xl p-5 shadow-xl w-full max-w-sm space-y-4"
                            >
                                <h3 className="text-[17px] font-semibold text-center mt-1 ios-text-primary">Delete Budget?</h3>
                                <p className="text-[15px] text-ios-secondary text-center">Are you sure you want to delete this budget? This action cannot be undone.</p>
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-3 rounded-lg bg-[#E5E5EA] dark:bg-[#2C2C2E] text-ios-text-primary text-[15px] font-semibold active:opacity-70 transition-opacity"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteBudget.mutate({ id: existingBudget!.id })}
                                        disabled={deleteBudget.isPending}
                                        className="flex-1 py-3 rounded-lg bg-ios-red text-white text-[15px] font-semibold flex justify-center items-center gap-2 active:opacity-80 transition-opacity"
                                    >
                                        {deleteBudget.isPending ? <Loader2 size={18} className="animate-spin" /> : "Delete"}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root >
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
            <div className="px-4 pt-3 pb-6 space-y-4">
                {totalBudget > 0 && (
                    <div className="ios-card p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs ios-text-secondary">Total Budget</p>
                            <PrivacyWrapper><p className="text-2xl font-bold ios-text-primary">{formatCurrency(totalBudget)}</p></PrivacyWrapper>
                        </div>
                        <div className="text-right">
                            <p className="text-xs ios-text-secondary">Spent</p>
                            <PrivacyWrapper>
                                <p className="text-2xl font-bold" style={{ color: getBudgetColor(getBudgetStatus(totalSpent, totalBudget)) }}>
                                    {formatCurrency(totalSpent)}
                                </p>
                            </PrivacyWrapper>
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

            <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => { setEditingBudget(null); setSheetOpen(true); }}
                className="fixed bottom-[calc(83px+env(safe-area-inset-bottom,0px)+16px)] right-5 w-14 h-14 rounded-full shadow-ios-lg flex items-center justify-center z-40"
                style={{ background: "linear-gradient(135deg, #34C759, #30D158)" }}
            >
                <Plus size={28} className="text-white" strokeWidth={2.5} />
            </motion.button>

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
