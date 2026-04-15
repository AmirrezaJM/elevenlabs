import { 
  baseProcedure, 
  createTRPCRouter
} from '../init';
export const appRouter = createTRPCRouter({
  health: baseProcedure.query(async () => {
    // Uncomment to demo Suspense loading state:
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Uncomment to demo ErrorBoundary:
    // throw new Error("Something went wrong!");

    return { status: "ok", code: 123 };
  }),
});
// export type definition of API
export type AppRouter = typeof appRouter;


// query -> API get request
// mutation -> API post/put/delete request 

// clientSide -> useTRPC() / useSuspenceQuery(trpc.health.queryOptions())
// on serverSide make sure you do prefetch(trpc.health.queryOptions())
//  const greeting = await trpc.hello()
// and put the client-side component to <HydrateClient>
// finally use <Suspense> to make loading of API requests.(server side)