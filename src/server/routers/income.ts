import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const incomeRouter = router({
    list: protectedProcedure
        .input(
            z.object({
                startDate: z.date().optional(),
                endDate: z.date().optional(),
                limit: z.number().min(1).max(100).default(50),
                cursor: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;

            let query = ctx.db.collection("incomes").where("userId", "==", userId);

            if (input?.startDate) {
                query = query.where("date", ">=", input.startDate.toISOString());
            }
            if (input?.endDate) {
                query = query.where("date", "<=", input.endDate.toISOString());
            }

            // Firestore pagination requires a document snapshot as cursor.
            // For simplicity in this migration, we fetch and slice, or just return limit.
            // Since this is for a personal app, fetch up to 200 and slice is acceptable, 
            // but let's just use limit for now.
            query = query.orderBy("date", "desc").limit(input?.limit ?? 50);

            const snapshot = await query.get();
            const incomes = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

            // Fetch categories to populate relation
            const catSnapshot = await ctx.db.collection("categories").where("userId", "==", userId).get();
            const categories = catSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Parse dates back to Date objects for the UI
            return incomes.map(inc => ({
                ...inc,
                date: new Date(inc.date),
                category: inc.categoryId ? categories.find(c => c.id === inc.categoryId) : null
            }));
        }),

    getMonthTotal: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const snapshot = await ctx.db.collection("incomes")
            .where("userId", "==", userId)
            .where("date", ">=", startOfMonth.toISOString())
            .get();

        return snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    }),

    getRecentIncomes: protectedProcedure
        .input(z.object({ limit: z.number().default(5) }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const snapshot = await ctx.db.collection("incomes")
                .where("userId", "==", userId)
                .orderBy("date", "desc")
                .limit(input.limit)
                .get();

            const incomes = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

            // Fetch categories
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
            const added = await ctx.db.collection("incomes").add(newDoc);
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
                    receiptUrl: z.string().optional(),
                    icon: z.string().optional(),
                })
            )
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const batch = ctx.db.batch();

            const created = input.map(item => {
                const docRef = ctx.db.collection("incomes").doc();
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

            await docRef.update(updateData);
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
