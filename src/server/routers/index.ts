import { router } from "../trpc";
import { expenseRouter } from "./expense";
import { categoryRouter } from "./category";
import { budgetRouter } from "./budget";
import { aiRouter } from "./ai";
import { incomeRouter } from "./income";
import { gmailRouter } from "./gmail";

export const appRouter = router({
    expense: expenseRouter,
    income: incomeRouter,
    category: categoryRouter,
    budget: budgetRouter,
    ai: aiRouter,
    gmail: gmailRouter,
});

export type AppRouter = typeof appRouter;
