"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { motion } from "framer-motion";
import { trpc } from "@/trpc/client";
import { X, Loader2, Paperclip, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { useEffect } from "react";

export interface IncomeEditData {
    id: string;
    amount: number;
    source: string;
    note?: string | null;
    receiptUrl?: string | null;
}

interface AddIncomeSheetProps {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSuccess?: () => void;
    editData?: IncomeEditData;
    editId?: string | null;
}

export function AddIncomeSheet({ open, onOpenChange, onSuccess, editData, editId }: AddIncomeSheetProps) {
    const [amount, setAmount] = useState("");
    const [source, setSource] = useState("");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const utils = trpc.useUtils();

    const { data: allIncomes } = trpc.income.list.useQuery(
        { limit: 100 },
        { enabled: open && !!editId }
    );

    // Populate edit data
    useEffect(() => {
        if (open && editId && allIncomes) {
            const income = allIncomes.find((i: any) => i.id === editId);
            if (income) {
                setAmount(income.amount.toString());
                setSource(income.source);
                setNote(income.note || "");
                setExistingReceiptUrl(income.receiptUrl || null);
            }
        } else if (open && editData) {
            setAmount(editData.amount.toString());
            setSource(editData.source);
            setNote(editData.note || "");
            setExistingReceiptUrl(editData.receiptUrl || null);
        } else if (open && !editData && !editId) {
            resetForm();
        }
    }, [open, editData, editId, allIncomes]);

    const invalidateAll = () => {
        utils.income.list.invalidate();
        utils.income.getMonthTotal.invalidate();
        utils.income.getRecentIncomes.invalidate();
        utils.expense.getYearlyIncomeExpenseChart.invalidate();
        utils.ai.getInsights.invalidate();
    };

    const createIncome = trpc.income.create.useMutation({
        onSuccess: () => {
            invalidateAll();
            resetForm();
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => {
            setError(err.message || "Failed to add income. Please try again.");
        }
    });

    const updateIncome = trpc.income.update.useMutation({
        onSuccess: () => {
            invalidateAll();
            resetForm();
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => {
            setError(err.message || "Failed to update income.");
        }
    });

    const deleteIncome = trpc.income.delete.useMutation({
        onSuccess: () => {
            invalidateAll();
            resetForm();
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err) => {
            setError(err.message || "Failed to delete income.");
        }
    });

    const mapIcon = trpc.ai.mapIcon.useMutation();

    const resetForm = () => {
        setAmount("");
        setSource("");
        setNote("");
        setFile(null);
        setError(null);
        setShowDeleteConfirm(false);
    };

    const handleSubmit = async () => {
        const parsedAmt = parseFloat(amount);
        if (!parsedAmt || !source) return;

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

        let mappedIcon: string | undefined = undefined;
        try {
            const mapRes = await mapIcon.mutateAsync({ query: source.trim() });
            mappedIcon = mapRes.icon;
        } catch { /* ignore */ }

        if (editData) {
            updateIncome.mutate({
                id: editData.id,
                amount: parsedAmt,
                source: source.trim(),
                note: note.trim() || undefined,
                date: new Date(),
                receiptUrl: receiptUrl || existingReceiptUrl || undefined,
                icon: mappedIcon,
            });
        } else {
            createIncome.mutate({
                amount: parsedAmt,
                source: source.trim(),
                note: note.trim() || undefined,
                date: new Date(),
                receiptUrl,
                icon: mappedIcon,
            });
        }
        setUploading(false);
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[95dvh] outline-none bg-white dark:bg-[#1C1C1E] rounded-t-[28px] flex flex-col overflow-hidden">
                    <Drawer.Title className="sr-only">Add Income</Drawer.Title>

                    {/* Handle */}
                    <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
                        <div className="w-10 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C]" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="ios-text-secondary text-[17px]"
                        >
                            Cancel
                        </button>
                        <h2 className="text-[17px] font-semibold ios-text-primary">
                            {editData ? "Edit Income" : "Add Income"}
                        </h2>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!amount || !source || createIncome.isPending || updateIncome.isPending || uploading}
                            className={cn("text-[17px] font-semibold transition-opacity flex items-center gap-1",
                                !amount || !source ? "text-[#FF9500]/40" : "text-[#FF9500]"
                            )}
                        >
                            {createIncome.isPending || updateIncome.isPending || uploading ? <Loader2 size={18} className="animate-spin" /> : editData ? "Update" : "Add"}
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
                                    onBlur={() => window.scrollTo(0, 0)}
                                    className={cn(
                                        "text-5xl font-semibold bg-transparent outline-none text-center w-52 placeholder-[#E5E5EA] dark:placeholder-[#3A3A3C] transition-colors text-[#FF9500]"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Source and Note */}
                        <div className="ios-card overflow-hidden">
                            <input
                                type="text"
                                placeholder="Source (e.g. Salary, Freelance)"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                onBlur={() => window.scrollTo(0, 0)}
                                className="w-full px-4 py-3.5 text-[17px] ios-text-primary bg-transparent outline-none placeholder-[#C7C7CC] dark:placeholder-[#636366]"
                            />
                            <div className="h-px bg-[#E5E5EA] dark:bg-[#3A3A3C] mx-4" />
                            <input
                                type="text"
                                placeholder="Note (optional)"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                onBlur={() => window.scrollTo(0, 0)}
                                className="w-full px-4 py-3.5 text-[17px] ios-text-primary bg-transparent outline-none placeholder-[#C7C7CC] dark:placeholder-[#636366]"
                            />
                        </div>

                        {/* Attachment Section */}
                        <div className="ios-card overflow-hidden">
                            <label className="flex items-center gap-3 px-4 py-3.5 w-full cursor-pointer active:bg-black/5 dark:active:bg-white/5 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0">
                                    <Paperclip size={18} className="text-[#FF9500]" />
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
                                    accept=".jpg,.jpeg,.png,.webp,.pdf"
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

                        {/* Delete Button (Editing only) */}
                        {editData && (
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={deleteIncome.isPending}
                                className="w-full py-3.5 mt-4 rounded-ios-sm bg-ios-red/10 text-ios-red font-semibold flex items-center justify-center gap-2"
                            >
                                {deleteIncome.isPending ? <Loader2 size={18} className="animate-spin" /> : "Delete Income"}
                            </motion.button>
                        )}
                    </div>

                    {/* Centered Popup for Deletion Confirmation */}
                    {showDeleteConfirm && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white dark:bg-[#1C1C1E] rounded-xl p-5 shadow-xl w-full max-w-sm space-y-4"
                            >
                                <h3 className="text-[17px] font-semibold text-center mt-1 ios-text-primary">Delete Income?</h3>
                                <p className="text-[15px] text-ios-secondary text-center">Are you sure you want to delete this income? This action cannot be undone.</p>
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
                                        onClick={() => deleteIncome.mutate({ id: editData!.id })}
                                        disabled={deleteIncome.isPending}
                                        className="flex-1 py-3 rounded-lg bg-ios-red text-white text-[15px] font-semibold flex justify-center items-center gap-2 active:opacity-80 transition-opacity"
                                    >
                                        {deleteIncome.isPending ? <Loader2 size={18} className="animate-spin" /> : "Delete"}
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
