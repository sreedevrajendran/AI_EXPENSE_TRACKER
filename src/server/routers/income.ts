import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { DEFAULT_CATEGORY_METAS } from "./category";
import { getActivePeriodRange } from "./expense";
import { learnTransactions } from "@/lib/ml/transactionClassifier";
import { sanitizeString, sanitizeAmount } from "@/lib/sanitize";

export const incomeRouter = router({
    byId: protectedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
            const doc = await ctx.db.collection("incomes").doc(input.id).get();
            if (!doc.exists) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Income record not found.",
                });
            }
            const data = doc.data();
            if (data?.userId !== ctx.session.user.id) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access forbidden: you do not own this income record.",
                });
            }
            return { id: doc.id, ...data };
        }),
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

            incomes.sort((a, b) => {
                const timeA = new Date(a.date).getTime();
                const timeB = new Date(b.date).getTime();
                if (timeA !== timeB) return timeB - timeA;
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            });
            if (input?.limit) {
                incomes = incomes.slice(0, input.limit);
            }

            const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
            const categories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            return incomes.map(inc => ({
                ...inc,
                date: new Date(inc.date),
                createdAt: inc.createdAt ? new Date(inc.createdAt) : undefined,
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
            incomes.sort((a, b) => {
                const timeA = new Date(a.createdAt || a.date).getTime();
                const timeB = new Date(b.createdAt || b.date).getTime();
                return timeB - timeA;
            });
            incomes = incomes.slice(0, input.limit);

            const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
            const categories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            return incomes.map(inc => ({
                ...inc,
                date: new Date(inc.date),
                createdAt: inc.createdAt ? new Date(inc.createdAt) : undefined,
                category: inc.categoryId ? categories.find(c => c.id === inc.categoryId) : null
            }));
        }),

    create: protectedProcedure
        .input(
            z.object({
                amount: z.number().positive().max(100_000_000),
                source: z.string().trim().min(1).max(255),
                note: z.string().max(1000).optional(),
                date: z.date().default(() => new Date()),
                categoryId: z.string().optional(),
                receiptUrl: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const cleanSource = sanitizeString(input.source, 255);
            const cleanNote = input.note ? sanitizeString(input.note, 1000) : undefined;
            const validAmount = sanitizeAmount(input.amount);

            const newDoc = {
                ...input,
                source: cleanSource,
                note: cleanNote,
                amount: validAmount,
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
                    amount: z.number().positive().max(100_000_000),
                    source: z.string().trim().min(1).max(255),
                    note: z.string().max(1000).optional(),
                    date: z.date().default(() => new Date()),
                    categoryId: z.string().optional(),
                    categoryName: z.string().max(100).optional(),
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
                        const cleanCatName = sanitizeString(categoryName, 100);
                        const exactMatch = categoryMap.get(cleanCatName.toLowerCase().trim());
                        if (exactMatch) {
                            categoryId = exactMatch;
                        } else {
                            const catLower = cleanCatName.toLowerCase().trim();
                            for (const [cName, cId] of categoryMap.entries()) {
                                if (catLower.includes(cName) || cName.includes(catLower)) {
                                    categoryId = cId;
                                    break;
                                }
                            }
                        }

                        if (!categoryId) {
                            const catRef = ctx.db.collection("categories").doc();
                            const meta = DEFAULT_CATEGORY_METAS[cleanCatName] || { icon: "circle", color: "#8E8E93" };
                            const catData = {
                                name: cleanCatName,
                                icon: meta.icon,
                                color: meta.color,
                                userId,
                                parentId: null,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            };
                            await catRef.set(catData);
                            categoryId = catRef.id;
                            categoryMap.set(cleanCatName.toLowerCase().trim(), categoryId);
                        }
                    }

                    const docRef = ctx.db.collection("incomes").doc();
                    const sanitizedSource = sanitizeString(rest.source, 255);
                    const sanitizedNote = rest.note ? sanitizeString(rest.note, 1000) : undefined;
                    const sanitizedAmt = sanitizeAmount(rest.amount);

                    const data = {
                        ...rest,
                        source: sanitizedSource,
                        note: sanitizedNote,
                        amount: sanitizedAmt,
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
                    source: sanitizeString(item.source, 255),
                    categoryName: item.categoryName ? sanitizeString(item.categoryName, 100) : "UPI Transfer",
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
                id: z.string().min(1),
                amount: z.number().positive().max(100_000_000).optional(),
                source: z.string().trim().min(1).max(255).optional(),
                note: z.string().max(1000).optional(),
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
            if (!doc.exists) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Income record not found.",
                });
            }
            if (doc.data()?.userId !== ctx.session.user.id) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access forbidden: you do not have permission to modify this record.",
                });
            }

            const updateData: any = { ...data, updatedAt: new Date().toISOString() };
            if (updateData.source) updateData.source = sanitizeString(updateData.source, 255);
            if (updateData.note) updateData.note = sanitizeString(updateData.note, 1000);
            if (date) updateData.date = date.toISOString();

            const cleanUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined));
            await docRef.update(cleanUpdateData);
            return { id, ...doc.data(), ...updateData };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            const docRef = ctx.db.collection("incomes").doc(input.id);
            const doc = await docRef.get();
            if (!doc.exists) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Income record not found.",
                });
            }
            if (doc.data()?.userId !== ctx.session.user.id) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Access forbidden: you do not have permission to delete this record.",
                });
            }
            await docRef.delete();
            return { success: true };
        }),
});
