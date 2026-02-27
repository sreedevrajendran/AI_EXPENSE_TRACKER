"use client";

import { useState, useRef } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/trpc/client";
const PaymentMethod = {
    CASH: "CASH",
    CREDIT_CARD: "CREDIT_CARD",
    DEBIT_CARD: "DEBIT_CARD",
    UPI: "UPI",
    NET_BANKING: "NET_BANKING",
    BANK_TRANSFER: "BANK_TRANSFER",
    OTHER: "OTHER"
} as const;
type PaymentMethod = keyof typeof PaymentMethod;
import { X, Camera, Loader2, ChevronDown, CreditCard, Banknote, Smartphone, Building2, MoreHorizontal, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLucideIcon } from "@/lib/icons";
import { useEffect } from "react";

export interface ExpenseEditData {
    id: string;
    amount: number;
    merchant: string;
    note?: string | null;
    categoryId?: string | null;
    paymentMethod: PaymentMethod;
    receiptUrl?: string | null;
}

interface AddExpenseSheetProps {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSuccess?: () => void;
    editData?: ExpenseEditData;
    editId?: string | null;
    prefillData?: any;
    initialFile?: File | null;
}
const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { value: "CASH", label: "Cash", icon: Banknote },
    { value: "CREDIT_CARD", label: "Card", icon: CreditCard },
    { value: "UPI", label: "UPI", icon: Smartphone },
    { value: "BANK_TRANSFER", label: "Bank", icon: Building2 },
    { value: "OTHER", label: "Other", icon: MoreHorizontal },
];

