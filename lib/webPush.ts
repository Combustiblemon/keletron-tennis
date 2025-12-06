/* eslint-disable no-new */
import { notifications } from '@mantine/notifications';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  deleteToken as deleteFCMToken,
  getMessaging,
  getToken,
  isSupported,
  Messaging,
  onMessage,
  Unsubscribe,
} from 'firebase/messaging';

/**
 * Firebase Cloud Messaging (FCM) configuration
 *
 * FCM is used for push notifications in the app.
 * With Clerk authentication, tokens are automatically sent with authenticated requests.
 */

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const firebaseConfig = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}'
);

const firebaseCloudMessagingBuilder = () => {
  let firebaseapp: FirebaseApp | null = null;
  let messaging: Messaging | null = null;
  let stopListening: Unsubscribe | undefined;

  return {
    // initializing firebase app
    async init(): Promise<string | null> {
      if (!(await isSupported())) {
        return null;
      }

      // requesting notification permission from browser
      const status = await Notification.requestPermission();

      if (status && status === 'denied') {
        return null;
      }

      if (!firebaseapp) {
        firebaseapp = initializeApp(firebaseConfig);
      }

      if (!messaging) {
        messaging = getMessaging(firebaseapp);
      }

      try {
        if (status && status === 'granted') {
          // getting token from FCM
          const FCMToken = await getToken(messaging, { vapidKey: VAPID_KEY });

          if (FCMToken) {
            stopListening = onMessage(messaging, (payload) => {
              // eslint-disable-next-line no-console
              console.log('firebase message received.', payload);

              const title =
                payload.data?.title ||
                payload.notification?.title ||
                'empty notification';

              navigator.serviceWorker
                .getRegistrations()
                .then((registrations) => {
                  registrations[0].showNotification(title, {
                    body: payload.data?.body || payload.notification?.body,
                    icon: '/icons/ball-tennis.svg',
                    tag: payload.notification?.body || payload.data?.body,
                    data: {
                      ...payload.data,
                    },
                  });
                });
            });

            return FCMToken;
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }

      return null;
    },
    isInitialized(): boolean {
      return !!messaging;
    },
    deleteToken(): Promise<boolean> {
      return messaging
        ? (async (): Promise<boolean> => {
            stopListening?.();
            deleteFCMToken(messaging);

            return true;
          })()
        : Promise.resolve(false);
    },
    async getToken() {
      if (!messaging) {
        return undefined;
      }

      return getToken(messaging, { vapidKey: VAPID_KEY });
    },
    /**
     * Save FCM token to backend
     *
     * This function is called by UserProvider after user authentication.
     * The UserProvider uses the hook-based API client which automatically
     * includes Clerk authentication tokens.
     *
     * @deprecated Use the saveToken method from UserProvider instead
     */
    async saveToken() {
      // This method is deprecated and no longer used directly.
      // Token saving is now handled in UserProvider using the authenticated
      // API client (useApiClient hook) which includes Clerk JWT tokens.
      //
      // See: components/UserProvider/UserProvider.tsx
      //   - Calls: api.notifications.PUT(fcmToken)
      //   - Automatically authenticated via Clerk

      console.warn(
        'webPush.saveToken() is deprecated. Token saving is handled in UserProvider.'
      );
    },
  };
};

export const firebaseCloudMessaging = firebaseCloudMessagingBuilder();
