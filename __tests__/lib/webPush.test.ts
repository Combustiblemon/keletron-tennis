/**
 * Tests for lib/webPush.ts — the FCM token lifecycle.
 *
 * Regression targets from the 2026-08-06 notification fix:
 * - init() (silent auto path) must NEVER call Notification.requestPermission.
 * - enable() (gesture path) must call requestPermission before any other await.
 * - getToken() must never trigger a permission prompt.
 * - firebase getToken() must receive the root service worker registration.
 * - Legacy '/firebase-cloud-messaging-push-scope' registrations get unregistered.
 * - Concurrent callers share a single token fetch (single-flight).
 * - The old isInitialized() deadlock is gone: hasToken() stays false until a
 *   token actually exists.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ app: true })),
}));

vi.mock('firebase/messaging', () => ({
  deleteToken: vi.fn(async () => true),
  getMessaging: vi.fn(() => ({ messaging: true })),
  getToken: vi.fn(async () => 'fcm-token-1'),
  isSupported: vi.fn(async () => true),
  onMessage: vi.fn(() => vi.fn()),
}));

type NotificationPermissionValue = 'default' | 'granted' | 'denied';

const setNotification = (
  permission: NotificationPermissionValue,
  requestPermission = vi.fn(async () => 'granted' as NotificationPermission)
) => {
  const notification = { permission, requestPermission };

  vi.stubGlobal('Notification', notification);

  return notification;
};

const makeRegistration = (scope: string) => ({
  scope,
  unregister: vi.fn(async () => true),
  showNotification: vi.fn(async () => undefined),
});

const setServiceWorker = (overrides?: {
  ready?: Promise<unknown>;
  registrations?: Array<ReturnType<typeof makeRegistration>>;
}) => {
  const rootRegistration = makeRegistration('https://app.example.com/');
  const serviceWorker = {
    ready: overrides?.ready ?? Promise.resolve(rootRegistration),
    getRegistrations: vi.fn(async () => overrides?.registrations ?? []),
  };

  Object.defineProperty(window.navigator, 'serviceWorker', {
    configurable: true,
    value: serviceWorker,
  });

  return { rootRegistration, serviceWorker };
};

const setUserAgent = (userAgent: string) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: userAgent,
  });
};

const setMatchMedia = (matches: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches }))
  );
  window.matchMedia = globalThis.matchMedia;
};

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36';
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile/15E148 Safari/604.1';

const loadWebPush = async () => {
  const firebaseMessaging = await import('firebase/messaging');
  const firebaseApp = await import('firebase/app');
  const { firebaseCloudMessaging } = await import('@/lib/webPush');

  return {
    firebaseApp: vi.mocked(firebaseApp),
    firebaseCloudMessaging,
    firebaseMessaging: vi.mocked(firebaseMessaging),
  };
};

describe('firebaseCloudMessaging', () => {
  beforeEach(() => {
    vi.resetModules();
    setUserAgent(ANDROID_UA);
    setMatchMedia(false);
    setServiceWorker();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('init (silent auto path)', () => {
    it('never prompts when permission is default', async () => {
      const notification = setNotification('default');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      const token = await firebaseCloudMessaging.init();

      expect(token).toBeNull();
      expect(notification.requestPermission).not.toHaveBeenCalled();
      expect(firebaseMessaging.getToken).not.toHaveBeenCalled();
      expect(firebaseCloudMessaging.hasToken()).toBe(false);
    });

    it('never prompts when permission is denied', async () => {
      const notification = setNotification('denied');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      const token = await firebaseCloudMessaging.init();

      expect(token).toBeNull();
      expect(notification.requestPermission).not.toHaveBeenCalled();
      expect(firebaseMessaging.getToken).not.toHaveBeenCalled();
    });

    it('obtains a token when permission is already granted', async () => {
      setNotification('granted');
      const { rootRegistration } = setServiceWorker();
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      const token = await firebaseCloudMessaging.init();

      expect(token).toBe('fcm-token-1');
      expect(firebaseCloudMessaging.hasToken()).toBe(true);
      expect(firebaseMessaging.getToken).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ serviceWorkerRegistration: rootRegistration })
      );
    });

    it('returns the cached token without re-fetching', async () => {
      setNotification('granted');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      await firebaseCloudMessaging.init();
      const second = await firebaseCloudMessaging.init();

      expect(second).toBe('fcm-token-1');
      expect(firebaseMessaging.getToken).toHaveBeenCalledTimes(1);
    });

    it('bails on iOS Safari outside the installed PWA', async () => {
      setUserAgent(IPHONE_UA);
      setMatchMedia(false);
      const notification = setNotification('granted');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      const token = await firebaseCloudMessaging.init();

      expect(token).toBeNull();
      expect(notification.requestPermission).not.toHaveBeenCalled();
      expect(firebaseMessaging.getToken).not.toHaveBeenCalled();
    });

    it('proceeds on iOS when running as installed PWA', async () => {
      setUserAgent(IPHONE_UA);
      setMatchMedia(true);
      setNotification('granted');
      const { firebaseCloudMessaging } = await loadWebPush();

      const token = await firebaseCloudMessaging.init();

      expect(token).toBe('fcm-token-1');
    });

    it('returns null when firebase messaging is unsupported', async () => {
      setNotification('granted');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();
      firebaseMessaging.isSupported.mockResolvedValueOnce(false);

      const token = await firebaseCloudMessaging.init();

      expect(token).toBeNull();
      expect(firebaseMessaging.getToken).not.toHaveBeenCalled();
    });

    it('single-flights concurrent callers into one token fetch', async () => {
      setNotification('granted');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      const [a, b] = await Promise.all([
        firebaseCloudMessaging.init(),
        firebaseCloudMessaging.init(),
      ]);

      expect(a).toBe('fcm-token-1');
      expect(b).toBe('fcm-token-1');
      expect(firebaseMessaging.getToken).toHaveBeenCalledTimes(1);
    });

    it('unregisters legacy firebase-scope registrations but not the root one', async () => {
      setNotification('granted');
      const root = makeRegistration('https://app.example.com/');
      const legacy = makeRegistration(
        'https://app.example.com/firebase-cloud-messaging-push-scope'
      );
      setServiceWorker({
        ready: Promise.resolve(root),
        registrations: [root, legacy],
      });
      const { firebaseCloudMessaging } = await loadWebPush();

      await firebaseCloudMessaging.init();

      expect(legacy.unregister).toHaveBeenCalledTimes(1);
      expect(root.unregister).not.toHaveBeenCalled();
    });

    it('resolves null when the service worker never becomes ready', async () => {
      vi.useFakeTimers();

      try {
        setNotification('granted');
        setServiceWorker({ ready: new Promise(() => {}) });
        const { firebaseCloudMessaging, firebaseMessaging } =
          await loadWebPush();

        const pending = firebaseCloudMessaging.init();
        await vi.advanceTimersByTimeAsync(10_000);
        const token = await pending;

        expect(token).toBeNull();
        expect(firebaseMessaging.getToken).not.toHaveBeenCalled();
        expect(firebaseCloudMessaging.hasToken()).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('enable (gesture path)', () => {
    it('requests permission before any other async work', async () => {
      const order: string[] = [];
      const notification = setNotification(
        'default',
        vi.fn(async () => {
          order.push('requestPermission');
          return 'granted' as NotificationPermission;
        })
      );
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();
      firebaseMessaging.isSupported.mockImplementation(async () => {
        order.push('isSupported');
        return true;
      });

      const token = await firebaseCloudMessaging.enable();

      expect(token).toBe('fcm-token-1');
      expect(notification.requestPermission).toHaveBeenCalledTimes(1);
      expect(order[0]).toBe('requestPermission');
    });

    it('returns null without fetching a token when the user denies', async () => {
      setNotification(
        'default',
        vi.fn(async () => 'denied' as NotificationPermission)
      );
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      const token = await firebaseCloudMessaging.enable();

      expect(token).toBeNull();
      expect(firebaseMessaging.getToken).not.toHaveBeenCalled();
      expect(firebaseCloudMessaging.hasToken()).toBe(false);
    });

    it('returns null without prompting on iOS Safari outside the PWA', async () => {
      setUserAgent(IPHONE_UA);
      setMatchMedia(false);
      const notification = setNotification('default');
      const { firebaseCloudMessaging } = await loadWebPush();

      const token = await firebaseCloudMessaging.enable();

      expect(token).toBeNull();
      expect(notification.requestPermission).not.toHaveBeenCalled();
    });

    it('still works after a failed silent init (no isInitialized deadlock)', async () => {
      // Old bug: init() with a dismissed prompt set `messaging`, making
      // isInitialized() true forever and dead-ending the gesture path.
      const notification = setNotification('default');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      const silent = await firebaseCloudMessaging.init();

      expect(silent).toBeNull();
      expect(firebaseCloudMessaging.hasToken()).toBe(false);

      notification.requestPermission.mockResolvedValueOnce('granted');
      const token = await firebaseCloudMessaging.enable();

      expect(token).toBe('fcm-token-1');
      expect(firebaseMessaging.getToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('getToken accessor', () => {
    it('never prompts and returns undefined when permission is default', async () => {
      const notification = setNotification('default');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      const token = await firebaseCloudMessaging.getToken();

      expect(token).toBeUndefined();
      expect(notification.requestPermission).not.toHaveBeenCalled();
      expect(firebaseMessaging.getToken).not.toHaveBeenCalled();
    });

    it('returns the cached token after init', async () => {
      setNotification('granted');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      await firebaseCloudMessaging.init();
      firebaseMessaging.getToken.mockClear();

      const token = await firebaseCloudMessaging.getToken();

      expect(token).toBe('fcm-token-1');
      expect(firebaseMessaging.getToken).not.toHaveBeenCalled();
    });
  });

  describe('deleteToken', () => {
    it('returns false when messaging was never initialized', async () => {
      setNotification('default');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      const result = await firebaseCloudMessaging.deleteToken();

      expect(result).toBe(false);
      expect(firebaseMessaging.deleteToken).not.toHaveBeenCalled();
    });

    it('awaits firebase deletion and clears the cached token', async () => {
      setNotification('granted');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      await firebaseCloudMessaging.init();
      const result = await firebaseCloudMessaging.deleteToken();

      expect(result).toBe(true);
      expect(firebaseMessaging.deleteToken).toHaveBeenCalledTimes(1);
      expect(firebaseCloudMessaging.hasToken()).toBe(false);
    });

    it('returns false when firebase deletion rejects', async () => {
      setNotification('granted');
      const { firebaseCloudMessaging, firebaseMessaging } =
        await loadWebPush();

      await firebaseCloudMessaging.init();
      firebaseMessaging.deleteToken.mockRejectedValueOnce(
        new Error('network')
      );

      const result = await firebaseCloudMessaging.deleteToken();

      expect(result).toBe(false);
    });
  });

  describe('getPermission', () => {
    it('reports unsupported on iOS Safari outside the PWA', async () => {
      setUserAgent(IPHONE_UA);
      setMatchMedia(false);
      setNotification('granted');
      const { firebaseCloudMessaging } = await loadWebPush();

      expect(firebaseCloudMessaging.getPermission()).toBe('unsupported');
    });

    it('mirrors the Notification permission elsewhere', async () => {
      setNotification('denied');
      const { firebaseCloudMessaging } = await loadWebPush();

      expect(firebaseCloudMessaging.getPermission()).toBe('denied');
    });
  });
});
