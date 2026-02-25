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
import { toast } from "react-hot-toast";

interface BillItem {
    name: string;
    quantity: number;
    price: number;
}

interface BillData {
    merchant: string;
    date: string | null;
    paymentMethod: string | null;
    category: string | null;
    items: BillItem[];
    total: number | null;
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

    const selectedTotal = billData?.items
        ?.filter((_, i) => selectedIndices.has(i))
        .reduce((sum, item) => sum + item.price, 0) ?? 0;

    const handleSave = async () => {
        if (!billData || selectedIndices.size === 0) {
            toast.error("Please select at least one item.");
            return;
        }

        setIsSaving(true);
        try {
            const selectedItems = billData.items.filter((_, i) => selectedIndices.has(i));
            const paymentMethod = (["CASH", "CARD", "UPI", "BANK_TRANSFER", "OTHER"].includes(billData.paymentMethod ?? ""))
                ? billData.paymentMethod as "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "OTHER"
                : "CASH";

            await createWithItems.mutateAsync({
                merchant: billData.merchant || "Unknown Store",
                date: billData.date ? new Date(billData.date) : new Date(),
                paymentMethod,
                categoryName: billData.category || undefined,
                items: selectedItems.map(item => ({
                    name: item.name,
                    quantity: item.quantity ?? 1,
                    price: item.price,
                })),
            });

            await utils.expense.list.invalidate();
            await utils.expense.getMonthTotal.invalidate();
            toast.success(`Saved ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} — ₹${selectedTotal.toFixed(2)}`);
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to save the bill.");
        } finally {
            setIsSaving(false);
        }
    };

    const items = billData?.items ?? [];
    const allSelected = selectedIndices.size === items.length && items.length > 0;

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
                    <div className="px-5 pt-3 pb-4 border-b border-[#E5E5EA] dark:border-[#3A3A3C]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm">
                                <Receipt size={20} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-[19px] font-bold ios-text-primary truncate">
                                    {billData?.merchant || "Bill Review"}
                                </h2>
                                <p className="text-[13px] ios-text-secondary">
                                    {billData?.date || "Unknown date"} · {billData?.paymentMethod || "CASH"} · {billData?.category || "Shopping"}
                                </p>
                            </div>
                        </div>

                        {/* Select All Row */}
                        <button
                            onClick={toggleAll}
                            className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] transition-colors active:opacity-70"
                        >
                            <span className="text-[14px] font-semibold ios-text-primary">
                                {allSelected ? "Deselect All" : "Select All"}
                            </span>
                            <span className="text-[13px] ios-text-secondary">
                                {selectedIndices.size}/{items.length} selected
                            </span>
                        </button>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto">
                        <AnimatePresence>
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <ShoppingCart size={40} className="text-[#C7C7CC]" />
                                    <p className="text-[15px] ios-text-secondary">No items found in this bill.</p>
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
                                                    : "bg-[#F2F2F7] dark:bg-[#2C2C2E] border-transparent opacity-50"
                                                    }`}
                                            >
                                                {selected
                                                    ? <CheckCircle2 size={20} className="text-orange-500 flex-shrink-0" />
                                                    : <Circle size={20} className="text-[#C7C7CC] flex-shrink-0" />
                                                }
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[15px] font-semibold ios-text-primary truncate">{item.name}</p>
                                                    <p className="text-[12px] ios-text-secondary">
                                                        Qty: {item.quantity ?? 1}
                                                        {item.quantity && item.quantity > 1
                                                            ? ` × ₹${(item.price / item.quantity).toFixed(2)}`
                                                            : ""}
                                                    </p>
                                                </div>
                                                <span className={`text-[16px] font-bold flex-shrink-0 ${selected ? "text-orange-500" : "ios-text-secondary"}`}>
                                                    ₹{item.price.toFixed(2)}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="px-5 pt-3 pb-8 border-t border-[#E5E5EA] dark:border-[#3A3A3C] bg-white dark:bg-[#1C1C1E]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[15px] font-semibold ios-text-secondary">
                                {selectedIndices.size} item{selectedIndices.size !== 1 ? "s" : ""} selected
                            </span>
                            <span className="text-[22px] font-bold text-orange-500">
                                ₹{selectedTotal.toFixed(2)}
                            </span>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSave}
                            disabled={isSaving || selectedIndices.size === 0}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[17px] font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                        >
                            {isSaving ? (
                                <><Loader2 size={18} className="animate-spin" /> Saving...</>
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
