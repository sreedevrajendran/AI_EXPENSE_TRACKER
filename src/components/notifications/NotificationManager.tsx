"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/client";
import { evaluateNotificationTriggers, FlowwNotification, requestNotificationPermission } from "@/lib/notifications";
import { showMatchingAlert } from "@/components/ui/AlertCard";

import { appStorage } from "@/lib/storage";

export function NotificationManager() {
    const { data: session, status } = useSession();
    const isAuthed = status === "authenticated";

    const { data: expenses } = trpc.expense.list.useQuery(
        { limit: 100 },
        { staleTime: 60000, enabled: isAuthed }
    );
    const { data: incomes } = trpc.income.list.useQuery(
        { limit: 100 },
        { staleTime: 60000, enabled: isAuthed }
    );
    const { data: budgets } = trpc.budget.list.useQuery(
        undefined,
        { staleTime: 60000, enabled: isAuthed }
    );

    // Request permissions on first visit if not yet requested
    useEffect(() => {
        appStorage.getItem("floww_notification_prompted").then((hasPrompted) => {
            if (!hasPrompted) {
                // Delay slightly after mount so user is immersed in app
                const timer = setTimeout(() => {
                    requestNotificationPermission().catch(() => {});
                    appStorage.setItem("floww_notification_prompted", "true");
                }, 3000);
                return () => clearTimeout(timer);
            }
        });
    }, []);

    // Periodic evaluation of notification scenarios
    useEffect(() => {
        if (!expenses) return;

        const runEvaluation = () => {
            evaluateNotificationTriggers({
                userName: session?.user?.name,
                expenses,
                incomes: incomes || [],
                budgets: budgets || [],
            });
        };

        // Run after 2 seconds on mount
        const initialTimer = setTimeout(runEvaluation, 2000);

        // Run every 20 minutes while app is open
        const interval = setInterval(runEvaluation, 20 * 60 * 1000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [expenses, incomes, budgets, session?.user?.name]);

    // Listen for custom in-app notification events and display clean industry-standard toast
    useEffect(() => {
        const handleInAppNotif = (e: Event) => {
            const customEvent = e as CustomEvent<FlowwNotification>;
            if (customEvent.detail) {
                const notif = customEvent.detail;
                showMatchingAlert({
                    type: notif.scenario === "budget_threshold" ? "budget" : "general",
                    status: notif.scenario === "budget_threshold" ? "error" : "info",
                    title: notif.title,
                    message: notif.body,
                    duration: 3500,
                });
            }
        };

        window.addEventListener("floww_in_app_notification", handleInAppNotif);
        return () => window.removeEventListener("floww_in_app_notification", handleInAppNotif);
    }, []);

    return null;
}

