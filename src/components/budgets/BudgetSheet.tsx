"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MoreHorizontal } from "lucide-react";
import { Drawer } from "vaul";
import { trpc } from "@/trpc/client";
import { getLucideIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

type BudgetCategory = { id: string; name: string; icon: string; color: string } | null;
export type BudgetWithSpent = { id: string; amount: number; spent: number; period: string; userId: string; categoryId: string | null; createdAt: Date; updatedAt: Date; category: BudgetCategory };

interface BudgetSheetProps {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    existingBudget?: BudgetWithSpent | null;
}

export function BudgetSheet({ open, onOpenChange, existingBudget }: BudgetSheetProps) {
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
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[96dvh] outline-none bg-white dark:bg-black rounded-t-[32px] flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                    <Drawer.Title className="sr-only">Add Budget</Drawer.Title>

                    {/* Top Section with Dynamic Gradient */}
                    <div className="relative overflow-hidden bg-gradient-to-b from-indigo-500/15 to-transparent dark:from-indigo-500/10">
                        {/* Glow effects */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-indigo-500/20 rounded-[100%] blur-[60px] pointer-events-none" />

                        {/* Handle */}
                        <div className="relative z-10 flex justify-center pt-3 pb-0 flex-shrink-0">
                            <div className="w-12 h-1.5 rounded-full bg-black/10 dark:bg-white/15" />
                        </div>

                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between px-6 py-4 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="text-[17px] font-medium ios-text-secondary active:opacity-70 transition-opacity"
                            >
                                Cancel
                            </button>
                            <h2 className="text-[14px] font-bold ios-text-primary tracking-widest uppercase opacity-80">
                                {existingBudget ? "Edit Budget" : "New Budget"}
                            </h2>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!amount || isPending}
                                className={cn("text-[17px] font-bold transition-opacity flex items-center gap-1",
                                    !amount ? "text-ios-text-primary/30" : "text-indigo-500 dark:text-indigo-400 active:opacity-70"
                                )}
                            >
                                {isPending ? <Loader2 size={18} className="animate-spin" /> : "Save"}
                            </button>
                        </div>

                        {/* Amount input */}
                        <div className="relative z-10 px-6 pt-6 pb-10 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <span className={cn("text-5xl font-medium transition-colors duration-300", amount ? "text-indigo-500 dark:text-indigo-400" : "ios-text-secondary opacity-40")}>₹</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    onBlur={() => window.scrollTo(0, 0)}
                                    className={cn(
                                        "text-[80px] leading-none font-bold bg-transparent outline-none text-center w-64 transition-colors duration-300 tracking-tighter placeholder:font-medium",
                                        amount ? "text-indigo-500 dark:text-indigo-400" : "placeholder-[#C7C7CC] dark:placeholder-[#636366]"
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 pb-safe px-6 pt-4 space-y-8 no-scrollbar">

                        {/* Animated Categories */}
                        <div>
                            <div className="text-[14px] font-bold ios-text-secondary mb-3 uppercase tracking-wider pl-1">Category (Optional)</div>
                            <div className="flex overflow-x-auto pb-6 -mx-6 px-6 gap-3 no-scrollbar items-center">
                                {categories?.map((cat: { id: string; name: string; icon: string; color: string }) => {
                                    const Icon = getLucideIcon(cat.icon);
                                    const isSelected = categoryId === cat.id && !isCustom;
                                    return (
                                        <motion.button
                                            key={cat.id}
                                            layout
                                            initial={false}
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setCategoryId(isSelected ? undefined : cat.id);
                                                setIsCustom(false);
                                            }}
                                            animate={{
                                                backgroundColor: isSelected ? cat.color : "transparent",
                                                color: isSelected ? "#ffffff" : "var(--ios-text-primary)",
                                                borderColor: isSelected ? cat.color : "var(--ios-border)"
                                            }}
                                            className={cn(
                                                "flex-shrink-0 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl border transition-shadow",
                                                isSelected ? "shadow-xl" : "border-[#E5E5EA] dark:border-[#3A3A3C] bg-white dark:bg-[#1C1C1E]"
                                            )}
                                            style={isSelected ? { boxShadow: `0 10px 20px -5px ${cat.color}70` } : {}}
                                        >
                                            <Icon size={20} style={{ color: isSelected ? "#fff" : cat.color }} className="transition-colors" />
                                            <span className="font-semibold text-[16px]">{cat.name}</span>
                                        </motion.button>
                                    );
                                })}
                                <motion.button
                                    layout
                                    initial={false}
                                    type="button"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setIsCustom(!isCustom);
                                        setCategoryId(undefined);
                                    }}
                                    animate={{
                                        backgroundColor: isCustom ? "#5856D6" : "transparent",
                                        color: isCustom ? "#ffffff" : "var(--ios-text-primary)",
                                        borderColor: isCustom ? "#5856D6" : "var(--ios-border)"
                                    }}
                                    className={cn(
                                        "flex-shrink-0 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl border transition-shadow",
                                        isCustom ? "shadow-xl shadow-indigo-500/40" : "border-[#E5E5EA] dark:border-[#3A3A3C] bg-white dark:bg-[#1C1C1E]"
                                    )}
                                >
                                    <MoreHorizontal size={20} />
                                    <span className="font-semibold text-[16px]">Custom</span>
                                </motion.button>
                            </div>

                            <AnimatePresence>
                                {isCustom && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                        className="mb-8"
                                    >
                                        <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm">
                                            <input
                                                type="text"
                                                placeholder="Enter custom category name"
                                                value={customCategoryName}
                                                onChange={(e) => setCustomCategoryName(e.target.value)}
                                                onBlur={() => window.scrollTo(0, 0)}
                                                className="w-full px-5 py-4 text-[17px] font-semibold ios-text-primary bg-transparent outline-none placeholder-[#8E8E93] dark:placeholder-[#636366]"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Delete Button (Editing only) */}
                        {existingBudget && (
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={deleteBudget.isPending}
                                className="w-full py-4 mb-4 rounded-2xl bg-[#FF3B30]/10 text-[#FF3B30] font-bold text-[17px] flex items-center justify-center gap-2"
                            >
                                {deleteBudget.isPending ? <Loader2 size={20} className="animate-spin" /> : "Delete Budget"}
                            </motion.button>
                        )}
                        <div className="h-6" /> {/* Extra padding at bottom for safe area */}
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
