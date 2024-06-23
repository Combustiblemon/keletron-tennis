/* eslint-disable no-new */
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  deleteToken as deleteFCMToken,
  getMessaging,
  getToken,
  Messaging,
  onMessage,
} from 'firebase/messaging';

import { db } from './indexDBUtils';

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';

const firebaseConfig = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}'
);

const firebaseCloudMessagingBuilder = () => {
  let firebaseapp: FirebaseApp | null = null;

  let messaging: Messaging | null = null;
  const isTokenInIndexedDB = async (token: string): Promise<boolean> => {
    const tokenRecord = await db.tokens.get(token);

    return tokenRecord !== undefined;
  };

  const saveTokenToIndexedDB = async (token: string) => {
    const email = localStorage.getItem('email') || 'unregistered';

    if (await isTokenInIndexedDB(token)) {
      await db.tokens.update(token, { email, FCMToken: token });
    } else {
      await db.tokens.put({ email, FCMToken: token });
    }
  };

  const deleteTokenFromIndexedDB = async (token: string): Promise<void> => {
    await db.tokens.delete(token);
  };

  return {
    // initializing firebase app
    async init(): Promise<string | null> {
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

          onMessage(messaging, (payload) => {
            console.log('firebase message received. ', payload);

            navigator.serviceWorker.getRegistrations().then((registrations) => {
              registrations[0].showNotification('test', {
                body: 'test body',
              });
            });
          });

          if (FCMToken) {
            // return the FCM token after saving it
            saveTokenToIndexedDB(FCMToken);
            console.log('FCM Token: ', FCMToken);
            return FCMToken;
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }

      return null;
    },

    deleteToken(): Promise<boolean> {
      return messaging
        ? (async (): Promise<boolean> => {
            const FCMToken = await getToken(messaging);

            deleteTokenFromIndexedDB(FCMToken);
            deleteFCMToken(messaging);

            return true;
          })()
        : Promise.resolve(false);
    },
  };
};

export const firebaseCloudMessaging = firebaseCloudMessagingBuilder();
