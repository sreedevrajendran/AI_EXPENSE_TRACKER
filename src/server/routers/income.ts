import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { DEFAULT_CATEGORY_METAS } from "./category";
import { getActivePeriodRange } from "./expense";
import { learnTransactions } from "@/lib/ml/transactionClassifier";

export const incomeRouter = router({
    list: protectedProcedure
        .input(
            z.object({
                startDate: z.date().optional(),
                endDate: z.date().optional(),
                limit: z.number().min(1).max(2500).default(1000),
                cursor: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const snapshot = await ctx.db.collection("incomes").where("userId", "==", userId).get();
            let incomes = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

            if (input?.startDate) {
                const startMs = input.startDate.getTime();
                incomes = incomes.filter(i => new Date(i.date).getTime() >= startMs);
            }
            if (input?.endDate) {
                const endMs = input.endDate.getTime();
                incomes = incomes.filter(i => new Date(i.date).getTime() <= endMs);
            }

            incomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (input?.limit) {
                incomes = incomes.slice(0, input.limit);
            }

            const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
            const categories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            return incomes.map(inc => ({
                ...inc,
                date: new Date(inc.date),
                category: inc.categoryId ? categories.find(c => c.id === inc.categoryId) : null
            }));
        }),

    getMonthTotal: protectedProcedure
        .input(z.object({ allTime: z.boolean().optional() }).nullish())
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const snapshot = await ctx.db.collection("incomes").where("userId", "==", userId).get();
            const incomes = snapshot.docs.map(d => d.data());

            if (input?.allTime) {
                return incomes.reduce((sum, doc) => sum + (doc.amount || 0), 0);
            }

            const period = await getActivePeriodRange(ctx.db, userId);
            const startMs = new Date(period.startDate).getTime();
            const endMs = period.endDate ? new Date(period.endDate).getTime() : Infinity;

            const filtered = incomes.filter(inc => {
                const t = new Date(inc.date).getTime();
                return t >= startMs && t <= endMs;
            });

            const total = filtered.reduce((sum, doc) => sum + (doc.amount || 0), 0);
            if (total === 0) {
                return incomes.reduce((sum, doc) => sum + (doc.amount || 0), 0);
            }
            return total;
        }),

    getRecentIncomes: protectedProcedure
        .input(z.object({ limit: z.number().default(5) }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const snapshot = await ctx.db.collection("incomes").where("userId", "==", userId).get();

            let incomes = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            incomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            incomes = incomes.slice(0, input.limit);

            const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
            const categories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            return incomes.map(inc => ({
                ...inc,
                date: new Date(inc.date),
                category: inc.categoryId ? categories.find(c => c.id === inc.categoryId) : null
            }));
        }),

    create: protectedProcedure
        .input(
            z.object({
                amount: z.number().positive(),
                source: z.string().min(1),
                note: z.string().optional(),
                date: z.date().default(() => new Date()),
                categoryId: z.string().optional(),
                receiptUrl: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const newDoc = {
                ...input,
                date: input.date.toISOString(),
                userId: ctx.session.user.id!,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const cleanDoc = Object.fromEntries(Object.entries(newDoc).filter(([_, v]) => v !== undefined));
            const added = await ctx.db.collection("incomes").add(cleanDoc);
            return { id: added.id, ...newDoc };
        }),

    bulkCreate: protectedProcedure
        .input(
            z.array(
                z.object({
                    amount: z.number().positive(),
                    source: z.string().min(1),
                    note: z.string().optional(),
                    date: z.date().default(() => new Date()),
                    categoryId: z.string().optional(),
                    categoryName: z.string().optional(),
                    receiptUrl: z.string().optional(),
                    icon: z.string().optional(),
                    importBatchId: z.string().optional(),
                })
            )
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;

            // Fetch user's categories to resolve categoryName
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
                    let categoryId: string | null = rest.categoryId || null;

                    if (!categoryId && categoryName) {
                        const exactMatch = categoryMap.get(categoryName.toLowerCase().trim());
                        if (exactMatch) {
                            categoryId = exactMatch;
                        } else {
                            const catLower = categoryName.toLowerCase().trim();
                            for (const [cName, cId] of categoryMap.entries()) {
                                if (catLower.includes(cName) || cName.includes(catLower)) {
                                    categoryId = cId;
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

                    const docRef = ctx.db.collection("incomes").doc();
                    const data = {
                        ...rest,
                        categoryId,
                        date: rest.date.toISOString(),
                        userId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    batch.set(docRef, data);
                    created.push({ id: docRef.id, ...data });
                }

                await batch.commit();
            }

            // Track batch metadata for undo / redo capability
            if (detectedBatchId) {
                try {
                    await ctx.db.collection("import_batches").doc(detectedBatchId).set({
                        id: detectedBatchId,
                        userId,
                        incomeCount: created.length,
                        type: "STATEMENT",
                        createdAt: new Date().toISOString(),
                    }, { merge: true });
                } catch (bErr) {
                    console.error("Batch tracking error:", bErr);
                }
            }

            try {
                learnTransactions(input.map(item => ({
                    source: item.source,
                    categoryName: item.categoryName || "UPI Transfer",
                    type: "INCOME",
                    amount: item.amount,
                })));
            } catch (mlErr) {
                console.error("ML learning error for incomes:", mlErr);
            }

            return created;
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                amount: z.number().positive().optional(),
                source: z.string().min(1).optional(),
                note: z.string().optional(),
                date: z.date().optional(),
                categoryId: z.string().optional(),
                receiptUrl: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, date, ...data } = input;
            const docRef = ctx.db.collection("incomes").doc(id);
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
            const docRef = ctx.db.collection("incomes").doc(input.id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.session.user.id!) {
                throw new Error("Not authorized");
            }
            await docRef.delete();
            return { success: true };
        }),
});
