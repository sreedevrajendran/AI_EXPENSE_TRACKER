import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/firebase/admin";

export const createTRPCContext = async () => {
    const session = await getServerSession(authOptions);
    return {
        session,
        db,
    };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
    transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
        ctx: {
            ...ctx,
            session: { ...ctx.session, user: ctx.session.user },
        },
    });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
