"use client";

import { Drawer } from "vaul";
import { motion } from "framer-motion";
import { Info, Mail, Sparkles, Shield, PiggyBank, Smartphone } from "lucide-react";

interface AppInfoSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AppInfoSheet({ open, onOpenChange }: AppInfoSheetProps) {
    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] outline-none">
                    <Drawer.Title className="sr-only">About Oasis</Drawer.Title>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-t-[28px] flex flex-col h-full overflow-hidden">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-0">
                            <div className="w-10 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C]" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5EA] dark:border-[#3A3A3C]">
                            <h2 className="text-[17px] font-semibold ios-text-primary">About Oasis</h2>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="ios-text-secondary text-[15px] font-medium bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3 py-1 rounded-full"
                            >
                                Done
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-8 pb-[env(safe-area-inset-bottom,40px)]">
                            {/* Hero Section */}
                            <div className="flex flex-col items-center text-center space-y-3">
                                <img src="/logo.png?v=2" alt="Oasis Logo" className="w-20 h-20 rounded-[20px] shadow-sm" />
                                <div>
                                    <h3 className="text-xl font-bold ios-text-primary tracking-tight">Oasis Expense Tracker</h3>
                                    <p className="text-sm ios-text-secondary mt-1">Smart finance management</p>
                                </div>
                            </div>

                            {/* Features List */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold ios-text-secondary uppercase tracking-wider mb-2">Key Features</h4>

                                <div className="ios-card overflow-hidden divide-y ios-separator">
                                    <div className="flex gap-4 p-4">
                                        <div className="w-10 h-10 rounded-full bg-ios-blue/10 dark:bg-ios-blue-dark/20 flex items-center justify-center flex-shrink-0">
                                            <Sparkles size={20} className="text-ios-blue dark:text-ios-blue-dark" />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-semibold ios-text-primary">AI Receipt Scanner</p>
                                            <p className="text-[13px] ios-text-secondary leading-snug mt-0.5">Snap a photo of any receipt and our Vision AI instantly extracts the merchant, amount, and date.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4">
                                        <div className="w-10 h-10 rounded-full bg-[#EA4335]/10 flex items-center justify-center flex-shrink-0">
                                            <Mail size={20} className="text-[#EA4335]" />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-semibold ios-text-primary">Gmail Smart Sync</p>
                                            <p className="text-[13px] ios-text-secondary leading-snug mt-0.5">Securely connect Gmail to automatically detect and log digital receipts sent to your inbox.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4">
                                        <div className="w-10 h-10 rounded-full bg-[#34C759]/10 flex items-center justify-center flex-shrink-0">
                                            <PiggyBank size={20} className="text-[#34C759]" />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-semibold ios-text-primary">Budget Tracking</p>
                                            <p className="text-[13px] ios-text-secondary leading-snug mt-0.5">Create custom category limits and monitor your monthly spending visually.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4">
                                        <div className="w-10 h-10 rounded-full bg-ios-indigo/10 flex items-center justify-center flex-shrink-0">
                                            <Shield size={20} className="text-ios-indigo" />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-semibold ios-text-primary">Privacy First</p>
                                            <p className="text-[13px] ios-text-secondary leading-snug mt-0.5">Tap the eye icon to obscure all balances and amounts instantly if you are in a public place.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4">
                                        <div className="w-10 h-10 rounded-full bg-ios-orange/10 flex items-center justify-center flex-shrink-0">
                                            <Smartphone size={20} className="text-ios-orange" />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-semibold ios-text-primary">PWA Ready</p>
                                            <p className="text-[13px] ios-text-secondary leading-snug mt-0.5">Install the app directly to your home screen for an authentic native iOS-like experience.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
