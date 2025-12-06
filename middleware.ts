import { authMiddleware } from '@clerk/nextjs';

/**
 * Clerk Authentication Middleware
 *
 * Protects routes server-side before they load.
 * Unauthenticated users are redirected to /sign-in.
 *
 * Protected routes: /admin, /reservations, /settings
 * Public routes: /, /sign-in, /sign-up, /auth
 */
export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    '/', // Homepage (shows different content based on auth)
    '/sign-in(.*)', // Sign-in page and subpaths
    '/sign-up(.*)', // Sign-up page and subpaths
    '/auth', // Legacy auth page (redirects to sign-in)
    '/api/public(.*)', // Public API routes if any
  ],

  // Routes that are always accessible, even if not signed in
  ignoredRoutes: [
    '/api/webhooks(.*)', // Webhook routes
    '/_next(.*)', // Next.js internal routes
    '/favicon.ico',
    '/public(.*)', // Public assets
    '/(.*\\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot))', // Static files
  ],

  // Additional configuration
  debug: false, // Set to true for debugging
});
