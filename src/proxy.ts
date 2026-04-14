import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

const isOrgSelectionRoute = createRouteMatcher(["/org-selection(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();

  // Allow public routes (sign-in, sign-up)
  if (isPublicRoute(req)) {
    // If user is already signed in, redirect away from auth pages
    if (userId) {
      const home = new URL("/", req.url);
      return NextResponse.redirect(home);
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to /sign-in
  if (!userId) {
    const signIn = new URL("/sign-in", req.url);
    return NextResponse.redirect(signIn);
  }

  // Allow org selection page for authenticated users
  if (isOrgSelectionRoute(req)) {
    return NextResponse.next();
  }

  // For all other protected routes, ensure org is selected
  if (!orgId) {
    const orgSelection = new URL("/org-selection", req.url);
    return NextResponse.redirect(orgSelection);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};