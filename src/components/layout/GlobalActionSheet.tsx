"use client";

import { useState, useRef } from "react";
import { Drawer } from "vaul";
import { Plus, TrendingDown, ArrowUpRight, Camera, Paperclip, Loader2, ChevronLeft, AlertTriangle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AddExpenseSheet } from "@/components/expenses/AddExpenseSheet";
import { AddIncomeSheet } from "@/components/income/AddIncomeSheet";
import { BudgetSheet } from "@/components/budgets/BudgetSheet";
import { AgentOasisChatSheet } from "@/components/ai/AgentOasisChatSheet";
import { StatementReviewSheet } from "@/components/transactions/StatementReviewSheet";
import { BillReviewSheet } from "@/components/transactions/BillReviewSheet";
import { trpc } from "@/trpc/client";
import { compressImage } from "@/lib/utils";

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

    // Scanning overlay state (independent of the drawer's open/close)
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [prefillData, setPrefillData] = useState<any>(null);
    const [initialFile, setInitialFile] = useState<File | null>(null);

    const scanDocumentAI = trpc.ai.scanDocument.useMutation();

    // File inputs are rendered outside the drawer to avoid focus issues
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);

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

    const triggerCamera = () => {
        // Close drawer first, then open the file picker
        handleOpenChange(false);
        setTimeout(() => cameraRef.current?.click(), 200);
    };

    const triggerGallery = () => {
        // Close drawer first, then open the file picker
        handleOpenChange(false);
        setTimeout(() => galleryRef.current?.click(), 200);
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
                    const result = await scanDocumentAI.mutateAsync({
                        imageBase64: base64String,
                        mimeType: fileToProcess.type,
                    });

                    setIsScanning(false);

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
                        setStatementData(result.data || []);
                        setStatementReviewOpen(true);
                    } else {
                        setScanError(result.reason || "This document could not be recognized as an expense or income.");
                        onOpenChange(true); // Re-open drawer to show error
                    }
                } catch (err: any) {
                    setIsScanning(false);
                    setScanError(err.message || "Failed to analyze document.");
                    onOpenChange(true); // Re-open drawer to show error
                }
            };

            reader.onerror = () => {
                setIsScanning(false);
                setScanError("Failed to read the file.");
                onOpenChange(true);
            };
        } catch (err: any) {
            setIsScanning(false);
            setScanError(err.message || "Failed to process image.");
            onOpenChange(true);
        }

        // Reset the file input so the same file can be picked again
        if (cameraRef.current) cameraRef.current.value = "";
        if (galleryRef.current) galleryRef.current.value = "";
    };

    return (
        <>
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
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleProcessDocument(f);
                }}
            />

            <Drawer.Root open={open} onOpenChange={handleOpenChange}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm transition-opacity" />
                    <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1C1C1E] rounded-t-[28px] flex flex-col outline-none pb-8 overflow-y-auto max-h-[85vh]">
                        <Drawer.Title className="sr-only">Add Transaction Action Sheet</Drawer.Title>

                        <div className="flex justify-center pt-3 pb-2 relative z-10 bg-white dark:bg-[#1C1C1E]">
                            <div className="w-10 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C]" />
                        </div>

                        <div className="px-5 pt-2 pb-6 flex flex-col gap-2">

                            {scanError && (
                                <div className="p-3 mb-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                                    <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-[13px] text-amber-600 dark:text-amber-400 leading-snug">{scanError}</p>
                                </div>
                            )}

                            {/* Ask AI */}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={handleOpenChat}
                                className="w-full flex items-center justify-between p-4 rounded-xl ios-card active:bg-black/5 dark:active:bg-white/5 transition-colors border border-transparent"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <Sparkles size={20} className="text-purple-500" />
                                    </div>
                                    <span className="text-[17px] font-semibold ios-text-primary">Ask Agent Floww</span>
                                </div>
                            </motion.button>

                            {/* Add Expense */}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={handleOpenExpense}
                                className="w-full flex items-center justify-between p-4 rounded-xl ios-card active:bg-black/5 dark:active:bg-white/5 transition-colors border border-transparent"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-ios-red/10 flex items-center justify-center">
                                        <TrendingDown size={20} className="text-ios-red" />
                                    </div>
                                    <span className="text-[17px] font-semibold ios-text-primary">Add Expense</span>
                                </div>
                            </motion.button>

                            {/* Add Income */}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={handleOpenIncome}
                                className="w-full flex items-center justify-between p-4 rounded-xl ios-card active:bg-black/5 dark:active:bg-white/5 transition-colors border border-transparent"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#34C759]/10 border border-[#34C759]/20 flex items-center justify-center">
                                        <ArrowUpRight size={20} className="text-[#34C759]" />
                                    </div>
                                    <span className="text-[17px] font-semibold ios-text-primary">Add Income</span>
                                </div>
                            </motion.button>

                            {/* New Budget */}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={handleOpenBudget}
                                className="w-full flex items-center justify-between p-4 rounded-xl ios-card active:bg-black/5 dark:active:bg-white/5 transition-colors border border-transparent"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <Loader2 size={20} className="text-indigo-500" />
                                    </div>
                                    <span className="text-[17px] font-semibold ios-text-primary">New Budget</span>
                                </div>
                            </motion.button>

                            {/* Scan Document */}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={triggerCamera}
                                className="w-full flex items-center justify-between p-4 rounded-xl ios-card active:bg-black/5 dark:active:bg-white/5 transition-colors border border-transparent mt-2 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-ios-blue/5 via-purple-500/5 to-ios-blue/5 group-hover:from-ios-blue/10 group-hover:via-purple-500/10 group-hover:to-ios-blue/10 transition-colors duration-500" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ios-blue to-purple-500 flex items-center justify-center shadow-sm shadow-ios-blue/20">
                                        <Camera size={20} className="text-white" />
                                    </div>
                                    <div className="flex flex-col items-start pr-2">
                                        <span className="text-[17px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-ios-blue to-purple-500">
                                            Scan Document
                                        </span>
                                        <span className="text-[12px] font-medium text-ios-blue/70 dark:text-ios-blue/50 line-clamp-1">
                                            Automatically extract receipt details
                                        </span>
                                    </div>
                                </div>
                            </motion.button>

                            {/* Upload Document */}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={triggerGallery}
                                className="w-full flex items-center justify-between p-4 rounded-xl ios-card active:bg-black/5 dark:active:bg-white/5 transition-colors border border-transparent mt-2 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#34C759]/5 via-[#5856D6]/5 to-[#34C759]/5 group-hover:from-[#34C759]/10 group-hover:via-[#5856D6]/10 group-hover:to-[#34C759]/10 transition-colors duration-500" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#34C759] to-[#5856D6] flex items-center justify-center shadow-sm shadow-[#34C759]/20">
                                        <Paperclip size={20} className="text-white" />
                                    </div>
                                    <div className="flex flex-col items-start pr-2">
                                        <span className="text-[17px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#34C759] to-[#5856D6]">
                                            Upload Document
                                        </span>
                                        <span className="text-[12px] font-medium text-[#34C759]/70 dark:text-[#34C759]/50 line-clamp-1">
                                            Process digital receipts, invoices &amp; bank statements
                                        </span>
                                    </div>
                                </div>
                            </motion.button>
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
            <AgentOasisChatSheet
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
            />
        </>
    );
}
