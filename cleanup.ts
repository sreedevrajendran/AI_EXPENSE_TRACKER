import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    console.log("Cleaning up duplicate categories...");
    const categories = await db.category.findMany({
        orderBy: { createdAt: "asc" },
    });

    const seen = new Set<string>();
    const toDelete: string[] = [];

    for (const cat of categories) {
        const key = `${cat.userId}-${cat.name}`;
        if (seen.has(key)) {
            toDelete.push(cat.id);
        } else {
            seen.add(key);
        }
    }

    if (toDelete.length > 0) {
        await db.expense.updateMany({
            where: { categoryId: { in: toDelete } },
            data: { categoryId: null },
        });

        const res = await db.category.deleteMany({
            where: { id: { in: toDelete } },
        });
        console.log(`Deleted ${res.count} duplicate categories.`);
    } else {
        console.log("No duplicates found.");
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
