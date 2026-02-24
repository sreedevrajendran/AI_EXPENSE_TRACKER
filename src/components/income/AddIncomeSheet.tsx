"use client";

import { useState, useRef } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/trpc/client";
import { X, Loader2, Paperclip, Camera, AlertTriangle, Sparkles, Briefcase, Laptop, TrendingUp, Building, Gift, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const PRESET_SOURCES = [
    { name: "Salary", icon: Briefcase, color: "#007AFF" },
    { name: "Freelance", icon: Laptop, color: "#5856D6" },
    { name: "Investment", icon: TrendingUp, color: "#34C759" },
    { name: "Business", icon: Building, color: "#FF9F0A" },
    { name: "Gifts", icon: Gift, color: "#FF2D55" },
    { name: "Refund", icon: RefreshCw, color: "#5AC8FA" },
];

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
    prefillData?: any;
    initialFile?: File | null;
}

export function AddIncomeSheet({ open, onOpenChange, onSuccess, editData, editId, prefillData, initialFile }: AddIncomeSheetProps) {
    const [amount, setAmount] = useState("");
    const [source, setSource] = useState("");
    const [note, setNote] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

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

    // Apply prefill data passed globally
    useEffect(() => {
        if (open && prefillData) {
            if (prefillData.amount) setAmount(String(prefillData.amount));
            if (prefillData.source) setSource(prefillData.source);
            if (prefillData.note) setNote(prefillData.note);

            const VALID_PRESETS = ["Salary", "Freelance", "Investment", "Business", "Gifts", "Refund"];
            if (prefillData.sourceType && VALID_PRESETS.includes(prefillData.sourceType)) {
                setSelectedPreset(prefillData.sourceType);
            }
        }
        if (open && initialFile) {
            setFile(initialFile);
        }
    }, [open, prefillData, initialFile]);

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
        setSelectedPreset(null);
        setShowDeleteConfirm(false);
    };

    // ── AI Income Doc Scan ────────────────────────────────────────
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
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[96dvh] outline-none bg-white dark:bg-black rounded-t-[32px] flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                    <Drawer.Title className="sr-only">Add Income</Drawer.Title>

                    {/* Top Section with Dynamic Gradient */}
                    <div className="relative overflow-hidden bg-gradient-to-b from-emerald-500/15 to-transparent dark:from-emerald-500/10">
                        {/* Glow effects */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-emerald-500/20 rounded-[100%] blur-[60px] pointer-events-none" />

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
                                {editData ? "Edit Income" : "New Income"}
                            </h2>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!amount || !source || createIncome.isPending || updateIncome.isPending || uploading}
                                className={cn("text-[17px] font-bold transition-opacity flex items-center gap-1",
                                    !amount || !source ? "text-ios-text-primary/30" : "text-emerald-500 dark:text-emerald-400 active:opacity-70"
                                )}
                            >
                                {createIncome.isPending || updateIncome.isPending || uploading ? <Loader2 size={18} className="animate-spin" /> : editData ? "Save" : "Add"}
                            </button>
                        </div>

                        {/* Amount input */}
                        <div className="relative z-10 px-6 pt-6 pb-10 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <span className={cn("text-5xl font-medium transition-colors duration-300", amount ? "text-emerald-500 dark:text-emerald-400" : "ios-text-secondary opacity-40")}>₹</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    onBlur={() => window.scrollTo(0, 0)}
                                    className={cn(
                                        "text-[80px] leading-none font-bold bg-transparent outline-none text-center w-64 transition-colors duration-300 tracking-tighter placeholder:font-medium",
                                        amount ? "text-emerald-500 dark:text-emerald-400" : "placeholder-[#C7C7CC] dark:placeholder-[#636366]"
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 pb-safe px-6 pt-4 space-y-8 no-scrollbar">
                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-4 bg-ios-red/10 border border-ios-red/20 rounded-2xl text-ios-red text-[15px] font-semibold text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Immersive Inputs (Source & Note) */}
                        <div className="space-y-3">
                            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-sm">
                                <input
                                    type="text"
                                    placeholder="Source (e.g. Salary, Freelance)"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    onBlur={() => window.scrollTo(0, 0)}
                                    className="w-full px-5 py-4 text-[17px] font-semibold ios-text-primary bg-transparent outline-none placeholder-[#8E8E93] dark:placeholder-[#636366]"
                                />
                            </div>
                            <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-sm">
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

                        {/* Animated Preset Sources */}
                        <div>
                            <div className="text-[14px] font-bold ios-text-secondary mb-3 uppercase tracking-wider pl-1">Quick Source</div>
                            <div className="flex overflow-x-auto pb-6 -mx-6 px-6 gap-3 no-scrollbar items-center">
                                {PRESET_SOURCES.map((preset) => {
                                    const Icon = preset.icon;
                                    const isSelected = selectedPreset === preset.name;
                                    return (
                                        <motion.button
                                            key={preset.name}
                                            layout
                                            initial={false}
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setSelectedPreset(preset.name);
                                                const presetNames = PRESET_SOURCES.map(p => p.name);
                                                if (!source || presetNames.includes(source)) {
                                                    setSource(preset.name);
                                                }
                                            }}
                                            animate={{
                                                backgroundColor: isSelected ? preset.color : "transparent",
                                                color: isSelected ? "#ffffff" : "var(--ios-text-primary)",
                                                borderColor: isSelected ? preset.color : "var(--ios-border)"
                                            }}
                                            className={cn(
                                                "flex-shrink-0 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl border transition-shadow",
                                                isSelected ? "shadow-xl" : "border-[#E5E5EA] dark:border-[#3A3A3C] bg-white dark:bg-[#1C1C1E]"
                                            )}
                                            style={isSelected ? { boxShadow: `0 10px 20px -5px ${preset.color}70` } : {}}
                                        >
                                            <Icon size={20} style={{ color: isSelected ? "#fff" : preset.color }} className="transition-colors" />
                                            <span className="font-semibold text-[16px]">{preset.name}</span>
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
                                disabled={deleteIncome.isPending}
                                className="w-full py-4 mb-4 rounded-2xl bg-[#FF3B30]/10 text-[#FF3B30] font-bold text-[17px] flex items-center justify-center gap-2"
                            >
                                {deleteIncome.isPending ? <Loader2 size={20} className="animate-spin" /> : "Delete Income"}
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
