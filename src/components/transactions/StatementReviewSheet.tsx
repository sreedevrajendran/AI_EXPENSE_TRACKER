"use client";

import { useState, useEffect, useMemo } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    Circle,
    TrendingDown,
    ArrowUpRight,
    Loader2,
    Search,
    Filter,
    Sparkles,
    CheckCheck,
    X,
    FileSpreadsheet,
    ArrowDownLeft,
    Check,
    AlertTriangle
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { showMatchingAlert } from "@/components/ui/AlertCard";
import { useRouter } from "next/navigation";

interface StatementTransaction {
    date?: string;
    description?: string;
    title?: string;
    amount: number;
    type?: "EXPENSE" | "INCOME" | string;
    category?: string;
    paymentMethod?: string;
}

interface StatementReviewSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transactions: StatementTransaction[];
}

export function StatementReviewSheet({ open, onOpenChange, transactions }: StatementReviewSheetProps) {
    const [localTransactions, setLocalTransactions] = useState<StatementTransaction[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [filterType, setFilterType] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Duplicate detection states
    const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set());
    const [isEntireStatementDuplicate, setIsEntireStatementDuplicate] = useState(false);
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
    const [showDuplicateConfirmModal, setShowDuplicateConfirmModal] = useState(false);

    const checkDuplicatesMutation = trpc.expense.checkStatementDuplicates.useMutation();

    // Sync transactions and run duplicate detection when sheet opens
    useEffect(() => {
        if (open && transactions && transactions.length > 0) {
            setLocalTransactions(transactions);
            setIsCheckingDuplicates(true);
            setDuplicateIndices(new Set());
            setIsEntireStatementDuplicate(false);

            // Prepare payload for server duplicate check
            const payload = transactions.map((t) => ({
                amount: Math.abs(Number(t.amount) || 0),
                description: t.description,
                title: t.title,
                date: t.date,
                type: t.type,
            }));

            checkDuplicatesMutation.mutateAsync({ transactions: payload })
                .then((res) => {
                    const dupSet = new Set(res.duplicateIndices);
                    setDuplicateIndices(dupSet);
                    setIsEntireStatementDuplicate(res.isEntireStatementDuplicate);

                    // Auto-uncheck duplicate transactions by default so user doesn't double add
                    if (dupSet.size > 0) {
                        const newSelection = new Set<number>();
                        transactions.forEach((_, i) => {
                            if (!dupSet.has(i)) {
                                newSelection.add(i);
                            }
                        });
                        setSelectedIndices(newSelection);
                    } else {
                        setSelectedIndices(new Set(transactions.map((_, i) => i)));
                    }
                })
                .catch((err) => {
                    console.error("Duplicate statement check failed:", err);
                    setSelectedIndices(new Set(transactions.map((_, i) => i)));
                })
                .finally(() => {
                    setIsCheckingDuplicates(false);
                });
        } else if (!open) {
            setLocalTransactions([]);
            setSelectedIndices(new Set());
            setDuplicateIndices(new Set());
            setIsEntireStatementDuplicate(false);
            setShowDuplicateConfirmModal(false);
        }
        setFilterType("ALL");
        setSearchQuery("");
    }, [transactions, open]);

    const router = useRouter();
    const utils = trpc.useUtils();
    const bulkCreateExpenses = trpc.expense.bulkCreateWithCategories.useMutation();
    const bulkCreateIncomes = trpc.income.bulkCreate.useMutation();

    // Summary metrics
    const { totalExpenses, totalIncomes, expenseCount, incomeCount } = useMemo(() => {
        let expSum = 0;
        let incSum = 0;
        let expCount = 0;
        let incCount = 0;

        localTransactions.forEach((t, i) => {
            if (selectedIndices.has(i)) {
                const isInc = t.type?.toLowerCase() === "income";
                const amt = Number(t.amount) || 0;
                if (isInc) {
                    incSum += amt;
                    incCount++;
                } else {
                    expSum += amt;
                    expCount++;
                }
            }
        });

        return {
            totalExpenses: expSum,
            totalIncomes: incSum,
            expenseCount: expCount,
            incomeCount: incCount,
        };
    }, [localTransactions, selectedIndices]);

    // Filtered list
    const filteredItems = useMemo(() => {
        return localTransactions
            .map((t, originalIndex) => ({ ...t, originalIndex }))
            .filter((t) => {
                const isInc = t.type?.toLowerCase() === "income";
                if (filterType === "EXPENSE" && isInc) return false;
                if (filterType === "INCOME" && !isInc) return false;

                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const desc = (t.description || t.title || "").toLowerCase();
                    const cat = (t.category || "").toLowerCase();
                    const amtStr = String(t.amount);
                    return desc.includes(q) || cat.includes(q) || amtStr.includes(q);
                }

                return true;
            });
    }, [localTransactions, filterType, searchQuery]);

    const toggleSelection = (index: number) => {
        const next = new Set(selectedIndices);
        if (next.has(index)) {
            next.delete(index);
        } else {
            next.add(index);
        }
        setSelectedIndices(next);
    };

    const selectAllFiltered = () => {
        const next = new Set(selectedIndices);
        filteredItems.forEach((item) => next.add(item.originalIndex));
        setSelectedIndices(next);
    };

    const deselectAllFiltered = () => {
        const next = new Set(selectedIndices);
        filteredItems.forEach((item) => next.delete(item.originalIndex));
        setSelectedIndices(next);
    };

    const keepOnlyNew = () => {
        const next = new Set<number>();
        localTransactions.forEach((_, i) => {
            if (!duplicateIndices.has(i)) {
                next.add(i);
            }
        });
        setSelectedIndices(next);
    };

    const selectAllAnyway = () => {
        setSelectedIndices(new Set(localTransactions.map((_, i) => i)));
    };

    const countSelectedDuplicates = useMemo(() => {
        let count = 0;
        selectedIndices.forEach((idx) => {
            if (duplicateIndices.has(idx)) count++;
        });
        return count;
    }, [selectedIndices, duplicateIndices]);

    const toggleTransactionType = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setLocalTransactions((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;
                const currentType = item.type?.toLowerCase() === "income" ? "income" : "expense";
                const nextType = currentType === "income" ? "EXPENSE" : "INCOME";
                return {
                    ...item,
                    type: nextType,
                    category: nextType === "INCOME" ? "UPI Transfer" : "Food & Dining",
                };
            })
        );
    };

    const handleSave = async (forceDuplicateProceed = false) => {
        if (selectedIndices.size === 0) {
            showMatchingAlert({
                status: "error",
                title: "No Transactions Selected",
                message: "Please select at least one transaction to import.",
            });
            return;
        }

        // Prompt user confirmation if duplicates are selected
        if (!forceDuplicateProceed && countSelectedDuplicates > 0) {
            setShowDuplicateConfirmModal(true);
            return;
        }

        setIsSaving(true);
        const selected = localTransactions.filter((_, i) => selectedIndices.has(i));
        const PAYMENT_METHOD_MAP: Record<string, "CASH" | "CARD" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI" | "NET_BANKING" | "BANK_TRANSFER" | "OTHER"> = {
            CASH: "CASH",
            CARD: "CARD",
            DEBIT_CARD: "DEBIT_CARD",
            "DEBIT CARD": "DEBIT_CARD",
            CREDIT_CARD: "CREDIT_CARD",
            "CREDIT CARD": "CREDIT_CARD",
            UPI: "UPI",
            NET_BANKING: "NET_BANKING",
            NETBANKING: "NET_BANKING",
            BANK_TRANSFER: "BANK_TRANSFER",
            "BANK TRANSFER": "BANK_TRANSFER",
            OTHER: "OTHER",
        };

        const importBatchId = `stmt_${Date.now()}`;

        const expenses = selected
            .filter((t) => t.type?.toLowerCase() === "expense")
            .map((t) => {
                const rawMethod = t.paymentMethod ? t.paymentMethod.toUpperCase().trim() : "";
                const validMethod = PAYMENT_METHOD_MAP[rawMethod] || "BANK_TRANSFER";
                return {
                    amount: Number(t.amount) || 0,
                    merchant: t.description || t.title || "Unknown Merchant",
                    date: t.date ? new Date(t.date) : new Date(),
                    categoryName: t.category || "Other",
                    paymentMethod: validMethod,
                    importBatchId,
                };
            });

        const incomes = selected
            .filter((t) => t.type?.toLowerCase() === "income")
            .map((t) => ({
                amount: Number(t.amount) || 0,
                source: t.description || t.title || "Unknown Source",
                date: t.date ? new Date(t.date) : new Date(),
                categoryName: t.category || "UPI Transfer",
                importBatchId,
            }));

        try {
            const promises = [];
            if (expenses.length > 0) promises.push(bulkCreateExpenses.mutateAsync(expenses));
            if (incomes.length > 0) promises.push(bulkCreateIncomes.mutateAsync(incomes));

            await Promise.all(promises);

            // Invalidate entire tRPC query cache across all endpoints (expenses, incomes, budgets, categories, ai)
            await utils.invalidate();

            // Broadcast global synchronization event to all pages and listeners
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("app:transactions-updated", {
                    detail: { count: selected.length, expenseCount: expenses.length, incomeCount: incomes.length }
                }));
            }

            try {
                router.refresh();
            } catch (e) {
                // Ignore if not in full router context
            }

            showMatchingAlert({
                type: "general",
                status: "success",
                title: "Bank Statement Imported",
                message: `Successfully auto-categorized and added ${selected.length} transactions to your records!`,
            });
            handleClose();
        } catch (error: any) {
            console.error("Failed to save statement:", error);
            showMatchingAlert({
                status: "error",
                title: "Import Failed",
                message: "Failed to save statement transactions. Please try again.",
            });
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
                <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-[#F2F2F7] dark:bg-[#101012] rounded-t-[32px] flex flex-col outline-none overflow-hidden max-h-[94vh] shadow-2xl border-t border-black/5 dark:border-white/10">
                    <Drawer.Title className="sr-only">Review Bank Statement Transactions</Drawer.Title>

                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-1 bg-white dark:bg-[#1C1C1E] z-10 flex-shrink-0">
                        <div className="w-12 h-1.5 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C]" />
                    </div>

                    {/* Header */}
                    <div className="px-5 py-3 bg-white dark:bg-[#1C1C1E] border-b border-black/5 dark:border-white/10 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-ios-blue flex items-center justify-center font-bold">
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <h2 className="text-[17px] font-bold text-neutral-900 dark:text-white leading-tight">
                                        Statement Intelligence
                                    </h2>
                                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                                        Auto-categorized from uploaded bank statement
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-blue-500/10 text-ios-blue border border-blue-500/20">
                                {localTransactions.length} Statements
                            </span>
                        </div>

                        {/* Financial Flow Summary Card */}
                        <div className="grid grid-cols-3 gap-2 mt-3 p-3 rounded-2xl bg-neutral-100 dark:bg-[#252528] border border-black/5 dark:border-white/5 text-center">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                                    Total Inflow
                                </span>
                                <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400">
                                    +{formatCurrency(totalIncomes)}
                                </span>
                            </div>
                            <div className="border-x border-black/5 dark:border-white/10">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-0.5">
                                    Total Outflow
                                </span>
                                <span className="text-[13px] font-black text-rose-500">
                                    -{formatCurrency(totalExpenses)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-0.5">
                                    Net Flow
                                </span>
                                <span className="text-[13px] font-black text-neutral-900 dark:text-white">
                                    {totalIncomes >= totalExpenses ? "+" : ""}
                                    {formatCurrency(totalIncomes - totalExpenses)}
                                </span>
                            </div>
                        </div>

                        {/* Search Bar & Filter Controls */}
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 relative flex items-center">
                                <Search size={15} className="absolute left-3 text-neutral-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search merchant, category..."
                                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-[#252528] text-[13px] font-medium text-neutral-900 dark:text-white placeholder-neutral-400 outline-none border border-transparent focus:border-ios-blue transition-colors"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Select / Deselect All */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedIndices.size === filteredItems.length) {
                                        deselectAllFiltered();
                                    } else {
                                        selectAllFiltered();
                                    }
                                }}
                                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-[#252528] text-[12px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shrink-0"
                            >
                                <CheckCheck size={14} />
                                {selectedIndices.size === filteredItems.length ? "Deselect" : "Select All"}
                            </button>
                        </div>

                        {/* Segmented Filter Tabs */}
                        <div className="flex items-center gap-1.5 mt-2.5">
                            <button
                                type="button"
                                onClick={() => setFilterType("ALL")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all",
                                    filterType === "ALL"
                                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                                        : "bg-neutral-100 dark:bg-[#252528] text-neutral-600 dark:text-neutral-400"
                                )}
                            >
                                All ({localTransactions.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterType("EXPENSE")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all",
                                    filterType === "EXPENSE"
                                        ? "bg-rose-500 text-white shadow-sm"
                                        : "bg-neutral-100 dark:bg-[#252528] text-neutral-600 dark:text-neutral-400"
                                )}
                            >
                                Expenses ({localTransactions.filter((t) => t.type?.toLowerCase() === "expense").length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterType("INCOME")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all",
                                    filterType === "INCOME"
                                        ? "bg-emerald-500 text-white shadow-sm"
                                        : "bg-neutral-100 dark:bg-[#252528] text-neutral-600 dark:text-neutral-400"
                                )}
                            >
                                Incomes ({localTransactions.filter((t) => t.type?.toLowerCase() === "income").length})
                            </button>
                        </div>

                        {/* Duplicate Warning Banner if statement contains existing transactions */}
                        {duplicateIndices.size > 0 && (
                            <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-900 dark:text-amber-200">
                                <div className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <AlertTriangle size={15} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-[13px] font-bold text-amber-900 dark:text-amber-100">
                                                {isEntireStatementDuplicate ? "Statement Already Uploaded" : "Duplicate Transactions Detected"}
                                            </h4>
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                                                {duplicateIndices.size} in Ledger
                                            </span>
                                        </div>
                                        <p className="text-[11.5px] text-amber-800/90 dark:text-amber-300/80 mt-1 leading-snug">
                                            {isEntireStatementDuplicate
                                                ? "Most or all transactions in this statement already exist in your records. Duplicates have been unselected to prevent double-counting."
                                                : `${duplicateIndices.size} of ${localTransactions.length} transactions already exist in your records. Duplicate entries have been unchecked by default.`}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={keepOnlyNew}
                                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600 text-white dark:bg-amber-500 dark:text-neutral-900 active:scale-95 transition-all shadow-sm"
                                            >
                                                Keep Only New ({Math.max(0, localTransactions.length - duplicateIndices.size)})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={selectAllAnyway}
                                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 active:scale-95 transition-all"
                                            >
                                                Select All Anyway
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Scrollable Transaction List */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 pb-28">
                        {filteredItems.length === 0 ? (
                            <div className="text-center py-16 space-y-2">
                                <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                                    No transactions match your search
                                </p>
                                <p className="text-xs text-neutral-400">
                                    Try clearing your search query or filter
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {filteredItems.map((t) => {
                                    const isSelected = selectedIndices.has(t.originalIndex);
                                    const isIncome = t.type?.toLowerCase() === "income";
                                    const Icon = isIncome ? ArrowUpRight : TrendingDown;

                                    return (
                                        <div
                                            key={t.originalIndex}
                                            style={{ contentVisibility: "auto", containIntrinsicSize: "72px" }}
                                            onClick={() => toggleSelection(t.originalIndex)}
                                            className={cn(
                                                "flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border transition-all cursor-pointer select-none active:scale-[0.99]",
                                                isSelected
                                                    ? "border-ios-blue/60 shadow-sm"
                                                    : "border-black/5 dark:border-white/5 opacity-50"
                                            )}
                                        >
                                            {/* Checkbox button */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelection(t.originalIndex);
                                                }}
                                                className="shrink-0 focus:outline-none"
                                            >
                                                {isSelected ? (
                                                    <CheckCircle2 size={22} className="text-ios-blue fill-ios-blue/15" />
                                                ) : (
                                                    <Circle size={22} className="text-neutral-300 dark:text-neutral-600" />
                                                )}
                                            </button>

                                            {/* Icon */}
                                            <div
                                                className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                    isIncome
                                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                        : "bg-rose-500/15 text-rose-500"
                                                )}
                                            >
                                                <Icon size={18} strokeWidth={2.5} />
                                            </div>

                                            {/* Particulars & Category Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline gap-2">
                                                    <p className="font-bold text-[14.5px] text-neutral-900 dark:text-white truncate">
                                                        {t.description || t.title || "Transaction"}
                                                    </p>
                                                    <span
                                                        className={cn(
                                                            "font-black text-[15px] whitespace-nowrap shrink-0",
                                                            isIncome
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-rose-500 dark:text-rose-400"
                                                        )}
                                                    >
                                                        {isIncome ? "+" : "-"}
                                                        {formatCurrency(t.amount)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                    {/* Interactive Category Selector Pill */}
                                                    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            value={t.category || "Other"}
                                                            onChange={(e) => {
                                                                const newCat = e.target.value;
                                                                setLocalTransactions((prev) =>
                                                                    prev.map((item, i) => (i === t.originalIndex ? { ...item, category: newCat } : item))
                                                                );
                                                            }}
                                                            className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#2C2C2E] text-neutral-800 dark:text-neutral-200 border-none outline-none cursor-pointer appearance-none pr-5 hover:bg-neutral-200 dark:hover:bg-[#3A3A3C] transition-colors"
                                                            style={{
                                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                                                backgroundRepeat: "no-repeat",
                                                                backgroundPosition: "right 4px center",
                                                            }}
                                                        >
                                                            <option value="Groceries">🛒 Groceries</option>
                                                            <option value="Transport">🚗 Transport</option>
                                                            <option value="Food & Dining">🍽️ Food & Dining</option>
                                                            <option value="Shopping">🛍️ Shopping</option>
                                                            <option value="Bills & Utilities">⚡ Bills & Utilities</option>
                                                            <option value="Entertainment">🎬 Entertainment</option>
                                                            <option value="Health">💊 Health</option>
                                                            <option value="Travel">✈️ Travel</option>
                                                            <option value="Salary">💼 Salary</option>
                                                            <option value="UPI Transfer">🔄 UPI Transfer</option>
                                                            <option value="Investments">📈 Investments</option>
                                                            <option value="Education">📚 Education</option>
                                                            <option value="Other">⚪ Other</option>
                                                        </select>
                                                    </div>

                                                    {/* Duplicate Ledger Badge */}
                                                    {duplicateIndices.has(t.originalIndex) && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                                                            Already in Ledger
                                                        </span>
                                                    )}

                                                    {/* Quick Type Switcher Badge */}
                                                    <button
                                                        type="button"
                                                        title="Tap to toggle Expense / Income"
                                                        onClick={(e) => toggleTransactionType(t.originalIndex, e)}
                                                        className={cn(
                                                            "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors",
                                                            isIncome
                                                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                                                                : "bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25"
                                                        )}
                                                    >
                                                        {isIncome ? "Income" : "Expense"} ⇄
                                                    </button>

                                                    {/* Date */}
                                                    <span className="text-[11px] text-neutral-400">
                                                        {t.date ? formatDate(new Date(t.date)) : "Recent"}
                                                    </span>

                                                    {/* Payment Method */}
                                                    {t.paymentMethod && (
                                                        <span className="text-[11px] text-neutral-400">
                                                            • {t.paymentMethod}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Sticky Bottom Action Bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-t border-black/5 dark:border-white/10 z-20">
                        <button
                            onClick={() => handleSave(false)}
                            disabled={isSaving || selectedIndices.size === 0}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-ios-blue to-[#005bb5] text-white font-bold text-[17px] shadow-lg shadow-ios-blue/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Importing Statements...
                                </>
                            ) : (
                                <>
                                    <Check size={20} strokeWidth={2.5} />
                                    Auto-Categorize &amp; Add {selectedIndices.size} Transactions
                                </>
                            )}
                        </button>
                    </div>

                    {/* Duplicate Confirmation Dialog Modal */}
                    <AnimatePresence>
                        {showDuplicateConfirmModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="w-full max-w-sm rounded-[28px] bg-white dark:bg-[#1C1C1E] p-6 shadow-2xl border border-black/10 dark:border-white/10 text-center space-y-4"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
                                        <AlertTriangle size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] font-bold text-neutral-900 dark:text-white">
                                            Import Duplicate Records?
                                        </h3>
                                        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                                            You have selected <span className="font-bold text-amber-600 dark:text-amber-400">{countSelectedDuplicates} transaction{countSelectedDuplicates > 1 ? "s" : ""}</span> that already exist in your records. Importing duplicates will affect your total spend calculations.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                keepOnlyNew();
                                                setShowDuplicateConfirmModal(false);
                                            }}
                                            className="w-full py-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-[14px] active:scale-95 transition-all shadow-md"
                                        >
                                            Keep Clean (Exclude Duplicates)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowDuplicateConfirmModal(false);
                                                handleSave(true);
                                            }}
                                            className="w-full py-3 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 font-bold text-[14px] active:scale-95 transition-all"
                                        >
                                            Import All Selected Anyway
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowDuplicateConfirmModal(false)}
                                            className="w-full py-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-[13px] font-medium transition-colors"
                                        >
                                            Review Transactions
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
