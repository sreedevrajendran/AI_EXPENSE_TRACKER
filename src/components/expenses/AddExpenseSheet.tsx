"use client";

import { useState, useRef } from "react";
import { Drawer } from "vaul";
import { motion } from "framer-motion";
import { trpc } from "@/trpc/client";
import { PaymentMethod } from "@prisma/client";
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
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { value: "CASH", label: "Cash", icon: Banknote },
    { value: "CARD", label: "Card", icon: CreditCard },
    { value: "UPI", label: "UPI", icon: Smartphone },
    { value: "BANK_TRANSFER", label: "Bank", icon: Building2 },
    { value: "OTHER", label: "Other", icon: MoreHorizontal },
];


export function AddExpenseSheet({ open, onOpenChange, onSuccess, editData }: AddExpenseSheetProps) {
    const [amount, setAmount] = useState("");
    const [merchant, setMerchant] = useState("");
    const [note, setNote] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
    const [isScanning, setIsScanning] = useState(false);
    const [isCustom, setIsCustom] = useState(false);
    const [customCategoryName, setCustomCategoryName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const fileRef = useRef<HTMLInputElement>(null);
    const attachmentRef = useRef<HTMLInputElement>(null);
    const hasSeededRef = useRef(false);

    // Populate edit data
    useEffect(() => {
        if (open && editData) {
            setAmount(editData.amount.toString());
            setMerchant(editData.merchant);
            setNote(editData.note || "");
            setSelectedCategory(editData.categoryId || undefined);
            setPaymentMethod(editData.paymentMethod);
            setExistingReceiptUrl(editData.receiptUrl || null);
        } else if (open && !editData) {
            resetForm();
        }
    }, [open, editData]);

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
            setError(err.message || "Failed to add expense. Please try again.");
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
            setError(err.message || "Failed to update expense.");
        }
    });

    const deleteExpense = trpc.expense.delete.useMutation({
        onSuccess: () => {
            invalidateAll();
            resetForm();
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => {
            setError(err.message || "Failed to delete expense.");
        }
    });
    const scanReceipt = trpc.ai.scanReceipt.useMutation();
    const mapIcon = trpc.ai.mapIcon.useMutation();
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

    const resetForm = () => {
        setAmount(""); setMerchant(""); setNote("");
        setSelectedCategory(undefined); setPaymentMethod("UPI");
        setIsCustom(false); setCustomCategoryName("");
        setFile(null);
        setError(null);
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

    const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        setFile(selectedFile); // Set as attachment too
        setIsScanning(true);
        try {
            // Compress image to prevent Vercel/Netlify 4.5MB payload limit errors
            const imageBitmap = await window.createImageBitmap(selectedFile);
            const canvas = document.createElement('canvas');
            let { width, height } = imageBitmap;
            const MAX_DIMENSION = 1200;

            if (width > height && width > MAX_DIMENSION) {
                height *= MAX_DIMENSION / width;
                width = MAX_DIMENSION;
            } else if (height > MAX_DIMENSION) {
                width *= MAX_DIMENSION / height;
                height = MAX_DIMENSION;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(imageBitmap, 0, 0, width, height);

            // Convert to highly optimized JPEG
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7).split(",")[1];

            const result = await scanReceipt.mutateAsync({
                imageBase64: compressedBase64,
                mimeType: "image/jpeg",
            });

            if (result.amount) setAmount(String(result.amount));
            if (result.merchant) setMerchant(result.merchant);
            if (result.note) setNote(result.note);
            // try to match category
            if (result.category && categories) {
                const match = categories.find((c: { id: string; name: string }) =>
                    c.name.toLowerCase().includes(result.category.toLowerCase())
                );
                if (match) setSelectedCategory(match.id);
            }
            setIsScanning(false);
        } catch (error) {
            console.error("Receipt scan failed:", error);
            setError("Failed to scan receipt. The image might be too blurry or obscure.");
            setIsScanning(false);
        }
    };

    const handleSubmit = async () => {
        const parsedAmt = parseFloat(amount);
        if (!parsedAmt || !merchant) return;

        let categoryId = selectedCategory;

        // If custom category is selected and name provided
        if (isCustom && customCategoryName.trim()) {
            try {
                const newCat = await createCategory.mutateAsync({
                    name: customCategoryName.trim(),
                    icon: "circle",
                    color: "#8E8E93"
                });
                categoryId = newCat.id;
                utils.category.listAll.invalidate();
            } catch (err) {
                console.error("Failed to create custom category", err);
            }
        }

        // If no category selected and merchant provided, auto-map icon
        if (!categoryId && merchant && !isCustom) {
            try {
                await mapIcon.mutateAsync({ query: merchant });
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
                setError(err.message || "Failed to upload file");
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
            });
        } else {
            createExpense.mutate({
                amount: parsedAmt,
                merchant,
                note: note || undefined,
                paymentMethod,
                categoryId,
                date: new Date(),
                receiptUrl,
            });
        }
        setUploading(false);
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[95dvh] outline-none">
                    <Drawer.Title className="sr-only">Add Expense</Drawer.Title>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-t-[28px] flex flex-col overflow-hidden">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-0">
                            <div className="w-10 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C]" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="ios-text-secondary text-[17px]"
                            >
                                Cancel
                            </button>
                            <h2 className="text-[17px] font-semibold ios-text-primary">
                                {editData ? "Edit Expense" : "Add Expense"}
                            </h2>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!amount || !merchant || createExpense.isPending || updateExpense.isPending || uploading}
                                className={cn("text-[17px] font-semibold transition-opacity flex items-center gap-1",
                                    !amount || !merchant ? "text-ios-blue/40" : "text-ios-blue dark:text-ios-blue-dark"
                                )}
                            >
                                {createExpense.isPending || updateExpense.isPending || uploading ? <Loader2 size={18} className="animate-spin" /> : editData ? "Update" : "Add"}
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 pb-8 px-6 space-y-4">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 bg-ios-red/10 border border-ios-red/20 rounded-ios-sm text-ios-red text-sm font-medium text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                            {/* Amount input */}
                            <div className="ios-card p-5 text-center relative overflow-hidden">
                                <div className="text-xs ios-text-secondary mb-1 uppercase tracking-wider">Amount</div>
                                <div className="flex items-center justify-center gap-1 relative z-10">
                                    <span className="text-4xl font-light ios-text-secondary">₹</span>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className={cn(
                                            "text-5xl font-semibold bg-transparent outline-none text-center w-52 placeholder-[#E5E5EA] dark:placeholder-[#3A3A3C] transition-colors ios-text-primary"
                                        )}
                                    />
                                </div>
                                {activeBudgetRemaining !== null && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={cn(
                                            "text-xs font-medium mt-3 px-3 py-1.5 rounded-full inline-block",
                                            isOverBudget ? "bg-[#FF3B30]/10 text-[#FF3B30] dark:bg-[#FF453A]/15 dark:text-[#FF453A]" : "bg-[#34C759]/10 text-[#34C759] dark:bg-[#32D74B]/15 dark:text-[#32D74B]"
                                        )}
                                    >
                                        {isOverBudget ? `Exceeds ${budgetWarningType.toLowerCase()} limit` : `₹${activeBudgetRemaining.toFixed(0)} remaining (${budgetWarningType.toLowerCase()})`}
                                    </motion.div>
                                )}
                            </div>

                            {/* Receipt scan */}
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={isScanning}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-ios-sm border-2 border-dashed border-ios-blue/30 dark:border-ios-blue-dark/30 text-ios-blue dark:text-ios-blue-dark text-[15px] font-medium"
                            >
                                {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                                {isScanning ? "Scanning receipt..." : "Scan Receipt with AI"}
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan} />

                            {/* Merchant */}
                            <div className="ios-card overflow-hidden">
                                <input
                                    type="text"
                                    placeholder="Merchant / Store name"
                                    value={merchant}
                                    onChange={(e) => setMerchant(e.target.value)}
                                    className="w-full px-4 py-3.5 text-[17px] ios-text-primary bg-transparent outline-none placeholder-[#C7C7CC] dark:placeholder-[#636366]"
                                />
                                <div className="h-px bg-[#E5E5EA] dark:bg-[#3A3A3C] mx-4" />
                                <input
                                    type="text"
                                    placeholder="Note (optional)"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full px-4 py-3.5 text-[17px] ios-text-primary bg-transparent outline-none placeholder-[#C7C7CC] dark:placeholder-[#636366]"
                                />
                            </div>

                            {/* Attachment Section */}
                            <div className="ios-card overflow-hidden">
                                <label className="flex items-center gap-3 px-4 py-3.5 w-full cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-ios-blue/10 flex items-center justify-center flex-shrink-0">
                                        <Paperclip size={18} className="text-ios-blue" />
                                    </div>
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className="text-[17px] ios-text-primary">
                                            {file ? "Change Attachment" : "Add Attachment"}
                                        </span>
                                        {file && (
                                            <span className="text-[15px] ios-text-secondary truncate max-w-[120px]">
                                                {file.name}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </label>
                                {file && (
                                    <div className="px-4 pb-3.5 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setFile(null)}
                                            className="text-[13px] text-ios-red font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Category */}
                            <div>
                                <div className="text-sm font-semibold ios-text-secondary mb-2 uppercase tracking-wider">Category</div>
                                <div className="flex flex-wrap gap-2">
                                    {categories?.map((cat: { id: string; name: string; icon: string; color: string }) => {
                                        const Icon = getLucideIcon(cat.icon);
                                        const isSelected = selectedCategory === cat.id && !isCustom;
                                        return (
                                            <motion.button
                                                key={cat.id}
                                                type="button"
                                                whileTap={{ scale: 0.93 }}
                                                onClick={() => {
                                                    setSelectedCategory(isSelected ? undefined : cat.id);
                                                    setIsCustom(false);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all border",
                                                    isSelected
                                                        ? "text-white border-transparent"
                                                        : "ios-text-primary border-[#E5E5EA] dark:border-[#3A3A3C] bg-transparent"
                                                )}
                                                style={isSelected ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                                            >
                                                <Icon size={14} style={{ color: isSelected ? "white" : cat.color }} />
                                                {cat.name}
                                            </motion.button>
                                        );
                                    })}
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.93 }}
                                        onClick={() => {
                                            setIsCustom(!isCustom);
                                            setSelectedCategory(undefined);
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
                                    </motion.button>
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

                            {/* Payment method */}
                            <div>
                                <div className="text-sm font-semibold ios-text-secondary mb-2 uppercase tracking-wider">Payment Method</div>
                                <div className="flex gap-2">
                                    {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                                        <motion.button
                                            key={value}
                                            type="button"
                                            whileTap={{ scale: 0.93 }}
                                            onClick={() => setPaymentMethod(value)}
                                            className={cn(
                                                "flex-1 flex flex-col items-center gap-1 py-3 rounded-ios-sm border transition-all text-xs font-medium",
                                                paymentMethod === value
                                                    ? "bg-ios-blue dark:bg-ios-blue-dark text-white border-transparent"
                                                    : "border-[#E5E5EA] dark:border-[#3A3A3C] ios-text-secondary"
                                            )}
                                        >
                                            <Icon size={18} />
                                            {label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Delete Button (Editing only) */}
                            {editData && (
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (confirm("Are you sure you want to delete this expense?")) {
                                            deleteExpense.mutate({ id: editData.id });
                                        }
                                    }}
                                    disabled={deleteExpense.isPending}
                                    className="w-full py-3.5 mt-4 rounded-ios-sm bg-ios-red/10 text-ios-red font-semibold flex items-center justify-center gap-2"
                                >
                                    {deleteExpense.isPending ? <Loader2 size={18} className="animate-spin" /> : "Delete Expense"}
                                </motion.button>
                            )}
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
