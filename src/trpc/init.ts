import { auth } from '@clerk/nextjs/server';
import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import superjson from 'superjson';
export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return {};
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
// baseProcedure is a public procedure everyone can access it and everyone can query it
export const baseProcedure = t.procedure;

export const authProcedure = t.procedure.use(async ({next}) => {
    const {userId} = await auth();
    
    if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: {userId}
    });
})

export const orgProcedure = t.procedure.use(async ({next}) => {
  const {userId,orgId} = await auth();
  if (!userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if(!orgId) {
    throw new TRPCError({code:"FORBIDDEN", message: "Organization not found"})
  }
  return next({
    ctx: {userId,orgId}
  })
})
    