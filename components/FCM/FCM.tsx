import { useEffect } from 'react';

import { isIOS } from '@/lib/common';
import { firebaseCloudMessaging } from '@/lib/webPush';

import { useUser } from '../UserProvider/UserProvider';

/**
 * FCM (Firebase Cloud Messaging) Component
 *
 * Initializes push notifications when user is authenticated.
 *
 * Integration with Clerk:
 * - Waits for user authentication before initializing
 * - Token is saved to backend via UserProvider (with Clerk auth)
 * - Token is deleted on logout via logout() function
 *
 * Flow:
 * 1. User signs in (Clerk)
 * 2. FCM component detects authentication
 * 3. Requests notification permission
 * 4. Gets FCM token from Firebase
 * 5. UserProvider sends token to backend (with Clerk JWT)
 * 6. Backend associates token with user
 *
 * Note: iOS doesn't support PWA push notifications
 */
const FCM = () => {
  const { isAuthenticated } = useUser();

  useEffect(() => {
    (async () => {
      // Skip FCM initialization on iOS (not supported) or if not authenticated
      if (isIOS() || !isAuthenticated) {
        return;
      }

      // Initialize FCM and get token
      const token = await firebaseCloudMessaging.init();

      if (token) {
        // Token is automatically sent to backend by UserProvider
        // via api.notifications.PUT(fcmToken) with Clerk authentication
        // eslint-disable-next-line no-console
        console.log('FCM initialized successfully');
      }
    })();
  }, [isAuthenticated]);

  // This component doesn't render anything
  return null;
};

export default FCM;
