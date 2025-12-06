import { authMiddleware } from '@clerk/nextjs';

// This middleware protects routes and redirects unauthenticated users
export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    '/', // Homepage (shows different content based on auth)
    '/sign-in(.*)', // Sign-in page and subpaths
    '/sign-up(.*)', // Sign-up page and subpaths
    '/api/public(.*)', // Public API routes if any
  ],
  // Routes that are always accessible, even if not signed in
  ignoredRoutes: [
    '/api/webhooks(.*)', // Webhook routes
    '/_next(.*)', // Next.js internal routes
    '/favicon.ico',
    '/public(.*)', // Public assets
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
