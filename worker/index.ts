/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-lonely-if */
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// eslint-disable-next-line import/no-anonymous-default-export
export default null;
declare let self: ServiceWorkerGlobalScope;
// To disable all workbox logging during development, you can set self.__WB_DISABLE_DEV_LOGS to true
// https://developers.google.com/web/tools/workbox/guides/configure-workbox#disable_logging
//
// self.__WB_DISABLE_DEV_LOGS = true
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).__WB_DISABLE_DEV_LOGS = true;

const firebaseConfig = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}'
);

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );

  if (payload.data?.notification) {
    // Customize notification here
    const notificationTitle =
      payload.data.notification?.title || 'Background Message Title';
    const notificationOptions = {
      body: payload.data.notification?.body || 'Background Message body.',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});
