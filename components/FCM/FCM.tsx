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

      // Check if FCM is already initialized (e.g., by UserProvider)
      if (firebaseCloudMessaging.isInitialized()) {
        // eslint-disable-next-line no-console
        console.log('FCM already initialized');
        return;
      }

      // Initialize FCM and get token
      // Note: Token registration to backend is handled by UserProvider
      // This ensures it works for all roles (USER, ADMIN, DEVELOPER)
      const token = await firebaseCloudMessaging.init();

      if (token) {
        // Token registration to backend is handled by UserProvider
        // which will detect the token and send it via api.notifications.PUT()
        // eslint-disable-next-line no-console
        console.log(
          'FCM initialized successfully, token will be registered by UserProvider'
        );
      }
    })();
  }, [isAuthenticated]);

  // This component doesn't render anything
  return null;
};

export default FCM;
