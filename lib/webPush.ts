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

import { endpoints } from './api/utils';

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';

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
    async saveToken() {
      if (!messaging) {
        return;
      }

      const res = await endpoints.notifications.PUT(
        await getToken(messaging, { vapidKey: VAPID_KEY })
      );

      if (!res?.success) {
        await this.deleteToken();
        await this.init();

        const res2 = await endpoints.notifications.PUT(
          await getToken(messaging, { vapidKey: VAPID_KEY })
        );

        if (!res2?.success) {
          notifications.show({
            message: 'Failed to save notification token',
            color: 'red',
          });
        }
      }
    },
  };
};

export const firebaseCloudMessaging = firebaseCloudMessagingBuilder();
