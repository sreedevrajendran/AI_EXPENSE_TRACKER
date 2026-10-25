"use client";

import { useState, useRef, useEffect } from "react";
import { Drawer } from "vaul";
import { Plus, TrendingDown, ArrowUpRight, Camera, Paperclip, Loader2, ChevronLeft, AlertTriangle, Sparkles, Target, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AddExpenseSheet } from "@/components/expenses/AddExpenseSheet";
import { AddIncomeSheet } from "@/components/income/AddIncomeSheet";
import { BudgetSheet } from "@/components/budgets/BudgetSheet";
import { AgentFlowwChatSheet } from "@/components/ai/AgentFlowwChatSheet";
import { StatementReviewSheet } from "@/components/transactions/StatementReviewSheet";
import { BillReviewSheet } from "@/components/transactions/BillReviewSheet";
import { trpc } from "@/trpc/client";
import { compressImage, formatCurrency } from "@/lib/utils";
import { showMatchingAlert } from "@/components/ui/AlertCard";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

interface GlobalActionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GlobalActionSheet({ open, onOpenChange }: GlobalActionSheetProps) {
    const [addExpenseOpen, setAddExpenseOpen] = useState(false);
    const [addIncomeOpen, setAddIncomeOpen] = useState(false);
    const [addBudgetOpen, setAddBudgetOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [statementReviewOpen, setStatementReviewOpen] = useState(false);
    const [statementData, setStatementData] = useState<any[]>([]);
    const [billReviewOpen, setBillReviewOpen] = useState(false);
    const [billData, setBillData] = useState<any>(null);

    // Duplicate detection modal state
    const [duplicateReceiptPrompt, setDuplicateReceiptPrompt] = useState<{
        result: any;
        duplicateInfo: any;
    } | null>(null);

    // Scanning overlay state (independent of the drawer's open/close)
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [prefillData, setPrefillData] = useState<any>(null);
    const [initialFile, setInitialFile] = useState<File | null>(null);

    const scanDocumentAI = trpc.ai.scanDocument.useMutation();

    // File inputs are rendered outside the drawer to avoid focus issues
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);
    const statementPdfRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleBack = (e: Event) => {
            if (chatOpen) {
                e.preventDefault();
                setChatOpen(false);
                return;
            }
            if (addExpenseOpen) {
                e.preventDefault();
                setAddExpenseOpen(false);
                return;
            }
            if (addIncomeOpen) {
                e.preventDefault();
                setAddIncomeOpen(false);
                return;
            }
            if (addBudgetOpen) {
                e.preventDefault();
                setAddBudgetOpen(false);
                return;
            }
            if (statementReviewOpen) {
                e.preventDefault();
                setStatementReviewOpen(false);
                return;
            }
            if (billReviewOpen) {
                e.preventDefault();
                setBillReviewOpen(false);
                return;
            }
            if (open) {
                e.preventDefault();
                handleOpenChange(false);
                return;
            }
        };

