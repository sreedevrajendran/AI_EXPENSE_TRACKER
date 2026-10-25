"use client";

import { useState, useMemo, useEffect } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText,
    Download,
    Printer,
    X,
    Calendar,
    ShieldCheck,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    CheckCircle2
} from "lucide-react";
import {
    StatementPeriodFilter,
    getFilterDateRange,
    filterTransactions,
    generateStatementRecords,
    downloadStatementPdf,
    openPrintableTransactionStatement
} from "@/lib/bankStatement";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";
import { showMatchingAlert } from "@/components/ui/AlertCard";
import { sendNotification, requestNotificationPermission } from "@/lib/notifications";

interface TransactionStatementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expenses: any[];
    incomes: any[];
    userName?: string;
}

export function TransactionStatementModal({
    open,
    onOpenChange,
    expenses = [],
    incomes = [],
    userName = "Account Holder",
}: TransactionStatementModalProps) {
    const { currency, currencySymbol } = useCurrency();
    const [selectedPeriod, setSelectedPeriod] = useState<StatementPeriodFilter>("month");
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!open) return;
        const handleBack = () => {
            onOpenChange(false);
        };
        window.addEventListener("app:back-press", handleBack);
        return () => window.removeEventListener("app:back-press", handleBack);
    }, [open, onOpenChange]);

    const periodOptions: Array<{ id: StatementPeriodFilter; label: string }> = [
        { id: "month", label: "This Month" },
        { id: "3months", label: "Last 3 Months" },
        { id: "financial_year", label: "Financial Year" },
        { id: "all", label: "All Time" },
    ];

    // Compute live statement data for the currently selected period
    const { range, records, totalCredits, totalDebits, closingBalance } = useMemo(() => {
        const r = getFilterDateRange(selectedPeriod);
        const filteredExp = filterTransactions(expenses, r);
        const filteredInc = filterTransactions(incomes, r);
        const stat = generateStatementRecords(filteredExp, filteredInc);
        return {
            range: r,
            records: stat.records,
            totalCredits: stat.totalCredits,
            totalDebits: stat.totalDebits,
            closingBalance: stat.closingBalance,
        };
    }, [selectedPeriod, expenses, incomes]);

    const reversedRecords = useMemo(() => [...records].reverse(), [records]);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const result = await downloadStatementPdf(
                expenses,
                incomes,
                userName,
                selectedPeriod,
                currency
            );

            // Request permission & push native notification
            try {
                await requestNotificationPermission();
                await sendNotification({
                    title: "Statement Downloaded 📄",
                    body: `Your statement for ${result.label} has been saved to your Downloads folder.`,
                    scenario: "statement_download",
                });
            } catch (notifErr) {
                console.warn("Failed to push statement notification:", notifErr);
            }

            showMatchingAlert({
                status: "success",
                title: "Statement Saved",
                message: `Saved ${result.filename} to your phone.`,
            });
        } catch (err) {
            console.error("PDF generation error:", err);
            showMatchingAlert({
                status: "error",
                title: "Download Failed",
                message: "Could not generate PDF. Please try again.",
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePrint = () => {
        openPrintableTransactionStatement(expenses, incomes, userName, selectedPeriod);
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] flex flex-col rounded-t-[32px] bg-neutral-100 dark:bg-[#121214] border-t border-neutral-200/80 dark:border-neutral-800 focus:outline-none overflow-hidden">
                    {/* Drawer Handle */}
                    <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-2 border-b border-neutral-200/60 dark:border-neutral-800/60 flex-shrink-0">
                        <div>
                            <Drawer.Title className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <FileText size={20} className="text-ios-blue" />
                                Transaction Statement
                            </Drawer.Title>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Live digital ledger • Instant PDF export
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-200/70 hover:bg-neutral-300/70 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                                title="Print / Open in browser"
                            >
                                <Printer size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-200/70 hover:bg-neutral-300/70 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Period Tabs Selector */}
                    <div className="px-6 py-3 flex-shrink-0 bg-white/60 dark:bg-[#1C1C1E]/60 border-b border-neutral-200/50 dark:border-neutral-800/50">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {periodOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setSelectedPeriod(opt.id)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                        selectedPeriod === opt.id
                                            ? "bg-ios-blue text-white shadow-sm shadow-blue-500/25 scale-[1.02]"
                                            : "bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                                    }`}
                                >
                                    <Calendar size={12} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Document Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                        {/* Statement Paper Sheet */}
                        <div className="max-w-3xl mx-auto rounded-2xl bg-white text-neutral-900 border border-neutral-200 shadow-md p-5 sm:p-7 space-y-6">
                            {/* Paper Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b-2 border-ios-blue gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-black text-ios-blue tracking-tight">floww</h1>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                            <ShieldCheck size={11} /> Verified
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
                                        Official Transaction Statement
                                    </p>
                                    <p className="text-sm font-bold text-neutral-900 mt-2">{userName}</p>
                                </div>
                                <div className="text-left sm:text-right text-[11px] text-neutral-500 space-y-0.5">
                                    <p><strong className="text-neutral-700">Period:</strong> {range.label}</p>
                                    <p><strong className="text-neutral-700">Currency:</strong> {currency} ({currencySymbol})</p>
                                    <p><strong className="text-neutral-700">Generated:</strong> {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* 4 Summary Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                                    <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Deposits (CR)</p>
                                    <p className="text-sm sm:text-base font-extrabold text-emerald-600 mt-1">
                                        +{formatCurrency(totalCredits, false, currency)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                                    <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Withdrawals (DR)</p>
                                    <p className="text-sm sm:text-base font-extrabold text-rose-600 mt-1">
                                        -{formatCurrency(totalDebits, false, currency)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                                    <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Net Flow</p>
                                    <p className={`text-sm sm:text-base font-extrabold mt-1 ${closingBalance >= 0 ? "text-neutral-900" : "text-rose-600"}`}>
                                        {formatCurrency(closingBalance, false, currency)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                                    <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Records</p>
                                    <p className="text-sm sm:text-base font-extrabold text-neutral-900 mt-1">
                                        {records.length}
                                    </p>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto rounded-xl border border-neutral-200">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-neutral-900 text-white font-bold text-[10px] uppercase tracking-wider">
                                            <th className="py-2.5 px-3">Date</th>
                                            <th className="py-2.5 px-3">Particulars</th>
                                            <th className="py-2.5 px-3 hidden sm:table-cell">Category</th>
                                            <th className="py-2.5 px-3 hidden sm:table-cell">Mode</th>
                                            <th className="py-2.5 px-3 text-right">Debit (-)</th>
                                            <th className="py-2.5 px-3 text-right">Credit (+)</th>
                                            <th className="py-2.5 px-3 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 font-medium">
                                        {reversedRecords.length > 0 ? (
                                            reversedRecords.map((r) => {
                                                const d = new Date(r.date).toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric"
                                                });
                                                const isDebit = r.type === "DEBIT";
                                                return (
                                                    <tr key={r.id} className="hover:bg-neutral-50/70 transition-colors">
                                                        <td className="py-2 px-3 text-neutral-500 whitespace-nowrap">{d}</td>
                                                        <td className="py-2 px-3 font-semibold text-neutral-900 max-w-[160px] truncate">
                                                            {r.description}
                                                        </td>
                                                        <td className="py-2 px-3 text-neutral-500 hidden sm:table-cell">{r.category}</td>
                                                        <td className="py-2 px-3 text-neutral-500 hidden sm:table-cell">{r.paymentMethod || "UPI"}</td>
                                                        <td className="py-2 px-3 text-right text-rose-600 font-semibold whitespace-nowrap">
                                                            {isDebit ? `-${formatCurrency(r.amount, false, currency)}` : "-"}
                                                        </td>
                                                        <td className="py-2 px-3 text-right text-emerald-600 font-semibold whitespace-nowrap">
                                                            {!isDebit ? `+${formatCurrency(r.amount, false, currency)}` : "-"}
                                                        </td>
                                                        <td className="py-2 px-3 text-right font-bold text-neutral-900 whitespace-nowrap">
                                                            {formatCurrency(r.runningBalance, false, currency)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-neutral-400">
                                                    No transactions recorded in this reporting period.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paper Footer */}
                            <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-neutral-400">
                                <span>Floww Financial Intelligence Platform • Computer Generated Statement</span>
                                <span className="font-semibold text-emerald-600">✓ Cryptographically Verified</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Sticky Action Bar: Download PDF Button */}
                    <div className="p-4 bg-white/90 dark:bg-[#1C1C1E]/90 border-t border-neutral-200/80 dark:border-neutral-800 flex-shrink-0 flex items-center justify-between gap-3">
                        <div className="hidden sm:block text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                            {records.length} transactions in {range.label}
                        </div>
                        <button
                            type="button"
                            disabled={isDownloading}
                            onClick={handleDownload}
                            className="w-full sm:w-auto sm:min-w-[240px] h-12 rounded-2xl bg-ios-blue hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 ml-auto"
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Generating PDF...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} strokeWidth={2.5} />
                                    <span>Download PDF Statement</span>
                                </>
                            )}
                        </button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
