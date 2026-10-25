import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { DEFAULT_CATEGORY_METAS } from "./category";
import { learnTransactions } from "@/lib/ml/transactionClassifier";
// Define local PaymentMethod enum since Prisma is removed
const PaymentMethod = {
    CASH: "CASH",
    CARD: "CARD",
    CREDIT_CARD: "CREDIT_CARD",
    DEBIT_CARD: "DEBIT_CARD",
    UPI: "UPI",
    NET_BANKING: "NET_BANKING",
    BANK_TRANSFER: "BANK_TRANSFER",
    OTHER: "OTHER"
} as const;

export async function getActivePeriodRange(db: any, userId: string) {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentStartIso = currentStart.toISOString();

    // Query user expenses & incomes using default single-field index (userId)
    const expSnap = await db.collection("expenses").where("userId", "==", userId).get();
    const incSnap = await db.collection("incomes").where("userId", "==", userId).get();

    const expDates = expSnap.docs.map((d: any) => d.data().date ? new Date(d.data().date) : null).filter(Boolean) as Date[];
    const incDates = incSnap.docs.map((d: any) => d.data().date ? new Date(d.data().date) : null).filter(Boolean) as Date[];
    const allDates = [...expDates, ...incDates];

    const hasThisMonth = allDates.some(d => d >= currentStart);

    if (hasThisMonth || allDates.length === 0) {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
        return {
            isCurrentMonth: true,
            label: "This Month",
            year: now.getFullYear(),
            month: now.getMonth(),
            startDate: currentStartIso,
            endDate: currentEnd,
            daysInMonth,
            activeDayLimit: Math.min(now.getDate(), daysInMonth),
        };
    }

    // Find latest transaction date across expenses & incomes
    const latest = new Date(Math.max(...allDates.map(d => d.getTime())));
    const year = latest.getFullYear();
    const month = latest.getMonth();
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return {
        isCurrentMonth: false,
        label: `${monthNames[month]} ${year}`,
        year,
        month,
        startDate: start,
        endDate: end,
        daysInMonth,
        activeDayLimit: daysInMonth,
    };
}

