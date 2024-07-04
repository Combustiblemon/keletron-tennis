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
import { Session } from 'next-auth';

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';

const firebaseConfig = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}'
);

const firebaseCloudMessagingBuilder = () => {
  let firebaseapp: FirebaseApp | null = null;
  let messaging: Messaging | null = null;

  const saveToken = async (token: string, session?: Session) => {
    if (session?.user?._id) {
      // save FCM token to user in DB
    }
  };

  const deleteTokenFromIndexedDB = async (token: string): Promise<void> => {
    await db.tokens.delete(token);
  };

  return {
    // initializing firebase app
    async init(session?: Session): Promise<string | null> {
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

            let title = payload.data?.title || '';

            navigator.serviceWorker.getRegistrations().then((registrations) => {
              registrations[0].showNotification(title, {
                body: payload.data?.body,
              });
            });
          });

          if (FCMToken) {
            // return the FCM token after saving it
            saveToken(FCMToken, session);

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
    async getToken() {
      if (messaging) {
        return getToken(messaging, { vapidKey: VAPID_KEY });
      }
    },
    async saveToken(session: Session) {
      if (!messaging) {
        return;
      }

      await saveToken(
        await getToken(messaging, { vapidKey: VAPID_KEY }),
        session
      );
    },
  };
};

export const firebaseCloudMessaging = firebaseCloudMessagingBuilder();
