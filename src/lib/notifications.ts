"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export interface FlowwNotification {
    id: number;
    title: string;
    body: string;
    scenario: "midday_nudge" | "evening_wrapup" | "inactivity_24h" | "budget_threshold" | "weekend_review" | "manual_test" | "statement_download";
    timestamp: number;
}

const NOTIFICATION_CHANNEL_ID = "floww_reminders";

/**
 * Initializes notification channels and requests permissions across Web & Native Android
 */
export async function requestNotificationPermission(): Promise<boolean> {
    try {
        if (Capacitor.isNativePlatform()) {
            // Android 13+ Notification Channel & Permission
            await LocalNotifications.createChannel({
                id: NOTIFICATION_CHANNEL_ID,
                name: "Floww Reminders & Insights",
                description: "Proactive reminders for expenses, statements, and budget limits",
                importance: 4, // High importance (heads-up notification)
                visibility: 1,
                vibration: true,
            });

            const status = await LocalNotifications.requestPermissions();
            return status.display === "granted";
        } else if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") return true;
            if (Notification.permission !== "denied") {
                const res = await Notification.requestPermission();
                return res === "granted";
            }
        }
    } catch (e) {
        console.error("Failed to request notification permission:", e);
    }
    return false;
}

/**
 * Check if notifications are currently permitted
 */
export async function checkNotificationPermission(): Promise<boolean> {
    try {
        if (Capacitor.isNativePlatform()) {
            const status = await LocalNotifications.checkPermissions();
            return status.display === "granted";
        } else if (typeof window !== "undefined" && "Notification" in window) {
            return Notification.permission === "granted";
        }
    } catch {
        return false;
    }
    return false;
}

/**
 * Sends a notification immediately to the user across Native Android and Web
 */
export async function sendNotification(notification: {
    id?: number;
    title: string;
    body: string;
    scenario?: FlowwNotification["scenario"];
}): Promise<boolean> {
    const id = notification.id || Math.floor(Date.now() % 100000);
    const scenario = notification.scenario || "midday_nudge";
    const title = notification.title;
    const body = notification.body;

    // 1. Always dispatch in-app event so active UI displays dynamic notification
    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent("floww_in_app_notification", {
                detail: { id, title, body, scenario, timestamp: Date.now() },
            })
        );

        // Record in local notification history
        try {
            const existing = JSON.parse(localStorage.getItem("floww_notification_history") || "[]");
            existing.unshift({ id, title, body, scenario, timestamp: Date.now() });
            localStorage.setItem("floww_notification_history", JSON.stringify(existing.slice(0, 30)));
            localStorage.setItem("floww_last_notification_time", String(Date.now()));
            localStorage.setItem(`floww_last_${scenario}_time`, String(Date.now()));
        } catch {
            // Ignore localStorage parse errors
        }
    }

    // 2. Native Android Local Notification
    if (Capacitor.isNativePlatform()) {
        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        id,
                        title,
                        body,
                        channelId: NOTIFICATION_CHANNEL_ID,
                        smallIcon: "ic_stat_floww",
                        largeIcon: "ic_launcher_large",
                        iconColor: "#007AFF",
                    },
                ],
            });
            return true;
        } catch (androidErr) {
            console.error("Android local notification schedule failed:", androidErr);
        }
    }

    // 3. Web Notification API (Desktop, PWA, Android Chrome)
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
            new Notification(title, {
                body,
                icon: "/logo.png",
                badge: "/icons/icon-72x72.png",
                tag: scenario,
            });
            return true;
        } catch (webErr) {
            console.warn("Web notification trigger failed:", webErr);
        }
    }

    return true;
}

/**
 * Multi-scenario notification evaluation engine
 * Checks recent activity, time of day, and budget thresholds to trigger relevant notifications.
 */
