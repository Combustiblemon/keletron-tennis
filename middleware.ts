import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Clerk Authentication Middleware
 *
 * Protects routes server-side before they load.
 * Unauthenticated users are redirected to /sign-in.
 *
 * Protected routes: /admin, /reservations, /settings
 * Public routes: /, /sign-in, /sign-up, /auth
 */

// Define public routes that can be accessed while signed out
const isPublicRoute = createRouteMatcher([
  '/', // Homepage (shows different content based on auth)
  '/sign-in(.*)', // Sign-in page and subpaths
  '/sign-up(.*)', // Sign-up page and subpaths
  '/auth', // Legacy auth page (redirects to sign-in)
  '/api/public(.*)', // Public API routes if any
  '/api/webhooks(.*)', // Webhook routes
  '/_next(.*)', // Next.js internal routes
  '/favicon.ico',
  '/public(.*)', // Public assets
  // Note: Static files (images, CSS, JS, fonts) are already excluded by the Next.js matcher config below
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
