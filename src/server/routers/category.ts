import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { DEFAULT_CATEGORY_METAS } from "@/lib/categories";

export { DEFAULT_CATEGORY_METAS };

async function ensureCategories(db: any, userId: string): Promise<any[]> {
    try {
        const snapshot = await db.collection("categories").where("userId", "==", userId).get();
        if (!snapshot.empty) {
            const docs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
            const hasGroceries = docs.some((d: any) => d.name?.toLowerCase() === "groceries");
            const hasTransport = docs.some((d: any) => d.name?.toLowerCase() === "transport");
            
            if (!hasGroceries || !hasTransport) {
                const missingToSeed: any[] = [];
                if (!hasGroceries) missingToSeed.push({ name: "Groceries", ...DEFAULT_CATEGORY_METAS["Groceries"] });
                if (!hasTransport) missingToSeed.push({ name: "Transport", ...DEFAULT_CATEGORY_METAS["Transport"] });
                try {
                    const batch = db.batch();
                    for (const m of missingToSeed) {
                        const newRef = db.collection("categories").doc();
                        const data = { ...m, userId, parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                        batch.set(newRef, data);
                        docs.push({ id: newRef.id, ...data });
                    }
                    await batch.commit();
                } catch {
                    // Fallback: append in-memory
                    missingToSeed.forEach((m, idx) => {
                        docs.push({ id: `temp-${m.name.toLowerCase()}-${idx}`, ...m, userId, parentId: null });
                    });
                }
            }
            return docs;
        }

        // Empty category collection -> auto-seed all defaults
        const defaults = Object.entries(DEFAULT_CATEGORY_METAS).map(([name, meta]) => ({
            name,
            icon: meta.icon,
            color: meta.color,
            userId,
            parentId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }));

        try {
            const batch = db.batch();
            const seededDocs: any[] = [];
            for (const d of defaults) {
                const ref = db.collection("categories").doc();
                batch.set(ref, d);
                seededDocs.push({ id: ref.id, ...d });
            }
            await batch.commit();
            return seededDocs;
        } catch {
            return defaults.map((d, i) => ({ id: `default-cat-${i}`, ...d }));
        }
    } catch {
        return Object.entries(DEFAULT_CATEGORY_METAS).map(([name, meta], i) => ({
            id: `default-cat-${i}`,
            name,
            icon: meta.icon,
            color: meta.color,
            userId,
            parentId: null,
        }));
    }
}

export const categoryRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        const allDocs = await ensureCategories(ctx.db, ctx.session.user.id!);
        allDocs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        const parents = allDocs.filter(c => !c.parentId);

        return parents.map((parent: any) => ({
            ...parent,
            children: allDocs.filter(child => child.parentId === parent.id),
        }));
    }),

    listAll: protectedProcedure.query(async ({ ctx }) => {
        const allDocs = await ensureCategories(ctx.db, ctx.session.user.id!);
        allDocs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        return allDocs.map(doc => ({
            ...doc,
            children: allDocs.filter(child => child.parentId === doc.id),
            parent: doc.parentId ? allDocs.find((p: any) => p.id === doc.parentId) || null : null,
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