export async function evaluateNotificationTriggers({
    userName,
    expenses = [],
    incomes = [],
    budgets = [],
    force = false,
}: {
    userName?: string | null;
    expenses?: any[];
    incomes?: any[];
    budgets?: any[];
    force?: boolean;
}) {
    if (typeof window === "undefined") return;

    // Check if reminders are enabled in settings
    const remindersEnabled = localStorage.getItem("floww_reminders_enabled") !== "false";
    if (!remindersEnabled && !force) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday
    const firstName = (userName || "there").split(" ")[0] || "there";

    // Determine transactions logged today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
    const expensesToday = expenses.filter(e => new Date(e.date).getTime() >= startOfToday);
    const incomesToday = incomes.filter(i => new Date(i.date).getTime() >= startOfToday);
    const hasTransactionsToday = expensesToday.length > 0 || incomesToday.length > 0;

    // Cooldown checks: don't notify more than once every 3.5 hours unless forced
    const lastNotifTime = parseInt(localStorage.getItem("floww_last_notification_time") || "0", 10);
    const hoursSinceLastNotif = (Date.now() - lastNotifTime) / (1000 * 60 * 60);

    if (!force && hoursSinceLastNotif < 3.5) {
        return;
    }

    // Scenario 1: Mid-day expense check-in (12:30 PM - 4:00 PM)
    if (currentHour >= 12 && currentHour < 16 && !hasTransactionsToday) {
        const lastMidday = parseInt(localStorage.getItem("floww_last_midday_nudge_time") || "0", 10);
        const hoursSinceMidday = (Date.now() - lastMidday) / (1000 * 60 * 60);
        if (hoursSinceMidday >= 18 || force) {
            await sendNotification({
                title: "Mid-day Check-in ☕",
                body: `Hi ${firstName}, you haven't recorded any expenses today yet! Did you grab lunch, coffee, or pay a bill? Take 5 seconds to log it.`,
                scenario: "midday_nudge",
            });
            return;
        }
    }

    // Scenario 2: Evening wrap-up & receipt reminder (7:30 PM - 10:30 PM)
    if (currentHour >= 19 && currentHour <= 22 && !hasTransactionsToday) {
        const lastEvening = parseInt(localStorage.getItem("floww_last_evening_wrapup_time") || "0", 10);
        const hoursSinceEvening = (Date.now() - lastEvening) / (1000 * 60 * 60);
        if (hoursSinceEvening >= 18 || force) {
            await sendNotification({
                title: "Daily Ledger Wrap-up 🌙",
                body: `Hey ${firstName}, wrap up your day with clean accounts! Snap a quick photo of your receipts or ask Agent Floww to log today's spends.`,
                scenario: "evening_wrapup",
            });
            return;
        }
    }

    // Scenario 3: Over-budget threshold alert
    if (budgets && budgets.length > 0) {
        for (const b of budgets) {
            if (b.amount > 0 && b.spent >= b.amount * 0.85) {
                const pct = Math.round((b.spent / b.amount) * 100);
                const categoryName = b.category?.name || "General";
                const lastBudgetNotifKey = `floww_last_budget_alert_${b.id}`;
                const lastBudgetNotif = parseInt(localStorage.getItem(lastBudgetNotifKey) || "0", 10);
                const daysSince = (Date.now() - lastBudgetNotif) / (1000 * 60 * 60 * 24);

                if (daysSince >= 2 || force) {
                    localStorage.setItem(lastBudgetNotifKey, String(Date.now()));
                    await sendNotification({
                        title: `Budget Limit Warning (${categoryName}) ⚠️`,
                        body: `Heads up ${firstName}! Your ${categoryName} budget has reached ${pct}% of its limit. Stay on track for the month!`,
                        scenario: "budget_threshold",
                    });
                    return;
                }
            }
        }
    }

    // Scenario 4: Inactivity Nudge (> 28 hours since any recorded transaction)
    const allDates = [...expenses.map(e => new Date(e.date).getTime()), ...incomes.map(i => new Date(i.date).getTime())];
    const latestTxTime = allDates.length > 0 ? Math.max(...allDates) : 0;
    const hoursSinceTx = latestTxTime > 0 ? (Date.now() - latestTxTime) / (1000 * 60 * 60) : 0;

    if (hoursSinceTx >= 28 && currentHour >= 10 && currentHour <= 20) {
        const lastInactivity = parseInt(localStorage.getItem("floww_last_inactivity_24h_time") || "0", 10);
        const hoursSinceLastInactivity = (Date.now() - lastInactivity) / (1000 * 60 * 60);
        if (hoursSinceLastInactivity >= 24 || force) {
            await sendNotification({
                title: "Keep your ledger on track 📊",
                body: `Hi ${firstName}, it's been over a day since your last record. Consistent daily tracking prevents surprises at the end of the month!`,
                scenario: "inactivity_24h",
            });
            return;
        }
    }

    // Scenario 5: Weekend Financial Snapshot (Saturday / Sunday 9 AM - 12 PM)
    if ((currentDay === 0 || currentDay === 6) && currentHour >= 9 && currentHour < 12) {
        const lastWeekend = parseInt(localStorage.getItem("floww_last_weekend_review_time") || "0", 10);
        const daysSinceWeekend = (Date.now() - lastWeekend) / (1000 * 60 * 60 * 24);
        if (daysSinceWeekend >= 4 || force) {
            await sendNotification({
                title: "Weekend Financial Snapshot 📈",
                body: `Good morning ${firstName}! Your week-to-date spending analysis is ready. Take a quick look to see how you're tracking towards your goals.`,
                scenario: "weekend_review",
            });
            return;
        }
    }
}