export const expenseRouter = router({
    list: protectedProcedure
        .input(
            z.object({
                categoryId: z.string().optional(),
                paymentMethod: z.nativeEnum(PaymentMethod).optional(),
                startDate: z.date().optional(),
                endDate: z.date().optional(),
                limit: z.number().min(1).max(2500).default(1000),
                cursor: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const snapshot = await ctx.db.collection("expenses").where("userId", "==", userId).get();
            let expenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

            if (input?.categoryId) {
                expenses = expenses.filter(e => e.categoryId === input.categoryId);
            }
            if (input?.paymentMethod) {
                expenses = expenses.filter(e => e.paymentMethod === input.paymentMethod);
            }
            if (input?.startDate) {
                const startMs = input.startDate.getTime();
                expenses = expenses.filter(e => new Date(e.date).getTime() >= startMs);
            }
            if (input?.endDate) {
                const endMs = input.endDate.getTime();
                expenses = expenses.filter(e => new Date(e.date).getTime() <= endMs);
            }

            expenses.sort((a, b) => {
                const timeA = new Date(a.date).getTime();
                const timeB = new Date(b.date).getTime();
                if (timeA !== timeB) return timeB - timeA;
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            });
            if (input?.limit) {
                expenses = expenses.slice(0, input.limit);
            }

            const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
            const categories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            return expenses.map(exp => ({
                ...exp,
                date: new Date(exp.date),
                createdAt: exp.createdAt ? new Date(exp.createdAt) : undefined,
                category: exp.categoryId ? categories.find(c => c.id === exp.categoryId) : null
            }));
        }),

    getActivePeriod: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        return await getActivePeriodRange(ctx.db, userId);
    }),

    getMonthTotal: protectedProcedure
        .input(z.object({ allTime: z.boolean().optional() }).nullish())
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const snapshot = await ctx.db.collection("expenses").where("userId", "==", userId).get();
            const expenses = snapshot.docs.map(d => d.data());

            if (input?.allTime) {
                return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            }

            const period = await getActivePeriodRange(ctx.db, userId);
            const startMs = new Date(period.startDate).getTime();
            const endMs = period.endDate ? new Date(period.endDate).getTime() : Infinity;

            const filtered = expenses.filter(e => {
                const t = new Date(e.date).getTime();
                return t >= startMs && t <= endMs;
            });

            const total = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
            if (total === 0) {
                return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            }
            return total;
        }),

    getRecentExpenses: protectedProcedure
        .input(z.object({ limit: z.number().default(5) }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const snapshot = await ctx.db.collection("expenses").where("userId", "==", userId).get();

            let expenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            expenses.sort((a, b) => {
                const timeA = new Date(a.createdAt || a.date).getTime();
                const timeB = new Date(b.createdAt || b.date).getTime();
                return timeB - timeA;
            });
            expenses = expenses.slice(0, input.limit);

            const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
            const categories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            return expenses.map(exp => ({
                ...exp,
                date: new Date(exp.date),
                createdAt: exp.createdAt ? new Date(exp.createdAt) : undefined,
                category: exp.categoryId ? categories.find(c => c.id === exp.categoryId) : null
            }));
        }),

    getMonthlyChartData: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const period = await getActivePeriodRange(ctx.db, userId);

        const snapshot = await ctx.db.collection("expenses").where("userId", "==", userId).get();
        const startMs = new Date(period.startDate).getTime();
        const endMs = period.endDate ? new Date(period.endDate).getTime() : Infinity;

        const expenses = snapshot.docs
            .map(d => ({ amount: d.data().amount || 0, date: new Date(d.data().date) }))
            .filter(e => e.date.getTime() >= startMs && e.date.getTime() <= endMs);

        const dailyTotals = Array.from({ length: period.activeDayLimit }, (_, i) => ({
            day: i + 1,
            amount: 0,
        }));

        expenses.forEach((e) => {
            const day = e.date.getDate();
            if (day <= period.activeDayLimit) {
                dailyTotals[day - 1].amount += e.amount;
            }
        });

        return dailyTotals;
    }),

    getCategoryChartData: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const period = await getActivePeriodRange(ctx.db, userId);

        const snapshot = await ctx.db.collection("expenses").where("userId", "==", userId).get();
        const startMs = new Date(period.startDate).getTime();
        const endMs = period.endDate ? new Date(period.endDate).getTime() : Infinity;

        let filteredDocs = snapshot.docs.filter(d => {
            const t = new Date(d.data().date).getTime();
            return t >= startMs && t <= endMs;
        });

        if (filteredDocs.length === 0) {
            filteredDocs = snapshot.docs;
        }

        const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
        const userCategories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        const catById = new Map(userCategories.map(c => [c.id, c]));
        const catByName = new Map(userCategories.map(c => [c.name.toLowerCase().trim(), c]));

        // Group expenses by consolidated category name
        const categoryMap: Record<string, { categoryId: string; name: string; color: string; icon: string; amount: number }> = {};

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const amt = Math.abs(parseFloat(data.amount) || 0);
            if (amt <= 0) return;

            let matchedCat: any = null;
            if (data.categoryId && catById.has(data.categoryId)) {
                matchedCat = catById.get(data.categoryId);
            } else if (data.categoryName && catByName.has(data.categoryName.toLowerCase().trim())) {
                matchedCat = catByName.get(data.categoryName.toLowerCase().trim());
            } else if (data.category && typeof data.category === "string" && catByName.has(data.category.toLowerCase().trim())) {
                matchedCat = catByName.get(data.category.toLowerCase().trim());
            }

            const rawName = matchedCat?.name || data.categoryName || (typeof data.category === "string" ? data.category : "") || "Other";
            const name = rawName.trim() || "Other";
            const meta = DEFAULT_CATEGORY_METAS[name] || { icon: "circle", color: "#8E8E93" };
            const color = matchedCat?.color || meta.color || "#8E8E93";
            const icon = matchedCat?.icon || meta.icon || "circle";
            const catId = matchedCat?.id || data.categoryId || name;

            if (!categoryMap[name]) {
                categoryMap[name] = {
                    categoryId: catId,
                    name,
                    color,
                    icon,
                    amount: 0,
                };
            }
            categoryMap[name].amount += amt;
        });

        const result = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
        return result;
    }),

    create: protectedProcedure
        .input(
            z.object({
                amount: z.number().positive(),
                merchant: z.string().min(1),
                note: z.string().optional(),
                date: z.date().default(() => new Date()),
                paymentMethod: z.nativeEnum(PaymentMethod).default("CASH"),
                categoryId: z.string().optional(),
                categoryName: z.string().optional(),
                receiptUrl: z.string().optional(),
                icon: z.string().optional(),
                referenceId: z.string().optional(),
                invoiceNumber: z.string().optional(),
                tax: z.number().optional(),
                subtotal: z.number().optional(),
                discount: z.number().optional(),
                billStatus: z.string().optional(),
                dueDate: z.string().optional(),
                upiId: z.string().optional(),
                cardLast4: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const { categoryName, ...expenseData } = input;

            let finalCategoryId = expenseData.categoryId;
            let categoryParams = null;

            if (!finalCategoryId && categoryName) {
                const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
                const userCategories = catSnapshot.docs.map(d => ({ id: d.id, name: d.data().name }));

                const categoryMap = new Map(
                    userCategories.map(c => [c.name.toLowerCase().trim(), c.id])
                );

                const exactMatch = categoryMap.get(categoryName.toLowerCase().trim());
                if (exactMatch) {
                    finalCategoryId = exactMatch;
                } else {
                    const aiNameLower = categoryName.toLowerCase().trim();
                    for (const [catName, catId] of categoryMap.entries()) {
                        if (aiNameLower.includes(catName) || catName.includes(aiNameLower)) {
                            finalCategoryId = catId;
                            break;
                        }
                    }
                }
            }

            const newDoc = {
                ...expenseData,
                date: input.date.toISOString(),
                categoryId: finalCategoryId || null,
                userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const cleanDoc = Object.fromEntries(Object.entries(newDoc).filter(([_, v]) => v !== undefined));
            const added = await ctx.db.collection("expenses").add(cleanDoc);

            if (finalCategoryId) {
                const catDoc = await ctx.db.collection("categories").doc(finalCategoryId).get();
                categoryParams = catDoc.exists ? catDoc.data() : null;
            }

            return { id: added.id, ...newDoc, category: categoryParams };
        }),

    bulkCreate: protectedProcedure
        .input(
            z.array(
                z.object({
                    amount: z.number().positive(),
                    merchant: z.string().min(1),
                    note: z.string().optional(),
                    date: z.date().default(() => new Date()),
                    paymentMethod: z.nativeEnum(PaymentMethod).default("CASH"),
                    categoryId: z.string().optional(),
                    receiptUrl: z.string().optional(),
                    icon: z.string().optional(),
                })
            )
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const created: any[] = [];
            const BATCH_SIZE = 400;

            for (let i = 0; i < input.length; i += BATCH_SIZE) {
                const chunk = input.slice(i, i + BATCH_SIZE);
                const batch = ctx.db.batch();

                for (const item of chunk) {
                    const docRef = ctx.db.collection("expenses").doc();
                    const data = {
                        ...item,
                        date: item.date.toISOString(),
                        userId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    batch.set(docRef, data);
                    created.push({ id: docRef.id, ...data });
                }

                await batch.commit();
            }

            return { count: created.length };
        }),

    bulkCreateWithCategories: protectedProcedure
        .input(
            z.array(
                z.object({
                    amount: z.number().positive(),
                    merchant: z.string().min(1),
                    note: z.string().optional(),
                    date: z.date().default(() => new Date()),
                    paymentMethod: z.nativeEnum(PaymentMethod).default("BANK_TRANSFER"),
                    categoryName: z.string().optional(),
                    receiptUrl: z.string().optional(),
                    importBatchId: z.string().optional(),
                })
            )
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;

            const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
            const userCategories = catSnapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
            const categoryMap = new Map(userCategories.map(c => [c.name.toLowerCase().trim(), c.id]));

            const created: any[] = [];
            const BATCH_SIZE = 400;
            const detectedBatchId = input[0]?.importBatchId;

            for (let i = 0; i < input.length; i += BATCH_SIZE) {
                const chunk = input.slice(i, i + BATCH_SIZE);
                const batch = ctx.db.batch();

                for (const item of chunk) {
                    const { categoryName, ...rest } = item;
                    let categoryId: string | null = null;

                    if (categoryName) {
                        const exactMatch = categoryMap.get(categoryName.toLowerCase().trim());
                        if (exactMatch) {
                            categoryId = exactMatch;
                        } else {
                            const aiNameLower = categoryName.toLowerCase().trim();
                            for (const [catName, catId] of categoryMap.entries()) {
                                if (aiNameLower.includes(catName) || catName.includes(aiNameLower)) {
                                    categoryId = catId;
                                    break;
                                }
                            }
                        }

                        if (!categoryId) {
                            const catRef = ctx.db.collection("categories").doc();
                            const meta = DEFAULT_CATEGORY_METAS[categoryName] || { icon: "circle", color: "#8E8E93" };
                            const catData = {
                                name: categoryName,
                                icon: meta.icon,
                                color: meta.color,
                                userId,
                                parentId: null,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            };
                            await catRef.set(catData);
                            categoryId = catRef.id;
                            categoryMap.set(categoryName.toLowerCase().trim(), categoryId);
                        }
                    }

                    const docRef = ctx.db.collection("expenses").doc();
                    const data = {
                        ...rest,
                        date: rest.date.toISOString(),
                        categoryId,
                        userId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    batch.set(docRef, data);
                    created.push(data);
                }

                await batch.commit();
            }

            // Track batch metadata for undo / redo capability
            if (detectedBatchId) {
                try {
                    await ctx.db.collection("import_batches").doc(detectedBatchId).set({
                        id: detectedBatchId,
                        userId,
                        expenseCount: created.length,
                        type: "STATEMENT",
                        createdAt: new Date().toISOString(),
                    }, { merge: true });
                } catch (bErr) {
                    console.error("Batch tracking error:", bErr);
                }
            }

            // Train ML engine incrementally on newly imported transactions
            try {
                learnTransactions(input.map(item => ({
                    merchant: item.merchant,
                    categoryName: item.categoryName || "Other",
                    type: "EXPENSE",
                    amount: item.amount,
                })));
            } catch (mlErr) {
                console.error("ML learning error:", mlErr);
            }

            return { count: created.length, importBatchId: detectedBatchId };
        }),

    createWithItems: protectedProcedure
        .input(
            z.object({
                merchant: z.string().min(1),
                date: z.date().default(() => new Date()),
                paymentMethod: z.nativeEnum(PaymentMethod).default("CASH"),
                categoryId: z.string().optional(),
                categoryName: z.string().optional(),
                note: z.string().optional(),
                icon: z.string().optional(),
                totalAmount: z.number().optional(),
                referenceId: z.string().optional(),
                invoiceNumber: z.string().optional(),
                tax: z.number().optional(),
                subtotal: z.number().optional(),
                discount: z.number().optional(),
                billStatus: z.string().optional(),
                dueDate: z.string().optional(),
                upiId: z.string().optional(),
                cardLast4: z.string().optional(),
                receiptUrl: z.string().optional(),
                items: z.array(
                    z.object({
                        name: z.string().min(1),
                        quantity: z.number().positive().default(1),
                        price: z.number().positive(),
                    })
                ).min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const { items, categoryName, totalAmount: inputTotalAmount, ...expenseData } = input;
            const itemsSum = items.reduce((sum, i) => sum + i.price, 0);
            const totalAmount = (inputTotalAmount && inputTotalAmount > 0) ? inputTotalAmount : itemsSum;

            let finalCategoryId = expenseData.categoryId;
            if (!finalCategoryId && categoryName) {
                const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
                const userCategories = catSnapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
                const categoryMap = new Map(userCategories.map(c => [c.name.toLowerCase().trim(), c.id]));

                const exactMatch = categoryMap.get(categoryName.toLowerCase().trim());
                if (exactMatch) {
                    finalCategoryId = exactMatch;
                } else {
                    const aiNameLower = categoryName.toLowerCase().trim();
                    for (const [catName, catId] of categoryMap.entries()) {
                        if (aiNameLower.includes(catName) || catName.includes(aiNameLower)) {
                            finalCategoryId = catId;
                            break;
                        }
                    }
                }
            }

            const newDoc = {
                ...expenseData,
                categoryId: finalCategoryId || null,
                amount: totalAmount,
                date: input.date.toISOString(),
                userId,
                items, // Embedded documents in NoSQL!
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const cleanDoc = Object.fromEntries(Object.entries(newDoc).filter(([_, v]) => v !== undefined));
            const added = await ctx.db.collection("expenses").add(cleanDoc);

            try {
                learnTransactions(items.map(item => ({
                    description: `${expenseData.merchant} ${item.name}`,
                    categoryName: categoryName || "Food & Dining",
                    type: "EXPENSE",
                    amount: item.price,
                })));
            } catch (mlErr) {
                console.error("ML learning error:", mlErr);
            }

            return { id: added.id, ...newDoc };
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                amount: z.number().positive().optional(),
                merchant: z.string().min(1).optional(),
                note: z.string().optional(),
                date: z.date().optional(),
                paymentMethod: z.nativeEnum(PaymentMethod).optional(),
                categoryId: z.string().optional(),
                receiptUrl: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, date, ...data } = input;
            const docRef = ctx.db.collection("expenses").doc(id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.session.user.id!) {
                throw new Error("Not authorized");
            }

            const updateData: any = { ...data, updatedAt: new Date().toISOString() };
            if (date) updateData.date = date.toISOString();

            const cleanUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined));
            await docRef.update(cleanUpdateData);
            return { id, ...doc.data(), ...updateData };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const docRef = ctx.db.collection("expenses").doc(input.id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.session.user.id!) {
                throw new Error("Not authorized");
            }
            await docRef.delete();
            return { success: true };
        }),

    getDailyExpenses: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const period = await getActivePeriodRange(ctx.db, userId);

        const snapshot = await ctx.db.collection("expenses").where("userId", "==", userId).get();
        const startMs = new Date(period.startDate).getTime();
        const endMs = period.endDate ? new Date(period.endDate).getTime() : Infinity;

        const dayMap: Record<number, number> = {};
        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const d = new Date(data.date);
            const t = d.getTime();
            if (t >= startMs && t <= endMs) {
                const day = d.getDate();
                dayMap[day] = (dayMap[day] ?? 0) + (data.amount || 0);
            }
        });

        // Ensure we display all days up to activeDayLimit or the highest day with recorded expenses
        const daysWithExpenses = Object.keys(dayMap).map(Number);
        const maxDayRecorded = daysWithExpenses.length > 0 ? Math.max(...daysWithExpenses) : 0;
        const totalDaysToShow = Math.min(
            Math.max(period.activeDayLimit, maxDayRecorded, 1),
            period.daysInMonth
        );

        return Array.from({ length: totalDaysToShow }, (_, i) => ({
            day: i + 1,
            label: `${i + 1}`,
            amount: dayMap[i + 1] ?? 0,
        }));
    }),

    getYearlyIncomeExpenseChart: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();

        const expSnapshot = await ctx.db.collection("expenses").where("userId", "==", userId).get();
        const incSnapshot = await ctx.db.collection("incomes").where("userId", "==", userId).get();

        const candidateDates: number[] = [];
        expSnapshot.docs.forEach((d) => {
            if (d.data().date) candidateDates.push(new Date(d.data().date).getTime());
        });
        incSnapshot.docs.forEach((d) => {
            if (d.data().date) candidateDates.push(new Date(d.data().date).getTime());
        });

        let refDate = now;
        if (candidateDates.length > 0) {
            refDate = new Date(Math.max(...candidateDates));
        }

        const refYear = refDate.getFullYear();
        const refMonth = refDate.getMonth();

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData: Array<{ month: string; income: number; expense: number; year: number; monthIndex: number }> = [];

        for (let i = 11; i >= 0; i--) {
            const d = new Date(refYear, refMonth - i, 1);
            monthlyData.push({
                month: months[d.getMonth()]!,
                income: 0,
                expense: 0,
                year: d.getFullYear(),
                monthIndex: d.getMonth(),
            });
        }

        expSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const d = new Date(data.date);
            const m = monthlyData.find(item => item.year === d.getFullYear() && item.monthIndex === d.getMonth());
            if (m) m.expense += (data.amount || 0);
        });

        incSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const d = new Date(data.date);
            const m = monthlyData.find(item => item.year === d.getFullYear() && item.monthIndex === d.getMonth());
            if (m) m.income += (data.amount || 0);
        });

        return monthlyData.map(({ month, income, expense }) => ({ month, income, expense }));
    }),

    getLastImportInfo: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;

        // 1. Check for latest import batch record
        const batchesSnap = await ctx.db.collection("import_batches")
            .where("userId", "==", userId)
            .get();

        let batchDoc: any = null;
        if (!batchesSnap.empty) {
            const sortedBatches = batchesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            sortedBatches.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            batchDoc = sortedBatches[0];
        }

        if (batchDoc) {
            return {
                hasBatch: true,
                batchId: batchDoc.id,
                createdAt: batchDoc.createdAt,
                expenseCount: batchDoc.expenseCount || 0,
                incomeCount: batchDoc.incomeCount || 0,
                totalCount: (batchDoc.expenseCount || 0) + (batchDoc.incomeCount || 0),
                filename: batchDoc.filename || "Bank Statement PDF",
            };
        }

        // 2. Fallback: inspect total transactions count
        const [expSnap, incSnap] = await Promise.all([
            ctx.db.collection("expenses").where("userId", "==", userId).get(),
            ctx.db.collection("incomes").where("userId", "==", userId).get(),
        ]);

        return {
            hasBatch: false,
            batchId: null,
            createdAt: null,
            expenseCount: expSnap.size,
            incomeCount: incSnap.size,
            totalCount: expSnap.size + incSnap.size,
            filename: "Imported Transactions",
        };
    }),

    rollbackLastImport: protectedProcedure
        .input(z.object({ batchId: z.string().optional() }).optional())
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            let deletedExpenses = 0;
            let deletedIncomes = 0;

            let targetBatchId = input?.batchId;
            if (!targetBatchId) {
                const batchSnap = await ctx.db.collection("import_batches")
                    .where("userId", "==", userId)
                    .get();
                if (!batchSnap.empty) {
                    const sortedBatches = batchSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                    sortedBatches.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                    targetBatchId = sortedBatches[0].id;
                }
            }

            if (targetBatchId) {
                // Delete expenses belonging to this batch
                const expSnap = await ctx.db.collection("expenses")
                    .where("userId", "==", userId)
                    .where("importBatchId", "==", targetBatchId)
                    .get();

                const batch1 = ctx.db.batch();
                expSnap.docs.forEach(doc => batch1.delete(doc.ref));
                await batch1.commit();
                deletedExpenses = expSnap.size;

                // Delete incomes belonging to this batch
                const incSnap = await ctx.db.collection("incomes")
                    .where("userId", "==", userId)
                    .where("importBatchId", "==", targetBatchId)
                    .get();

                const batch2 = ctx.db.batch();
                incSnap.docs.forEach(doc => batch2.delete(doc.ref));
                await batch2.commit();
                deletedIncomes = incSnap.size;

                // Remove the batch record
                await ctx.db.collection("import_batches").doc(targetBatchId).delete();
            } else {
                // If transactions were imported without a batchId (e.g. earlier import),
                // delete all expenses and incomes to allow a clean redo
                const [expSnap, incSnap] = await Promise.all([
                    ctx.db.collection("expenses").where("userId", "==", userId).get(),
                    ctx.db.collection("incomes").where("userId", "==", userId).get(),
                ]);

                const batch1 = ctx.db.batch();
                expSnap.docs.forEach(doc => batch1.delete(doc.ref));
                await batch1.commit();
                deletedExpenses = expSnap.size;

                const batch2 = ctx.db.batch();
                incSnap.docs.forEach(doc => batch2.delete(doc.ref));
                await batch2.commit();
                deletedIncomes = incSnap.size;
            }

            return {
                deletedExpenses,
                deletedIncomes,
                totalDeleted: deletedExpenses + deletedIncomes,
            };
        }),

    clearAllTransactions: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const [expSnap, incSnap] = await Promise.all([
            ctx.db.collection("expenses").where("userId", "==", userId).get(),
            ctx.db.collection("incomes").where("userId", "==", userId).get(),
        ]);

        const batch1 = ctx.db.batch();
        expSnap.docs.forEach(doc => batch1.delete(doc.ref));
        await batch1.commit();

        const batch2 = ctx.db.batch();
        incSnap.docs.forEach(doc => batch2.delete(doc.ref));
        await batch2.commit();

        // Also clean any import batch records
        const batchesSnap = await ctx.db.collection("import_batches").where("userId", "==", userId).get();
        if (!batchesSnap.empty) {
            const batch3 = ctx.db.batch();
            batchesSnap.docs.forEach(doc => batch3.delete(doc.ref));
            await batch3.commit();
        }

        return {
            deletedExpenses: expSnap.size,
            deletedIncomes: incSnap.size,
            totalDeleted: expSnap.size + incSnap.size,
        };
    }),

    checkStatementDuplicates: protectedProcedure
        .input(
            z.object({
                transactions: z.array(
                    z.object({
                        date: z.string().optional(),
                        description: z.string().optional(),
                        title: z.string().optional(),
                        amount: z.number(),
                        type: z.string().optional(),
                    })
                ),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            if (!input.transactions || input.transactions.length === 0) {
                return { duplicateIndices: [] as number[], duplicateCount: 0, isEntireStatementDuplicate: false, totalCount: 0 };
            }

            const [expSnap, incSnap] = await Promise.all([
                ctx.db.collection("expenses").where("userId", "==", userId).get(),
                ctx.db.collection("incomes").where("userId", "==", userId).get(),
            ]);

            const existingExpenses = expSnap.docs.map(d => d.data());
            const existingIncomes = incSnap.docs.map(d => d.data());

            const duplicateIndices: number[] = [];

            input.transactions.forEach((tx, idx) => {
                const isInc = tx.type?.toLowerCase() === "income";
                const targetPool = isInc ? existingIncomes : existingExpenses;
                const amt = Math.abs(Number(tx.amount) || 0);
                const desc = (tx.description || tx.title || "").toLowerCase().trim();
                const txDateStr = tx.date ? new Date(tx.date).toISOString().split("T")[0] : "";

                const match = targetPool.find((item: any) => {
                    const itemAmt = Math.abs(Number(item.amount) || 0);
                    if (Math.abs(itemAmt - amt) > 0.05) return false;

                    const itemDateStr = item.date ? new Date(item.date).toISOString().split("T")[0] : "";
                    const itemDesc = (isInc ? item.source : item.merchant || "").toLowerCase().trim();

                    const dateMatches = !txDateStr || !itemDateStr || txDateStr === itemDateStr;
                    if (!dateMatches) return false;

                    if (desc && itemDesc) {
                        return desc.includes(itemDesc) || itemDesc.includes(desc) || desc.slice(0, 8) === itemDesc.slice(0, 8);
                    }
                    return true;
                });

                if (match) {
                    duplicateIndices.push(idx);
                }
            });

            const duplicateCount = duplicateIndices.length;
            const totalCount = input.transactions.length;
            const isEntireStatementDuplicate = totalCount > 0 && (duplicateCount === totalCount || duplicateCount / totalCount >= 0.7);

            return {
                duplicateIndices,
                duplicateCount,
                totalCount,
                isEntireStatementDuplicate,
            };
        }),

    checkExpenseDuplicate: protectedProcedure
        .input(
            z.object({
                merchant: z.string().optional(),
                amount: z.number(),
                date: z.date().optional(),
                referenceId: z.string().optional(),
                invoiceNumber: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const amt = Math.abs(Number(input.amount) || 0);

            if (input.referenceId && input.referenceId.trim().length >= 4) {
                const snap = await ctx.db.collection("expenses")
                    .where("userId", "==", userId)
                    .where("referenceId", "==", input.referenceId.trim())
                    .limit(1)
                    .get();
                if (!snap.empty) {
                    const d = snap.docs[0].data();
                    return {
                        isDuplicate: true,
                        existing: {
                            id: snap.docs[0].id,
                            merchant: d.merchant,
                            amount: d.amount,
                            date: d.date ? new Date(d.date).toISOString().split("T")[0] : null,
                            matchReason: `Reference ID (${input.referenceId.trim()})`,
                        },
                    };
                }
            }

            if (input.invoiceNumber && input.invoiceNumber.trim().length >= 3) {
                const snap = await ctx.db.collection("expenses")
                    .where("userId", "==", userId)
                    .where("invoiceNumber", "==", input.invoiceNumber.trim())
                    .limit(1)
                    .get();
                if (!snap.empty) {
                    const d = snap.docs[0].data();
                    return {
                        isDuplicate: true,
                        existing: {
                            id: snap.docs[0].id,
                            merchant: d.merchant,
                            amount: d.amount,
                            date: d.date ? new Date(d.date).toISOString().split("T")[0] : null,
                            matchReason: `Invoice #${input.invoiceNumber.trim()}`,
                        },
                    };
                }
            }

            if (amt > 0 && input.merchant) {
                const cleanMerchant = input.merchant.trim().toLowerCase();
                const snap = await ctx.db.collection("expenses")
                    .where("userId", "==", userId)
                    .where("amount", "==", amt)
                    .limit(10)
                    .get();

                if (!snap.empty) {
                    const targetDateStr = input.date ? input.date.toISOString().split("T")[0] : "";
                    for (const doc of snap.docs) {
                        const d = doc.data();
                        const expMerchant = (d.merchant || "").trim().toLowerCase();
                        const expDateStr = d.date ? new Date(d.date).toISOString().split("T")[0] : "";

                        if (expMerchant === cleanMerchant || expMerchant.includes(cleanMerchant) || cleanMerchant.includes(expMerchant)) {
                            if (!targetDateStr || !expDateStr || targetDateStr === expDateStr) {
                                return {
                                    isDuplicate: true,
                                    existing: {
                                        id: doc.id,
                                        merchant: d.merchant,
                                        amount: d.amount,
                                        date: expDateStr,
                                        matchReason: `${d.merchant} for ₹${amt}`,
                                    },
                                };
                            }
                        }
                    }
                }
            }

            return { isDuplicate: false, existing: null };
        }),
});
