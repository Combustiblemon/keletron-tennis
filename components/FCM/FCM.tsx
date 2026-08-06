import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

import { CLERK_PERIODIC_GET_TOKEN_MESSAGE } from '@/lib/clerkSwRefresh';

import { useUser } from '../UserProvider/UserProvider';

/**
 * FCM (Firebase Cloud Messaging) Component
 *
 * Bridges service-worker pings to Clerk session refreshes.
 *
 * FCM initialization is NOT done here:
 * - Silent auto path: UserProvider's ['fcm-token'] query calls
 *   firebaseCloudMessaging.init() (only when permission already granted)
 *   and registers the token with the backend.
 * - Permission prompting: user-gesture paths only — the mobile burger menu
 *   (Navbar) and the notification settings panel (NotificationSettings).
 *
 * This component only listens for the service worker's periodic
 * CLERK_PERIODIC_GET_TOKEN_MESSAGE and touches the Clerk session so the
 * backend keeps receiving fresh tokens from open tabs.
 */
const FCM = () => {
  const { isAuthenticated } = useUser();
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return undefined;
    }

    if (!isAuthenticated || !isSignedIn) {
      return undefined;
    }

    const onSwMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string } | undefined;

      if (data?.type === CLERK_PERIODIC_GET_TOKEN_MESSAGE) {
        getToken().catch(() => {
          /* best-effort Clerk session touch from SW ping */
        });
      }
    };

    navigator.serviceWorker.addEventListener('message', onSwMessage);
    return () =>
      navigator.serviceWorker.removeEventListener('message', onSwMessage);
  }, [getToken, isAuthenticated, isSignedIn]);

  // This component doesn't render anything
  return null;
};

export default FCM;
