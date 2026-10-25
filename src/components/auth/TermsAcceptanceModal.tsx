"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, ExternalLink, Sparkles, Lock, FileText } from "lucide-react";
import Link from "next/link";
import { showMatchingAlert } from "@/components/ui/AlertCard";

export function TermsAcceptanceModal() {
    const [open, setOpen] = useState(false);
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        // Check if user has already accepted the terms
        try {
            const accepted = localStorage.getItem("floww_terms_accepted_v1");
            if (!accepted) {
                // Show modal with a short natural delay
                const timer = setTimeout(() => setOpen(true), 600);
                return () => clearTimeout(timer);
            }
        } catch {
            // In case of restricted localStorage, do not block user
        }
    }, []);

    const handleAccept = () => {
        try {
            localStorage.setItem("floww_terms_accepted_v1", "true");
            localStorage.setItem("floww_terms_accepted_at", new Date().toISOString());
        } catch {
            // ignore
        }
        setOpen(false);
        showMatchingAlert({
            status: "success",
            title: "Welcome to Floww",
            message: "Terms accepted. Your financial workspace is ready.",
        });
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-md"
                />

                {/* Terms Popup Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 16 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-7 z-10 flex flex-col gap-5 text-neutral-900 dark:text-white"
                >
                    {/* Header */}
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-ios-blue/10 dark:bg-ios-blue/20 flex items-center justify-center text-ios-blue flex-shrink-0 shadow-sm">
                            <Shield size={26} strokeWidth={2.2} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Welcome to Floww</h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Please review and accept our platform terms
                            </p>
                        </div>
                    </div>

                    {/* Key Highlights */}
                    <div className="space-y-3 py-1">
                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800/80">
                            <Lock size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div className="text-xs space-y-0.5">
                                <p className="font-bold text-neutral-900 dark:text-neutral-100">Privacy &amp; Data Security</p>
                                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    Your transactions, receipts, and bank statements are stored safely and never sold to third parties.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800/80">
                            <Sparkles size={18} className="text-ios-blue mt-0.5 flex-shrink-0" />
                            <div className="text-xs space-y-0.5">
                                <p className="font-bold text-neutral-900 dark:text-neutral-100">AI Intelligence</p>
                                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    Automated OCR scans receipts and classifies expenses to simplify your ledger.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800/80">
                            <FileText size={18} className="text-purple-500 mt-0.5 flex-shrink-0" />
                            <div className="text-xs space-y-0.5">
                                <p className="font-bold text-neutral-900 dark:text-neutral-100">Non-Advisory Tool</p>
                                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    Floww is a financial management software tool and does not provide formal investment advice.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Agreement Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer select-none px-1">
                        <div className="relative mt-0.5 flex-shrink-0">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="sr-only"
                            />
                            <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                    agreed
                                        ? "bg-ios-blue border-ios-blue text-white shadow-sm"
                                        : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                                }`}
                            >
                                {agreed && <Check size={13} strokeWidth={3} />}
                            </div>
                        </div>
                        <span className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
                            I agree to the{" "}
                            <Link
                                href="/terms"
                                target="_blank"
                                className="font-semibold text-ios-blue hover:underline inline-flex items-center gap-0.5"
                            >
                                Terms of Service <ExternalLink size={10} />
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy"
                                target="_blank"
                                className="font-semibold text-ios-blue hover:underline inline-flex items-center gap-0.5"
                            >
                                Privacy Policy <ExternalLink size={10} />
                            </Link>
                            .
                        </span>
                    </label>

                    {/* Action Button */}
                    <button
                        type="button"
                        disabled={!agreed}
                        onClick={handleAccept}
                        className="w-full h-12 rounded-2xl bg-ios-blue hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <span>Accept &amp; Continue</span>
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
