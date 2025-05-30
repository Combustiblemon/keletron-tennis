/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-lonely-if */
import { initializeApp } from 'firebase/app';
// import { onMessage } from 'firebase/messaging';
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
  // eslint-disable-next-line no-console
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );

  self.registration.showNotification(
    payload.notification?.title || payload.data?.title || '',
    {
      body: payload.notification?.body || payload.data?.body,
      icon: '/icons/ball-tennis.svg',
      tag: payload.notification?.body || payload.data?.body,
      data: {
        ...payload.data,
      },
    }
  );
});

const websiteURL =
  process.env.WEBSITE_URL || 'https://keletrontennisacademy.com';

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // eslint-disable-next-line no-console
  console.log('notification clicked', { data: event.notification.data });

  switch (event.notification.data?.type) {
    case 'new':
    case 'update':
      self.clients.openWindow(
        `${websiteURL}/admin?reservationId=${event.notification.data?.reservationId}&datetime=${event.notification.data?.datetime}`
      );
      break;
    case 'delete':
      self.clients.openWindow(
        `${websiteURL}/admin?datetime=${event.notification.data?.datetime}`
      );
      break;
    default:
      self.clients.openWindow(websiteURL);
      break;
  }
});
