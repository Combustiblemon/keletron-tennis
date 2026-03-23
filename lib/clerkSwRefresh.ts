/**
 * Service worker → window: ask the app to touch Clerk so session/JWT stay fresh.
 * Handled in components/FCM/FCM.tsx; sent from worker/index.ts (FCM SW bundle).
 */
export const CLERK_PERIODIC_GET_TOKEN_MESSAGE = 'CLERK_PERIODIC_GET_TOKEN';
