import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const DEFAULT_CATEGORY_METAS: Record<string, { icon: string; color: string }> = {
    "Food & Dining": { icon: "utensils", color: "#FF9F0A" },
    "Transport": { icon: "car", color: "#007AFF" },
    "Shopping": { icon: "shopping-bag", color: "#FF2D55" },
    "Entertainment": { icon: "film", color: "#5856D6" },
    "Health": { icon: "heart-pulse", color: "#34C759" },
    "Bills & Utilities": { icon: "zap", color: "#FF6B00" },
    "Travel": { icon: "plane", color: "#5AC8FA" },
    "Groceries": { icon: "shopping-cart", color: "#30D158" },
    "Education": { icon: "book-open", color: "#BF5AF2" },
    "Salary": { icon: "briefcase", color: "#30D158" },
    "UPI Transfer": { icon: "arrow-left-right", color: "#5E5CE6" },
    "Transfers": { icon: "repeat", color: "#0A84FF" },
    "Cashback & Rewards": { icon: "gift", color: "#FFD60A" },
    "Interest & Dividends": { icon: "trending-up", color: "#34C759" },
    "Refunds": { icon: "rotate-ccw", color: "#64D2FF" },
    "Investments": { icon: "bar-chart-2", color: "#AF52DE" },
    "Other": { icon: "circle", color: "#8E8E93" },
};

export const categoryRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const allSnapshot = await ctx.db.collection("categories")
            .where("userId", "==", ctx.session.user.id!)
            .get();
        const allDocs = allSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        allDocs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        const parents = allDocs.filter(c => !c.parentId);

        return parents.map((parent: any) => ({
            ...parent,
            children: allDocs.filter(child => child.parentId === parent.id),
        }));
    }),

    listAll: protectedProcedure.query(async ({ ctx }) => {
        const snapshot = await ctx.db.collection("categories")
            .where("userId", "==", ctx.session.user.id!)
            .get();

        const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        allDocs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        return allDocs.map(doc => ({
            ...doc,
            children: allDocs.filter(child => child.parentId === doc.id),
            parent: doc.parentId ? allDocs.find(p => p.id === doc.parentId) || null : null,
        }));
    }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                icon: z.string().default("circle"),
                color: z.string().default("#007AFF"),
                parentId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const categoriesRef = ctx.db.collection("categories");

            // Note: Firestore doesn't provide case-insensitive search easily. 
            // We fetch all by User ID and check manually to enforce uniqueness.
            const snapshot = await categoriesRef.where("userId", "==", userId).get();
            const existing = snapshot.docs.find(d => d.data().name.toLowerCase() === input.name.toLowerCase());

            if (existing) {
                return { id: existing.id, ...existing.data() };
            }

            const newDoc = {
                ...input,
                userId,
                parentId: input.parentId || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const added = await categoriesRef.add(newDoc);
            return { id: added.id, ...newDoc };
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().optional(),
                icon: z.string().optional(),
                color: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            const docRef = ctx.db.collection("categories").doc(id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.session.user.id!) {
                throw new Error("Not authorized");
            }

            await docRef.update({ ...data, updatedAt: new Date().toISOString() });
            return { id, ...doc.data(), ...data };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const docRef = ctx.db.collection("categories").doc(input.id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.session.user.id!) {
                throw new Error("Not authorized");
            }
            await docRef.delete();
            return { success: true };
        }),

    seedDefaults: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const defaults = Object.entries(DEFAULT_CATEGORY_METAS).map(([name, meta]) => ({
            name,
            icon: meta.icon,
            color: meta.color,
        }));

        const batch = ctx.db.batch();
        let seededCount = 0;
        const categoriesRef = ctx.db.collection("categories");

        const existingSnapshot = await categoriesRef.where("userId", "==", userId).get();
        const existingNames = new Set(existingSnapshot.docs.map(d => d.data().name));

        for (const d of defaults) {
            if (!existingNames.has(d.name)) {
                const newRef = categoriesRef.doc();
                batch.set(newRef, {
                    ...d,
                    userId,
                    parentId: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
                seededCount++;
            }
        }

        if (seededCount > 0) {
            await batch.commit();
        }
        return { seeded: seededCount };
    }),
});