export function AddExpenseSheet({ open, onOpenChange, onSuccess, editData, editId, prefillData, initialFile }: AddExpenseSheetProps) {
    const [amount, setAmount] = useState("");
    const [merchant, setMerchant] = useState("");
    const [note, setNote] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
    const [isCustom, setIsCustom] = useState(false);
    const [customCategoryName, setCustomCategoryName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const hasSeededRef = useRef(false);

    const { data: allExpenses } = trpc.expense.list.useQuery(
        { limit: 100 },
        { enabled: open && !!editId }
    );

    // Populate edit data
    useEffect(() => {
        if (open && editId && allExpenses) {
            const expense = allExpenses.find((e: any) => e.id === editId);
            if (expense) {
                setAmount(expense.amount.toString());
                setMerchant(expense.merchant);
                setNote(expense.note || "");
                setSelectedCategory(expense.categoryId || undefined);
                setPaymentMethod(expense.paymentMethod);
                setExistingReceiptUrl(expense.receiptUrl || null);
            }
        } else if (open && editData) {
            setAmount(editData.amount.toString());
            setMerchant(editData.merchant);
            setNote(editData.note || "");
            setSelectedCategory(editData.categoryId || undefined);
            setPaymentMethod(editData.paymentMethod);
            setExistingReceiptUrl(editData.receiptUrl || null);
        } else if (open && !editData && !editId) {
            resetForm();
        }
    }, [open, editData, editId, allExpenses]);

    const utils = trpc.useUtils();
    const invalidateAll = () => {
        utils.expense.list.invalidate();
        utils.expense.getMonthTotal.invalidate();
        utils.expense.getRecentExpenses.invalidate();
        utils.budget.list.invalidate();
        utils.ai.getInsights.invalidate();
    };

    const { data: categories } = trpc.category.listAll.useQuery(undefined, { enabled: open });
    const { data: monthTotal } = trpc.expense.getMonthTotal.useQuery(undefined, { enabled: open });
    const { data: budgets } = trpc.budget.list.useQuery(undefined, { enabled: open });

    const createExpense = trpc.expense.create.useMutation({
        onSuccess: () => {
            invalidateAll();
            resetForm();
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => {
            console.error("Expense creation failed:", err);
            setError("Failed to add expense. Please try again.");
        }
    });

    const updateExpense = trpc.expense.update.useMutation({
        onSuccess: () => {
            invalidateAll();
            resetForm();
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => {
            setError("Failed to update expense. Please try again.");
        }
    });

    const deleteExpense = trpc.expense.delete.useMutation({
        onSuccess: () => {
            invalidateAll();
            resetForm();
            onOpenChange(false);
            onSuccess?.();
        },
    });
    const mapIcon = trpc.ai.suggestIcon.useMutation();
    const seedCategories = trpc.category.seedDefaults.useMutation({
        onSuccess: () => utils.category.listAll.invalidate(),
    });
    const createCategory = trpc.category.create.useMutation();

    // Auto-seed categories on first open
    useEffect(() => {
        if (open && categories?.length === 0 && !hasSeededRef.current && !seedCategories.isPending) {
            hasSeededRef.current = true;
            seedCategories.mutate();
        }
    }, [open, categories, seedCategories]);

    // Apply prefill data passed globally
    useEffect(() => {
        if (open && prefillData) {
            if (prefillData.amount) setAmount(String(prefillData.amount));
            if (prefillData.merchant) setMerchant(prefillData.merchant);
            if (prefillData.note) setNote(prefillData.note);
            if (prefillData.paymentMethod && ["CASH", "CARD", "UPI", "BANK_TRANSFER", "OTHER"].includes(prefillData.paymentMethod)) {
                setPaymentMethod(prefillData.paymentMethod as PaymentMethod);
            }
            if (prefillData.category && categories) {
                const match = categories.find((c: { id: string; name: string }) =>
                    c.name.toLowerCase().includes(prefillData.category.toLowerCase())
                );
                if (match) setSelectedCategory(match.id);
            }
        }
        if (open && initialFile) {
            setFile(initialFile);
        }
    }, [open, prefillData, initialFile, categories]);

    const resetForm = () => {
        setAmount(""); setMerchant(""); setNote("");
        setSelectedCategory(undefined); setPaymentMethod("UPI");
        setIsCustom(false); setCustomCategoryName("");
        setFile(null);
        setError(null);
        setShowDeleteConfirm(false);
    };

    // Budget Calculations
    const amt = parseFloat(amount) || 0;

    // 1. Overall Monthly Budget
    const overallBudget = budgets?.find(b => !b.categoryId);
    const overallRemaining = overallBudget ? Math.max((overallBudget.amount - overallBudget.spent), 0) : null;
    const isOverallExceeded = overallBudget ? amt > overallRemaining! : false;

    // 2. Category Specific Budget
    const categoryBudget = selectedCategory ? budgets?.find(b => b.categoryId === selectedCategory) : null;
    const categoryRemaining = categoryBudget ? Math.max((categoryBudget.amount - categoryBudget.spent), 0) : null;
    const isCategoryExceeded = categoryBudget ? amt > categoryRemaining! : false;

    const isOverBudget = isOverallExceeded || isCategoryExceeded;
    const activeBudgetRemaining = categoryBudget ? categoryRemaining : overallBudget ? overallRemaining : null;
    const budgetWarningType = isCategoryExceeded ? "Category" : "Monthly";

    const handleSubmit = async () => {
        const parsedAmt = parseFloat(amount);
        if (!parsedAmt || !merchant) return;

        let categoryId = selectedCategory;

        // If custom category is selected and name provided
        if (isCustom && customCategoryName.trim()) {
            try {
                // Auto-map icon and color based on name for custom category
                let customIcon = "circle";
                try {
                    const iconResult = await mapIcon.mutateAsync({ name: customCategoryName.trim() });
                    if (iconResult.icon) customIcon = iconResult.icon;
                } catch { /* fallback to circle */ }

                const newCat = await createCategory.mutateAsync({
                    name: customCategoryName.trim(),
                    icon: customIcon,
                    color: "#007AFF" // Better default than gray for new mapped categories
                });
                categoryId = newCat.id;
                utils.category.listAll.invalidate();
            } catch (err) {
                console.error("Failed to create custom category", err);
            }
        }

        // If no category selected and merchant provided, auto-map icon
        let mappedIcon: string | undefined = undefined;
        if (!categoryId && merchant && !isCustom) {
            try {
                const mapRes = await mapIcon.mutateAsync({ name: merchant });
                mappedIcon = mapRes.icon;
            } catch { /* ignore */ }
        }

        setUploading(true);
        setError(null);
        let receiptUrl: string | undefined = undefined;

        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Upload failed");
                receiptUrl = data.url;
            } catch (err: any) {
                setError("Failed to upload file. Please try again.");
                setUploading(false);
                return;
            }
        }

        if (editData) {
            updateExpense.mutate({
                id: editData.id,
                amount: parsedAmt,
                merchant,
                note: note || undefined,
                paymentMethod,
                categoryId,
                date: new Date(), // We keep current date or could allow editing date later
                receiptUrl: receiptUrl || existingReceiptUrl || undefined,
                icon: categoryId ? undefined : mappedIcon,
            });
        } else {
            createExpense.mutate({
                amount: parsedAmt,
                merchant,
                note: note || undefined,
                paymentMethod,
                categoryId,
                categoryName: !categoryId && !isCustom && prefillData?.category ? prefillData.category : undefined,
                date: new Date(),
                receiptUrl,
                icon: categoryId ? undefined : mappedIcon,
            });
        }
        setUploading(false);
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[96dvh] outline-none bg-white dark:bg-black rounded-t-[32px] flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                    <Drawer.Title className="sr-only">Add Expense</Drawer.Title>

                    {/* Top Section with Dynamic Gradient */}
                    <div className="relative overflow-hidden bg-gradient-to-b from-rose-500/15 to-transparent dark:from-rose-500/10">
                        {/* Glow effects */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-rose-500/20 rounded-[100%] blur-[60px] pointer-events-none" />

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
                                {editData ? "Edit Expense" : "New Expense"}
                            </h2>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!amount || !merchant || createExpense.isPending || updateExpense.isPending || uploading}
                                className={cn("text-[17px] font-bold transition-opacity flex items-center gap-1",
                                    !amount || !merchant ? "text-ios-text-primary/30" : "text-rose-500 dark:text-rose-400 active:opacity-70"
                                )}
                            >
                                {createExpense.isPending || updateExpense.isPending || uploading ? <Loader2 size={18} className="animate-spin" /> : editData ? "Save" : "Add"}
                            </button>
                        </div>

                        {/* Amount input */}
                        <div className="relative z-10 px-6 pt-6 pb-10 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <span className={cn("text-5xl font-medium transition-colors duration-300", amount ? "text-rose-500 dark:text-rose-400" : "ios-text-secondary opacity-40")}>₹</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    onBlur={() => window.scrollTo(0, 0)}
                                    className={cn(
                                        "text-[80px] leading-none font-bold bg-transparent outline-none text-center w-64 transition-colors duration-300 tracking-tighter placeholder:font-medium",
                                        amount ? "text-rose-500 dark:text-rose-400" : "placeholder-[#C7C7CC] dark:placeholder-[#636366]"
                                    )}
                                />
                            </div>
                            {activeBudgetRemaining !== null && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "text-[12px] font-bold mt-6 px-4 py-2 rounded-full inline-block tracking-wider uppercase backdrop-blur-md border shadow-sm",
                                        isOverBudget ? "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20" : "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20"
                                    )}
                                >
                                    {isOverBudget ? `EXCEEDS ${budgetWarningType.toUpperCase()} LIMIT` : `₹${activeBudgetRemaining.toFixed(0)} REMAINING (${budgetWarningType.toUpperCase()})`}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 pb-safe px-6 pt-4 space-y-8 no-scrollbar">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-ios-red/10 border border-ios-red/20 rounded-2xl text-ios-red text-[15px] font-semibold text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Immersive Inputs (Merchant & Note) */}
                        <div className="space-y-3">
                            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden focus-within:ring-2 focus-within:ring-rose-500/20 transition-all shadow-sm">
                                <input
                                    type="text"
                                    placeholder="Merchant / Store name"
                                    value={merchant}
                                    onChange={(e) => setMerchant(e.target.value)}
                                    onBlur={() => window.scrollTo(0, 0)}
                                    className="w-full px-5 py-4 text-[17px] font-semibold ios-text-primary bg-transparent outline-none placeholder-[#8E8E93] dark:placeholder-[#636366]"
                                />
                            </div>
                            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden focus-within:ring-2 focus-within:ring-rose-500/20 transition-all shadow-sm">
                                <input
                                    type="text"
                                    placeholder="Note (optional)"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    onBlur={() => window.scrollTo(0, 0)}
                                    className="w-full px-5 py-4 text-[17px] font-semibold ios-text-primary bg-transparent outline-none placeholder-[#8E8E93] dark:placeholder-[#636366]"
                                />
                            </div>
                        </div>

                        {/* Animated Categories */}
                        <div>
                            <div className="text-[14px] font-bold ios-text-secondary mb-3 uppercase tracking-wider pl-1">Category</div>
                            <div className="flex overflow-x-auto pb-6 -mx-6 px-6 gap-3 no-scrollbar items-center">
                                {categories?.map((cat: { id: string; name: string; icon: string; color: string }) => {
                                    const Icon = getLucideIcon(cat.icon);
                                    const isSelected = selectedCategory === cat.id && !isCustom;
                                    return (
                                        <motion.button
                                            key={cat.id}
                                            layout
                                            initial={false}
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setSelectedCategory(isSelected ? undefined : cat.id);
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
                                        setSelectedCategory(undefined);
                                    }}
                                    animate={{
                                        backgroundColor: isCustom ? "#007AFF" : "transparent",
                                        color: isCustom ? "#ffffff" : "var(--ios-text-primary)",
                                        borderColor: isCustom ? "#007AFF" : "var(--ios-border)"
                                    }}
                                    className={cn(
                                        "flex-shrink-0 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl border transition-shadow",
                                        isCustom ? "shadow-xl shadow-blue-500/40" : "border-[#E5E5EA] dark:border-[#3A3A3C] bg-white dark:bg-[#1C1C1E]"
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
                                        <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-sm">
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

                        {/* Bouncy Payment method */}
                        <div>
                            <div className="text-[14px] font-bold ios-text-secondary mb-3 uppercase tracking-wider pl-1">Payment Method</div>
                            <div className="grid grid-cols-5 gap-3 pb-4">
                                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => {
                                    const isSelected = paymentMethod === value;
                                    return (
                                        <motion.button
                                            key={value}
                                            type="button"
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => setPaymentMethod(value)}
                                            animate={{
                                                backgroundColor: isSelected ? "#007AFF" : "transparent",
                                                color: isSelected ? "#ffffff" : "var(--ios-text-secondary)",
                                                borderColor: isSelected ? "#007AFF" : "var(--ios-border)"
                                            }}
                                            className={cn(
                                                "w-full flex flex-col items-center justify-center gap-2.5 py-4 rounded-[20px] border transition-all",
                                                isSelected ? "shadow-xl shadow-blue-500/40" : "border-[#E5E5EA] dark:border-[#3A3A3C] bg-white dark:bg-[#1C1C1E]"
                                            )}
                                        >
                                            <Icon size={24} className={cn("transition-colors", isSelected ? "text-white" : "text-ios-secondary")} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Delete Button (Editing only) */}
                        {editData && (
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={deleteExpense.isPending}
                                className="w-full py-4 mb-4 rounded-2xl bg-[#FF3B30]/10 text-[#FF3B30] font-bold text-[17px] flex items-center justify-center gap-2"
                            >
                                {deleteExpense.isPending ? <Loader2 size={20} className="animate-spin" /> : "Delete Expense"}
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
                                <h3 className="text-[17px] font-semibold text-center mt-1 ios-text-primary">Delete Expense?</h3>
                                <p className="text-[15px] text-ios-secondary text-center">Are you sure you want to delete this expense? This action cannot be undone.</p>
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
                                        onClick={() => deleteExpense.mutate({ id: editData!.id })}
                                        disabled={deleteExpense.isPending}
                                        className="flex-1 py-3 rounded-lg bg-ios-red text-white text-[15px] font-semibold flex justify-center items-center gap-2 active:opacity-80 transition-opacity"
                                    >
                                        {deleteExpense.isPending ? <Loader2 size={18} className="animate-spin" /> : "Delete"}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