        window.addEventListener("app:back-press", handleBack);
        return () => window.removeEventListener("app:back-press", handleBack);
    }, [open, chatOpen, addExpenseOpen, addIncomeOpen, addBudgetOpen, statementReviewOpen, billReviewOpen]);

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setTimeout(() => {
                setScanError(null);
                setPrefillData(null);
                setInitialFile(null);
            }, 300);
        }
        onOpenChange(isOpen);
    };

    const handleOpenChat = () => {
        handleOpenChange(false);
        setTimeout(() => setChatOpen(true), 150);
    };

    const handleOpenExpense = () => {
        handleOpenChange(false);
        setTimeout(() => setAddExpenseOpen(true), 150);
    };

    const handleOpenIncome = () => {
        handleOpenChange(false);
        setTimeout(() => setAddIncomeOpen(true), 150);
    };

    const handleOpenBudget = () => {
        handleOpenChange(false);
        setTimeout(() => setAddBudgetOpen(true), 150);
    };

    const triggerCamera = async () => {
        handleOpenChange(false);

        if (Capacitor.isNativePlatform() || (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.())) {
            try {
                const photo = await CapCamera.getPhoto({
                    quality: 90,
                    allowEditing: false,
                    resultType: CameraResultType.Uri,
                    source: CameraSource.Camera,
                });

                if (photo.webPath) {
                    const response = await fetch(photo.webPath);
                    const blob = await response.blob();
                    const file = new File([blob], `receipt_${Date.now()}.${photo.format || "jpg"}`, {
                        type: blob.type || `image/${photo.format || "jpeg"}`,
                    });
                    handleProcessDocument(file);
                    return;
                }
            } catch (err: any) {
                const msg = (err?.message || "").toLowerCase();
                if (msg.includes("cancel") || msg.includes("cancelled")) {
                    return;
                }
                console.warn("Native camera failed, falling back to input:", err);
            }
        }

        cameraRef.current?.click();
    };

    const triggerGallery = () => {
        galleryRef.current?.click();
        handleOpenChange(false);
    };

    const triggerPdf = () => {
        statementPdfRef.current?.click();
        handleOpenChange(false);
    };

    const handleProcessDocument = async (selectedFile: File) => {
        setScanError(null);
        setInitialFile(selectedFile);
        setIsScanning(true); // Show standalone scanning overlay

        try {
            let fileToProcess = selectedFile;
            if (selectedFile.type.startsWith('image/')) {
                fileToProcess = await compressImage(selectedFile);
            }

            const reader = new FileReader();
            reader.readAsDataURL(fileToProcess);

            reader.onload = async () => {
                try {
                    const base64String = (reader.result as string).split(",")[1];
                    const detectedMime = fileToProcess.type || (fileToProcess.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
                    const result = await scanDocumentAI.mutateAsync({
                        imageBase64: base64String,
                        mimeType: detectedMime,
                    });

                    setIsScanning(false);

                    // If receipt was already added previously, prompt user
                    if (result.isDuplicate && result.duplicateInfo) {
                        setDuplicateReceiptPrompt({
                            result,
                            duplicateInfo: result.duplicateInfo,
                        });
                        return;
                    }

                    if (result.type === "bill") {
                        setBillData(result);
                        setBillReviewOpen(true);
                    } else if (result.type === "expense") {
                        setPrefillData(result.data);
                        setAddExpenseOpen(true);
                    } else if (result.type === "income") {
                        setPrefillData(result.data);
                        setAddIncomeOpen(true);
                    } else if (result.type === "statement") {
                        setStatementData(result.transactions || []);
                        setStatementReviewOpen(true);
                    } else {
                        showMatchingAlert({
                            status: "error",
                            title: "Invalid Document",
                            message: result.reason || "This image does not contain a valid receipt or transaction details.",
                            duration: 3500,
                        });
                        setScanError(result.reason || "This document could not be recognized as an expense or income.");
                    }
                } catch (err: any) {
                    setIsScanning(false);
                    console.error("Scan error:", err);
                    showMatchingAlert({
                        status: "error",
                        title: "Scan Failed",
                        message: "Failed to analyze document. Please ensure it is a clear bill or receipt.",
                        duration: 3500,
                    });
                    setScanError("Failed to analyze document. Please try again.");
                }
            };

            reader.onerror = () => {
                setIsScanning(false);
                setScanError("Failed to read the file.");
                onOpenChange(true);
            };
        } catch (err: any) {
            setIsScanning(false);
            console.error("Document processing error:", err);
            setScanError("Unable to analyze document. Please ensure the file is a clear image or readable PDF and try again.");
            onOpenChange(true);
        }

        // Reset the file inputs so the same file can be picked again
        if (cameraRef.current) cameraRef.current.value = "";
        if (galleryRef.current) galleryRef.current.value = "";
        if (statementPdfRef.current) statementPdfRef.current.value = "";
    };

    const handleProceedDuplicate = () => {
        if (!duplicateReceiptPrompt) return;
        const { result } = duplicateReceiptPrompt;
        setDuplicateReceiptPrompt(null);

        if (result.type === "bill") {
            setBillData(result);
            setBillReviewOpen(true);
        } else if (result.type === "expense") {
            setPrefillData(result.data);
            setAddExpenseOpen(true);
        } else if (result.type === "income") {
            setPrefillData(result.data);
            setAddIncomeOpen(true);
        } else if (result.type === "statement") {
            setStatementData(result.transactions || []);
            setStatementReviewOpen(true);
        }
    };

    const handleCancelDuplicate = () => {
        setDuplicateReceiptPrompt(null);
        showMatchingAlert({
            status: "info",
            title: "Duplicate Skipped",
            message: "Your ledger remains clean without duplicate entries.",
        });
    };

    return (
        <>
            {/* Duplicate Receipt Alert Modal */}
            <AnimatePresence>
                {duplicateReceiptPrompt && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCancelDuplicate}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 16 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative w-full max-w-sm rounded-[28px] bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl z-10 space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle size={22} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                                        Receipt Already Added
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Potential duplicate detected
                                    </p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 space-y-2 text-xs">
                                <p className="text-neutral-600 dark:text-neutral-300 leading-snug">
                                    This receipt matches an existing transaction in your ledger:
                                </p>
                                <div className="pt-1 space-y-1 font-medium">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">Merchant:</span>
                                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                            {duplicateReceiptPrompt.duplicateInfo?.merchant || "Merchant"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">Amount:</span>
                                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                            {formatCurrency(duplicateReceiptPrompt.duplicateInfo?.amount || 0)}
                                        </span>
                                    </div>
                                    {duplicateReceiptPrompt.duplicateInfo?.date && (
                                        <div className="flex justify-between">
                                            <span className="text-neutral-400">Date:</span>
                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                {duplicateReceiptPrompt.duplicateInfo.date}
                                            </span>
                                        </div>
                                    )}
                                    {duplicateReceiptPrompt.duplicateInfo?.matchReason && (
                                        <div className="flex justify-between">
                                            <span className="text-neutral-400">Matched By:</span>
                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                {duplicateReceiptPrompt.duplicateInfo.matchReason}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleCancelDuplicate}
                                    className="w-full h-11 rounded-2xl bg-ios-blue text-white font-bold text-xs shadow-md shadow-ios-blue/20 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    Keep Clean (Don't Add Duplicate)
                                </button>
                                <button
                                    type="button"
                                    onClick={handleProceedDuplicate}
                                    className="w-full h-10 rounded-2xl text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-semibold text-xs transition-colors cursor-pointer"
                                >
                                    Add Anyway
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Standalone Full-Screen Scanning Overlay — lives outside the drawer so it's visible regardless */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        key="scanning-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-6 px-8"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-ios-blue blur-2xl opacity-30 rounded-full" />
                            <div className="w-24 h-24 rounded-3xl bg-ios-blue/10 border-2 border-ios-blue/30 flex items-center justify-center relative z-10">
                                <Loader2 size={40} className="text-ios-blue animate-spin" />
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center"
                        >
                            <h3 className="text-[22px] font-bold text-white mb-2">Analyzing Document</h3>
                            <p className="text-[15px] text-white/60 text-center max-w-[260px] leading-relaxed">
                                AI is extracting amounts, dates, merchants and auto-categorizing...
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden file inputs — outside the drawer so they are always in the DOM */}
            <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleProcessDocument(f);
                }}
            />
            <input
                ref={galleryRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleProcessDocument(f);
                }}
            />
            <input
                ref={statementPdfRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleProcessDocument(f);
                }}
            />

            <Drawer.Root open={open} onOpenChange={handleOpenChange}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm transition-opacity" />
                    <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-[#F9F9FB] dark:bg-[#161618] rounded-t-[32px] flex flex-col outline-none pb-8 overflow-y-auto max-h-[88vh] border-t border-black/5 dark:border-white/10 shadow-2xl">
                        <Drawer.Title className="sr-only">Add Transaction Action Sheet</Drawer.Title>

                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-2 relative z-10">
                            <div className="w-12 h-1.5 rounded-full bg-[#D1D1D6] dark:bg-[#3A3A3C]" />
                        </div>

                        {/* Header */}
                        <div className="px-6 pb-3 pt-1 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Add Transaction</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Record spending, earnings, or scan receipts</p>
                            </div>
                            <button
                                onClick={() => handleOpenChange(false)}
                                className="w-8 h-8 rounded-full bg-neutral-200/70 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                            >
                                <ChevronLeft className="rotate-[-90deg]" size={18} />
                            </button>
                        </div>

                        <div className="px-5 pt-1 pb-6 flex flex-col gap-4">
                            {scanError && (
                                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
                                    <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-[13px] text-amber-700 dark:text-amber-400 font-medium leading-snug">{scanError}</p>
                                </div>
                            )}

                            {/* Primary Hero Split Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Add Expense */}
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={handleOpenExpense}
                                    className="p-4 rounded-2xl bg-white dark:bg-[#1F1F23] border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between h-28 text-left shadow-sm hover:border-red-400/50 dark:hover:border-red-500/50 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-red-500/20 transition-all" />
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400">
                                        <TrendingDown size={22} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <span className="text-[16px] font-bold text-neutral-900 dark:text-white block leading-tight">Expense</span>
                                        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Record expenditure</span>
                                    </div>
                                </motion.button>

                                {/* Add Income */}
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={handleOpenIncome}
                                    className="p-4 rounded-2xl bg-white dark:bg-[#1F1F23] border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between h-28 text-left shadow-sm hover:border-emerald-400/50 dark:hover:border-emerald-500/50 transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                                        <ArrowUpRight size={22} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <span className="text-[16px] font-bold text-neutral-900 dark:text-white block leading-tight">Income</span>
                                        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Log earnings &amp; deposits</span>
                                    </div>
                                </motion.button>
                            </div>

                            {/* Intelligent Actions List */}
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 px-1">
                                    Intelligent Processing
                                </p>

                                {/* Import Statement */}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={triggerPdf}
                                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1F1F23] border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:border-emerald-400/50 dark:hover:border-emerald-500/50 transition-all relative overflow-hidden group"
                                >
                                    <div className="flex items-center gap-3.5 relative z-10">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
                                            <FileText size={20} />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-[15px] font-bold text-neutral-900 dark:text-white block">Import Statement</span>
                                            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">Parse bank statements for automated batch classification</p>
                                        </div>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                                        <ChevronLeft className="rotate-180" size={14} />
                                    </div>
                                </motion.button>

                                {/* Scan Receipt */}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={triggerCamera}
                                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1F1F23] border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all relative overflow-hidden group"
                                >
                                    <div className="flex items-center gap-3.5 relative z-10">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
                                            <Camera size={20} />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-[15px] font-bold text-neutral-900 dark:text-white block">Scan Receipt</span>
                                            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">Capture receipts, bills, or payment slips via camera</p>
                                        </div>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                                        <ChevronLeft className="rotate-180" size={14} />
                                    </div>
                                </motion.button>

                                {/* Upload File */}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={triggerGallery}
                                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1F1F23] border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:border-purple-400/50 dark:hover:border-purple-500/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/20 text-white">
                                            <Paperclip size={20} />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-[15px] font-bold text-neutral-900 dark:text-white block">Upload File</span>
                                            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">Select PDF invoices, bank statements, or receipt images</p>
                                        </div>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                                        <ChevronLeft className="rotate-180" size={14} />
                                    </div>
                                </motion.button>

                                {/* Agent Floww */}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleOpenChat}
                                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1F1F23] border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-white">
                                            <Sparkles size={20} />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-[15px] font-bold text-neutral-900 dark:text-white block">Agent Floww</span>
                                            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">Natural language financial queries and logging</p>
                                        </div>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                                        <ChevronLeft className="rotate-180" size={14} />
                                    </div>
                                </motion.button>
                            </div>

                            {/* Planning */}
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 px-1">
                                    Planning &amp; Targets
                                </p>

                                {/* Set Budget */}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleOpenBudget}
                                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1F1F23] border border-neutral-200/80 dark:border-neutral-800 shadow-sm hover:border-teal-400/50 dark:hover:border-teal-500/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/20 text-white">
                                            <Target size={20} />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-[15px] font-bold text-neutral-900 dark:text-white block">Set Budget</span>
                                            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">Configure monthly targets and spending thresholds</p>
                                        </div>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                                        <ChevronLeft className="rotate-180" size={14} />
                                    </div>
                                </motion.button>
                            </div>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>

            {/* Other sheets mounted globally */}
            <AddExpenseSheet
                open={addExpenseOpen}
                onOpenChange={setAddExpenseOpen}
                prefillData={prefillData}
                initialFile={initialFile}
            />
            <AddIncomeSheet
                open={addIncomeOpen}
                onOpenChange={setAddIncomeOpen}
                prefillData={prefillData}
                initialFile={initialFile}
            />
            <BudgetSheet
                open={addBudgetOpen}
                onOpenChange={setAddBudgetOpen}
            />
            <AgentFlowwChatSheet
                open={chatOpen}
                onOpenChange={setChatOpen}
            />
            <StatementReviewSheet
                open={statementReviewOpen}
                onOpenChange={setStatementReviewOpen}
                transactions={statementData}
            />
            <BillReviewSheet
                open={billReviewOpen}
                onOpenChange={setBillReviewOpen}
                billData={billData}
                initialFile={initialFile}
            />
        </>
    );
}
