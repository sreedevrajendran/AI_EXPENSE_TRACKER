import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
// Define local PaymentMethod enum since Prisma is removed
const PaymentMethod = {
    CASH: "CASH",
    CREDIT_CARD: "CREDIT_CARD",
    DEBIT_CARD: "DEBIT_CARD",
    UPI: "UPI",
    NET_BANKING: "NET_BANKING",
    BANK_TRANSFER: "BANK_TRANSFER",
    OTHER: "OTHER"
} as const;

export const expenseRouter = router({
    list: protectedProcedure
        .input(
            z.object({
                categoryId: z.string().optional(),
                paymentMethod: z.nativeEnum(PaymentMethod).optional(),
                startDate: z.date().optional(),
                endDate: z.date().optional(),
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            let query = ctx.db.collection("expenses").where("userId", "==", userId);

            if (input?.categoryId) {
                query = query.where("categoryId", "==", input.categoryId);
            }
            if (input?.paymentMethod) {
                query = query.where("paymentMethod", "==", input.paymentMethod);
            }
            if (input?.startDate) {
                query = query.where("date", ">=", input.startDate.toISOString());
            }
            if (input?.endDate) {
                query = query.where("date", "<=", input.endDate.toISOString());
            }

            query = query.orderBy("date", "desc").limit(input?.limit ?? 50);

            const snapshot = await query.get();
            const expenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

            // Fetch categories to populate relation
            const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
            const categories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            return expenses.map(exp => ({
                ...exp,
                date: new Date(exp.date),
                category: exp.categoryId ? categories.find(c => c.id === exp.categoryId) : null
            }));
        }),

    getMonthTotal: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const snapshot = await ctx.db.collection("expenses")
            .where("userId", "==", userId)
            .where("date", ">=", startOfMonth.toISOString())
            .get();
        return snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    }),

    getRecentExpenses: protectedProcedure
        .input(z.object({ limit: z.number().default(5) }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const snapshot = await ctx.db.collection("expenses")
                .where("userId", "==", userId)
                .orderBy("date", "desc")
                .limit(input.limit)
                .get();

            const expenses = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
            const categories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            return expenses.map(exp => ({
                ...exp,
                date: new Date(exp.date),
                category: exp.categoryId ? categories.find(c => c.id === exp.categoryId) : null
            }));
        }),

    getMonthlyChartData: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const snapshot = await ctx.db.collection("expenses")
            .where("userId", "==", userId)
            .where("date", ">=", startOfMonth.toISOString())
            .get();

        const expenses = snapshot.docs.map(d => ({ amount: d.data().amount, date: new Date(d.data().date) }));
        const dailyTotals = Array.from({ length: now.getDate() }, (_, i) => ({
            day: i + 1,
            amount: 0,
        }));

        expenses.forEach((e) => {
            const day = e.date.getDate();
            if (day <= now.getDate()) {
                dailyTotals[day - 1].amount += e.amount;
            }
        });

        return dailyTotals;
    }),

    getCategoryChartData: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const snapshot = await ctx.db.collection("expenses")
            .where("userId", "==", userId)
            .where("date", ">=", startOfMonth.toISOString())
            .get();

        const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
        const categories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        const categorySums: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.categoryId) {
                categorySums[data.categoryId] = (categorySums[data.categoryId] || 0) + (data.amount || 0);
            }
        });

        const result = Object.entries(categorySums).map(([categoryId, amount]) => {
            const cat = categories.find(c => c.id === categoryId);
            return {
                categoryId,
                name: cat?.name ?? "Other",
                color: cat?.color ?? "#8E8E93",
                amount,
            };
        }).sort((a, b) => b.amount - a.amount);

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

            const added = await ctx.db.collection("expenses").add(newDoc);

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
            const batch = ctx.db.batch();

            const created = input.map(item => {
                const docRef = ctx.db.collection("expenses").doc();
                const data = {
                    ...item,
                    date: item.date.toISOString(),
                    userId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                batch.set(docRef, data);
                return { id: docRef.id, ...data };
            });

            await batch.commit();
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
                })
            )
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;

            const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
            const userCategories = catSnapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
            const categoryMap = new Map(userCategories.map(c => [c.name.toLowerCase().trim(), c.id]));

            const batch = ctx.db.batch();
            const created = input.map(item => {
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
                return data;
            });

            await batch.commit();
            return { count: created.length };
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
            const { items, categoryName, ...expenseData } = input;
            const totalAmount = items.reduce((sum, i) => sum + i.price, 0);

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

            const added = await ctx.db.collection("expenses").add(newDoc);
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

            await docRef.update(updateData);
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
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const today = now.getDate();

        const snapshot = await ctx.db.collection("expenses")
            .where("userId", "==", userId)
            .where("date", ">=", startOfMonth.toISOString())
            .get();

        const dayMap: Record<number, number> = {};
        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const day = new Date(data.date).getDate();
            dayMap[day] = (dayMap[day] ?? 0) + (data.amount || 0);
        });

        return Array.from({ length: today }, (_, i) => ({
            day: i + 1,
            label: `${i + 1}`,
            amount: dayMap[i + 1] ?? 0,
        }));
    }),

    getYearlyIncomeExpenseChart: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

        const expSnapshot = await ctx.db.collection("expenses")
            .where("userId", "==", userId)
            .where("date", ">=", startOfYear)
            .get();

        const incSnapshot = await ctx.db.collection("incomes")
            .where("userId", "==", userId)
            .where("date", ">=", startOfYear)
            .get();

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: months[i]!,
            income: 0,
            expense: 0,
            sortOrder: i,
        }));

        expSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const monthIndex = new Date(data.date).getMonth();
            monthlyData[monthIndex]!.expense += (data.amount || 0);
        });

        incSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const monthIndex = new Date(data.date).getMonth();
            monthlyData[monthIndex]!.income += (data.amount || 0);
        });

        return monthlyData;
    }),
});
