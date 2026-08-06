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
 *
 * Two entry points:
 * - `init()`  — silent auto path (UserProvider). Never prompts; only proceeds
 *   when notification permission is already granted.
 * - `enable()` — user-gesture path (burger menu, settings page). Prompts for
 *   permission, then obtains a token.
 *
 * iOS: Web Push (Safari 16.4+) only works in a PWA added to the Home Screen;
 * both paths bail in a normal Safari tab without prompting.
 */

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';

const firebaseConfig = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}'
);

/**
 * Scope of the registration the firebase SDK creates when getToken() is called
 * without an explicit serviceWorkerRegistration. Older app versions relied on
 * that default, leaving devices with two registrations of the same script.
 */
const LEGACY_FCM_SCOPE = 'firebase-cloud-messaging-push-scope';

const SW_READY_TIMEOUT_MS = 10_000;

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

/**
 * Sync-only environment gate. MUST stay free of awaits: `enable()` relies on
 * `Notification.requestPermission()` being the first await after a user
 * gesture, or WebKit drops the transient activation and never shows a prompt.
 */
function canUseWebPush(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof Notification !== 'undefined' &&
    'serviceWorker' in navigator &&
    isIOSWebPushEligible()
  );
}

const firebaseCloudMessagingBuilder = () => {
  let firebaseapp: FirebaseApp | null = null;
  let messaging: Messaging | null = null;
  let registration: ServiceWorkerRegistration | null = null;
  let stopListening: Unsubscribe | undefined;
  let currentToken: string | null = null;
  let pending: Promise<string | null> | null = null;

  /**
   * Migration: unregister the duplicate registration the firebase SDK created
   * at LEGACY_FCM_SCOPE on already-installed devices. Its push subscription
   * dies with it; the server prunes the dead token on the next send.
   */
  const cleanupLegacyRegistrations = async (): Promise<void> => {
    const registrations = await navigator.serviceWorker.getRegistrations();

    await Promise.all(
      registrations
        .filter((r) => r.scope.includes(LEGACY_FCM_SCOPE))
        .map((r) => r.unregister().catch(() => false))
    );
  };

  const getRootRegistration = async (): Promise<ServiceWorkerRegistration> => {
    if (registration) {
      return registration;
    }

    // next-pwa registers public/firebase-messaging-sw.js at scope '/'.
    // `ready` pends forever if that registration failed, hence the timeout.
    registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Timed out waiting for service worker')),
          SW_READY_TIMEOUT_MS
        );
      }),
    ]);

    return registration;
  };

  const attachForegroundHandler = (
    msg: Messaging,
    swRegistration: ServiceWorkerRegistration
  ): void => {
    stopListening?.();

    stopListening = onMessage(msg, (payload) => {
      // eslint-disable-next-line no-console
      console.log('firebase message received.', payload);

      const title =
        payload.data?.title ||
        payload.notification?.title ||
        'empty notification';

      swRegistration.showNotification(title, {
        body: payload.data?.body || payload.notification?.body,
        icon: '/icons/ball-tennis.svg',
        tag: payload.notification?.body || payload.data?.body,
        data: {
          ...payload.data,
        },
      });
    });
  };

  /** Permission is already granted when this runs. */
  const obtainToken = async (): Promise<string | null> => {
    if (!(await isSupported())) {
      return null;
    }

    if (!firebaseapp) {
      firebaseapp = initializeApp(firebaseConfig);
    }

    if (!messaging) {
      messaging = getMessaging(firebaseapp);
    }

    await cleanupLegacyRegistrations();

    const swRegistration = await getRootRegistration();

    const FCMToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!FCMToken) {
      return null;
    }

    attachForegroundHandler(messaging, swRegistration);
    currentToken = FCMToken;

    return FCMToken;
  };

  /** Single-flight: concurrent callers share one token fetch. */
  const obtainTokenOnce = (): Promise<string | null> => {
    if (!pending) {
      pending = obtainToken()
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(error);

          return null;
        })
        .finally(() => {
          pending = null;
        });
    }

    return pending;
  };

  return {
    /**
     * Silent auto path. Never prompts: only proceeds when notification
     * permission is already granted. Safe to call from effects and queries.
     */
    async init(): Promise<string | null> {
      if (!canUseWebPush()) {
        return null;
      }

      if (Notification.permission !== 'granted') {
        return null;
      }

      if (currentToken) {
        return currentToken;
      }

      return obtainTokenOnce();
    },

    /**
     * User-gesture path: prompts for permission, then obtains a token.
     * `Notification.requestPermission()` MUST stay the first await — any
     * earlier await loses WebKit's transient activation and iOS never prompts.
     */
    async enable(): Promise<string | null> {
      if (!canUseWebPush()) {
        return null;
      }

      const status = await Notification.requestPermission();

      if (status !== 'granted') {
        return null;
      }

      if (currentToken) {
        return currentToken;
      }

      return obtainTokenOnce();
    },

    hasToken(): boolean {
      return currentToken !== null;
    },

    getPermission(): NotificationPermission | 'unsupported' {
      if (!canUseWebPush()) {
        return 'unsupported';
      }

      return Notification.permission;
    },

    async getToken(): Promise<string | undefined> {
      if (currentToken) {
        return currentToken;
      }

      // firebase's getToken() prompts on 'default' permission — hard-guard it
      // so this accessor can never trigger a permission dialog.
      if (
        !messaging ||
        !canUseWebPush() ||
        Notification.permission !== 'granted'
      ) {
        return undefined;
      }

      return getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: await getRootRegistration(),
      });
    },

    async deleteToken(): Promise<boolean> {
      if (!messaging) {
        return false;
      }

      stopListening?.();
      stopListening = undefined;

      try {
        await deleteFCMToken(messaging);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);

        return false;
      }

      currentToken = null;

      return true;
    },
  };
};

export const firebaseCloudMessaging = firebaseCloudMessagingBuilder();
