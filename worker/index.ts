/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-lonely-if */
import { initializeApp } from 'firebase/app';
// import { onMessage } from 'firebase/messaging';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

import { CLERK_PERIODIC_GET_TOKEN_MESSAGE } from '../lib/clerkSwRefresh';

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

/** Ping open tabs so the main thread can call Clerk `getToken()` (SW cannot). */
function broadcastClerkTokenRefresh() {
  self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({ type: CLERK_PERIODIC_GET_TOKEN_MESSAGE });
      });
    });
}

/** While the messaging SW is alive, nudge Clerk refresh on an interval. */
const CLERK_TOKEN_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
setInterval(broadcastClerkTokenRefresh, CLERK_TOKEN_REFRESH_INTERVAL_MS);

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      broadcastClerkTokenRefresh();
    })
  );
});

const websiteURL =
  process.env.WEBSITE_URL || 'https://keletrontennisacademy.com';

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // eslint-disable-next-line no-console
  console.log('notification clicked', { data: event.notification.data });

  const { data } = event.notification;
  let url = websiteURL;

  // API sends reservationid (lowercase); admin page expects reservationId in query
  const reservationId = data?.reservationId ?? data?.reservationid ?? '';

  switch (data?.type) {
    case 'new':
    case 'update':
      url = `${websiteURL}/admin-legacy?reservationId=${reservationId}&datetime=${data?.datetime ?? ''}`;
      break;
    case 'delete':
      url = `${websiteURL}/admin-legacy?datetime=${data?.datetime ?? ''}`;
      break;
    default:
      break;
  }

  event.waitUntil(self.clients.openWindow(url));
});
