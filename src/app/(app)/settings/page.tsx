"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePrivacy } from "@/context/PrivacyContext";
import { motion } from "framer-motion";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { trpc } from "@/trpc/client";
import {
  Eye,
  EyeOff,
  Moon,
  Sun,
  LogOut,
  Check,
  Shield,
  Mail,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

function SettingsContent() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = session?.user;

  if (!mounted) return null;

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card p-4 flex items-center gap-4"
      >
        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-ios-blue ring-2 ring-ios-blue/30">
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0) ?? "?"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-[17px] font-semibold ios-text-primary">
            {user?.name ?? "User"}
          </p>
          <p className="text-sm ios-text-secondary">{user?.email}</p>
        </div>
      </motion.div>

      {/* Preferences */}
      <div>
        <p className="text-xs font-semibold ios-text-secondary uppercase tracking-wider mb-2 px-1">
          Preferences
        </p>
        <div className="ios-card overflow-hidden divide-y ios-separator">
          {/* Privacy toggle */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              {isPrivate ? (
                <EyeOff
                  size={20}
                  className="text-ios-blue dark:text-ios-blue-dark"
                />
              ) : (
                <Eye
                  size={20}
                  className="text-ios-blue dark:text-ios-blue-dark"
                />
              )}
              <div>
                <p className="text-[15px] ios-text-primary font-medium">
                  Privacy Mode
                </p>
                <p className="text-xs ios-text-secondary">
                  Blur balances and amounts
                </p>
              </div>
            </div>
            <button
              onClick={togglePrivacy}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${isPrivate ? "bg-ios-blue dark:bg-ios-blue-dark" : "bg-[#E5E5EA] dark:bg-[#3A3A3C]"}`}
            >
              <motion.div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
                animate={{ x: isPrivate ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 700, damping: 35 }}
              />
            </button>
          </div>

          {/* Dark mode */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon size={20} className="text-ios-indigo" />
              ) : (
                <Sun size={20} className="text-ios-yellow" />
              )}
              <div>
                <p className="text-[15px] ios-text-primary font-medium">
                  Dark Mode
                </p>
                <p className="text-xs ios-text-secondary">
                  {theme === "dark" ? "Pure black theme" : "Pure white theme"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${theme === "dark" ? "bg-ios-blue dark:bg-ios-blue-dark" : "bg-[#E5E5EA] dark:bg-[#3A3A3C]"}`}
            >
              <motion.div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
                animate={{ x: theme === "dark" ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 700, damping: 35 }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Account */}
      <div>
        <p className="text-xs font-semibold ios-text-secondary uppercase tracking-wider mb-2 px-1">
          Account
        </p>
        <div className="ios-card overflow-hidden divide-y ios-separator">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[#F2F2F7] dark:active:bg-[#2C2C2E] transition-colors"
          >
            <LogOut size={20} className="text-ios-red" />
            <p className="text-[15px] text-ios-red font-medium">Sign Out</p>
          </button>
        </div>
      </div>

      {/* About Floww */}
      <div className="pt-4">
        <p className="text-xs font-semibold ios-text-secondary uppercase tracking-wider mb-2 px-1">
          About Floww
        </p>
        <div className="ios-card overflow-hidden">
          <div className="p-5 flex flex-col items-center text-center space-y-3 border-b ios-separator">
            <Image
              src="/logo.png?v=3"
              alt="Floww Logo"
              width={80}
              height={80}
              className="rounded-[20px] shadow-sm"
              unoptimized
            />
            <div>
              <h3 className="text-[19px] font-bold ios-text-primary tracking-tight">
                Floww — AI Document Intelligence + Financial Analytics Platform
              </h3>
              <p className="text-[13px] ios-text-secondary mt-0.5">
                Version 1.0.0
              </p>
            </div>
            <p className="text-[14px] leading-relaxed ios-text-primary px-2 pt-2">
              Floww is an intelligent personal finance manager built to give you
              total clarity over your spending habits. Track expenses &amp;
              income, scan receipts and bank statements with AI, set budgets,
              and get personalised insights through Agent Floww — your always-on
              AI financial assistant.
            </p>
          </div>

          <div className="divide-y ios-separator">
            {/* Legal Links */}
            <Link
              href="/privacy"
              className="flex items-center justify-between px-5 py-4 active:bg-[#F2F2F7] dark:active:bg-[#2C2C2E] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-ios-blue/10 dark:bg-ios-blue-dark/20 flex items-center justify-center text-ios-blue dark:text-ios-blue-dark">
                  <Shield size={16} strokeWidth={2.5} />
                </div>
                <p className="text-[15px] ios-text-primary font-medium">
                  Privacy Policy
                </p>
              </div>
            </Link>

            <Link
              href="/terms"
              className="flex items-center justify-between px-5 py-4 active:bg-[#F2F2F7] dark:active:bg-[#2C2C2E] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-ios-blue/10 dark:bg-ios-blue-dark/20 flex items-center justify-center text-ios-blue dark:text-ios-blue-dark">
                  <FileText size={16} strokeWidth={2.5} />
                </div>
                <p className="text-[15px] ios-text-primary font-medium">
                  Terms of Service
                </p>
              </div>
            </Link>

            {/* Contact Support */}
            <a
              href="mailto:sreerajar40@gmail.com"
              className="flex items-center justify-between px-5 py-4 active:bg-[#F2F2F7] dark:active:bg-[#2C2C2E] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-ios-blue/10 dark:bg-ios-blue-dark/20 flex items-center justify-center text-ios-blue dark:text-ios-blue-dark">
                  <Mail size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[15px] ios-text-primary font-medium">
                    Contact Support
                  </p>
                  <p className="text-[13px] ios-text-secondary group-hover:text-ios-blue transition-colors">
                    sreerajar40@gmail.com
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 flex justify-center">
          <div className="w-5 h-5 border-2 border-ios-blue border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
