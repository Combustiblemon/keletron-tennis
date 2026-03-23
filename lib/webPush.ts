/* eslint-disable no-new */
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
 *
 * iOS: Web Push (Safari 16.4+) only works in a PWA added to the Home Screen;
 * `init()` returns null in a normal Safari tab without prompting for notifications.
 */

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';

const firebaseConfig = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}'
);

/** Detect iPhone / iPod / iPad (classic UA). */
function isIOSUserAgent(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * iOS only delivers Web Push for PWAs added to Home Screen (Safari 16.4+).
 * In a normal Safari tab, requesting a push subscription fails or misleads users.
 */
function isIOSWebPushEligible(): boolean {
  if (typeof window === 'undefined' || !isIOSUserAgent()) {
    return true;
  }

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return standalone;
}

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

      if (!isIOSWebPushEligible()) {
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

      // eslint-disable-next-line no-console
      console.warn(
        'webPush.saveToken() is deprecated. Token saving is handled in UserProvider.'
      );
    },
  };
};

export const firebaseCloudMessaging = firebaseCloudMessagingBuilder();
