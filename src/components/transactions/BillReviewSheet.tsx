"use client";

import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    ShoppingCart,
    Trash2,
    ChevronDown,
    ChevronUp,
    Receipt,
    Loader2,
} from "lucide-react";
import { trpc } from "@/trpc/client";
import { showMatchingAlert } from "@/components/ui/AlertCard";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface BillItem {
    name: string;
    quantity: number;
    price: number;
    unitPrice?: number | null;
}

export interface BillData {
    merchant: string;
    date: string | null;
    time?: string | null;
    paymentMethod: string | null;
    category: string | null;
    items: BillItem[];
    total: number | null;
    invoiceNumber?: string | null;
    referenceId?: string | null;
    upiId?: string | null;
    cardLast4?: string | null;
    bankName?: string | null;
    consumerNumber?: string | null;
    subtotal?: number | null;
    tax?: number | null;
    taxBreakup?: { cgst?: number | null; sgst?: number | null; igst?: number | null } | null;
    discount?: number | null;
    serviceCharge?: number | null;
    billStatus?: string | null;
    dueDate?: string | null;
    note?: string | null;
}

interface BillReviewSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    billData: BillData | null;
}

export function BillReviewSheet({ open, onOpenChange, billData }: BillReviewSheetProps) {
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Select all items whenever bill data changes
    useEffect(() => {
        if (billData?.items?.length) {
            setSelectedIndices(new Set(billData.items.map((_, i) => i)));
        }
    }, [billData]);

    const router = useRouter();
    const utils = trpc.useUtils();
    const createWithItems = trpc.expense.createWithItems.useMutation();

    const toggleSelection = (index: number) => {
        const next = new Set(selectedIndices);
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        setSelectedIndices(next);
    };

    const toggleAll = () => {
        if (selectedIndices.size === (billData?.items?.length ?? 0)) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(billData?.items?.map((_, i) => i) ?? []));
        }
    };

    const items = billData?.items ?? [];
    const allSelected = selectedIndices.size === items.length && items.length > 0;

    const selectedTotal = items
        .filter((_, i) => selectedIndices.has(i))
        .reduce((sum, item) => sum + item.price, 0);

    const handleSave = async () => {
        if (!billData || selectedIndices.size === 0) {
            showMatchingAlert({
                type: "expense",
                status: "error",
                title: "No Items Selected",
                message: "Please select at least one item from the bill.",
            });
            return;
        }

        setIsSaving(true);
        try {
            const selectedItems = items.filter((_, i) => selectedIndices.has(i));

            const validPM = ["CASH", "CREDIT_CARD", "DEBIT_CARD", "UPI", "NET_BANKING", "BANK_TRANSFER", "OTHER"] as const;
            let pm = (billData.paymentMethod || "UPI").toUpperCase().replace(/\s+/g, "_");
            if (pm === "CARD") pm = "CREDIT_CARD";
            const paymentMethod = (validPM as readonly string[]).includes(pm) ? (pm as any) : "UPI";

            // Compile structured payment metadata for permanent record
            const noteParts: string[] = [];
            if (billData.invoiceNumber) noteParts.push(`Invoice #${billData.invoiceNumber}`);
            if (billData.referenceId) noteParts.push(`Ref: ${billData.referenceId}`);
            if (billData.upiId) noteParts.push(`UPI: ${billData.upiId}`);
            if (billData.cardLast4) noteParts.push(`Card ending ${billData.cardLast4}`);
            if (billData.bankName) noteParts.push(`Bank: ${billData.bankName}`);
            if (billData.subtotal) noteParts.push(`Subtotal: ${formatCurrency(billData.subtotal)}`);
            if (billData.tax) noteParts.push(`Tax/GST: ${formatCurrency(billData.tax)}`);
            if (billData.discount) noteParts.push(`Discount: -${formatCurrency(billData.discount)}`);
            if (billData.dueDate) noteParts.push(`Due Date: ${billData.dueDate}`);
            if (billData.billStatus) noteParts.push(`Status: ${billData.billStatus}`);

            const compiledNote = noteParts.length > 0 ? noteParts.join(" • ") : (billData.note || undefined);

            const isAllSelected = selectedIndices.size === items.length;
            const finalTotal = isAllSelected && billData.total && billData.total > 0 ? billData.total : selectedTotal;

            await createWithItems.mutateAsync({
                merchant: billData.merchant || "Unknown Store",
                date: billData.date ? new Date(billData.date) : new Date(),
                paymentMethod,
                categoryName: billData.category || undefined,
                note: compiledNote,
                totalAmount: finalTotal,
                referenceId: billData.referenceId || undefined,
                invoiceNumber: billData.invoiceNumber || undefined,
                tax: billData.tax || undefined,
                subtotal: billData.subtotal || undefined,
                discount: billData.discount || undefined,
                billStatus: billData.billStatus || undefined,
                dueDate: billData.dueDate || undefined,
                upiId: billData.upiId || undefined,
                cardLast4: billData.cardLast4 || undefined,
                items: selectedItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity ?? 1,
                    price: item.price,
                })),
            });

            // Invalidate entire tRPC query cache across all endpoints
            await utils.invalidate();

            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("app:transactions-updated", {
                    detail: { count: selectedItems.length, amount: finalTotal }
                }));
            }

            try {
                router.refresh();
            } catch (e) {}

            showMatchingAlert({
                type: "expense",
                status: "success",
                title: "Bill Saved Successfully",
                message: `Recorded ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} from ${billData.merchant || "bill"}`,
                amount: finalTotal,
            });
            onOpenChange(false);
        } catch (err: any) {
            console.error("Save bill error:", err);
            showMatchingAlert({
                type: "expense",
                status: "error",
                title: "Failed to Save Bill",
                message: "Could not record bill items. Please try again.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const isDue = billData?.billStatus === "DUE" || billData?.billStatus === "UNPAID";

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-[#1C1C1E] rounded-t-[28px] flex flex-col outline-none max-h-[92vh]">
                    <Drawer.Title className="sr-only">Bill Review</Drawer.Title>

                    {/* Handle */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C]" />
                    </div>

                    {/* Header */}
                    <div className="px-5 pt-3 pb-3 border-b border-[#E5E5EA] dark:border-[#3A3A3C] space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Receipt size={20} className="text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[18px] font-bold text-neutral-900 dark:text-white truncate">
                                        {billData?.merchant || "Bill Review"}
                                    </h2>
                                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400 truncate">
                                        {billData?.date || "Today"} {billData?.time ? `• ${billData.time}` : ""} · {billData?.category || "Shopping"}
                                    </p>
                                </div>
                            </div>

                            {/* Status pill */}
                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0 ${
                                isDue
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            }`}>
                                {isDue ? (billData?.dueDate ? `Due ${billData.dueDate}` : "Due") : "Paid"}
                            </span>
                        </div>

                        {/* Payment reference chips */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                {billData?.paymentMethod || "UPI"}
                            </span>
                            {billData?.invoiceNumber && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    #{billData.invoiceNumber}
                                </span>
                            )}
                            {billData?.referenceId && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    Ref: {billData.referenceId}
                                </span>
                            )}
                            {billData?.cardLast4 && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                    •••• {billData.cardLast4}
                                </span>
                            )}
                            {billData?.upiId && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                    {billData.upiId}
                                </span>
                            )}
                        </div>

                        {/* Select All Row */}
                        <button
                            onClick={toggleAll}
                            className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 transition-colors active:opacity-70"
                        >
                            <span className="text-[13px] font-semibold text-neutral-900 dark:text-white">
                                {allSelected ? "Deselect All Items" : "Select All Items"}
                            </span>
                            <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
                                {selectedIndices.size}/{items.length} selected
                            </span>
                        </button>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto">
                        <AnimatePresence>
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <ShoppingCart size={40} className="text-neutral-300 dark:text-neutral-600" />
                                    <p className="text-[15px] text-neutral-500">No items found in this bill.</p>
                                </div>
                            ) : (
                                <div className="px-5 py-3 flex flex-col gap-2">
                                    {items.map((item, i) => {
                                        const selected = selectedIndices.has(i);
                                        return (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => toggleSelection(i)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${selected
                                                    ? "bg-orange-500/8 border-orange-400/25 dark:bg-orange-500/10"
                                                    : "bg-neutral-100 dark:bg-neutral-800/60 border-transparent opacity-50"
                                                    }`}
                                            >
                                                {selected
                                                    ? <CheckCircle2 size={20} className="text-orange-500 flex-shrink-0" />
                                                    : <Circle size={20} className="text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                                                }
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[14px] font-semibold text-neutral-900 dark:text-white truncate">{item.name}</p>
                                                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                                                        Qty: {item.quantity ?? 1}
                                                        {item.quantity && item.quantity > 1
                                                            ? ` × ${formatCurrency(item.price / item.quantity)}`
                                                            : ""}
                                                    </p>
                                                </div>
                                                <span className={`text-[15px] font-bold flex-shrink-0 ${selected ? "text-orange-500" : "text-neutral-500"}`}>
                                                    {formatCurrency(item.price)}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Breakdown & Footer */}
                    <div className="px-5 pt-3 pb-8 border-t border-[#E5E5EA] dark:border-[#3A3A3C] bg-white dark:bg-[#1C1C1E] space-y-3">
                        {/* Financial breakdown */}
                        {(billData?.subtotal || billData?.tax || billData?.discount) && (
                            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                                {billData.subtotal && billData.subtotal > 0 && (
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(billData.subtotal)}</span>
                                    </div>
                                )}
                                {billData.tax && billData.tax > 0 && (
                                    <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                                        <span>Tax / GST:</span>
                                        <span>+{formatCurrency(billData.tax)}</span>
                                    </div>
                                )}
                                {billData.discount && billData.discount > 0 && (
                                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(billData.discount)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-semibold text-neutral-500 dark:text-neutral-400">
                                {selectedIndices.size} item{selectedIndices.size !== 1 ? "s" : ""} selected
                            </span>
                            <span className="text-[22px] font-bold text-orange-500">
                                {formatCurrency(allSelected && billData?.total ? billData.total : selectedTotal)}
                            </span>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSave}
                            disabled={isSaving || selectedIndices.size === 0}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[16px] font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                        >
                            {isSaving ? (
                                <><Loader2 size={18} className="animate-spin" /> Saving Bill...</>
                            ) : (
                                <>
                                    <ShoppingCart size={18} />
                                    Save {selectedIndices.size} Item{selectedIndices.size !== 1 ? "s" : ""} as Expense
                                </>
                            )}
                        </motion.button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
