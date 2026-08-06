/**
 * Tests for worker/index.ts — the service worker's push handling.
 *
 * Regression targets from the 2026-08-06 notification fix:
 * - The onBackgroundMessage handler resolves only after showNotification
 *   settles (the firebase SW awaits it inside the push event's waitUntil;
 *   an early resolve lets iOS count the push as silent and revoke the
 *   subscription).
 * - notificationclick deep-link URLs, including the reservationId /
 *   reservationid casing fallback.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ app: true })),
}));

const swMocks = vi.hoisted(() => ({
  getMessaging: vi.fn(() => ({ messaging: true })),
  onBackgroundMessage: vi.fn(),
}));

vi.mock('firebase/messaging/sw', () => swMocks);

type Listener = (event: unknown) => void;

const makeFakeSelf = () => {
  const listeners = new Map<string, Listener>();

  return {
    listeners,
    self: {
      addEventListener: vi.fn((type: string, listener: Listener) => {
        listeners.set(type, listener);
      }),
      clients: {
        claim: vi.fn(async () => undefined),
        openWindow: vi.fn(async () => null),
      },
      registration: {
        showNotification: vi.fn(async () => undefined),
      },
    },
  };
};

const WEBSITE_URL = 'https://tennis.test';

const loadWorker = async () => {
  const fake = makeFakeSelf();
  vi.stubGlobal('self', fake.self);
  vi.stubEnv('WEBSITE_URL', WEBSITE_URL);

  await import('@/worker/index');

  const backgroundHandler = swMocks.onBackgroundMessage.mock.calls[0]?.[1] as
    | ((payload: unknown) => Promise<void>)
    | undefined;

  return { ...fake, backgroundHandler };
};

const clickEvent = (data: Record<string, string> | undefined) => {
  const waitUntil = vi.fn();

  return {
    event: {
      notification: {
        close: vi.fn(),
        data,
      },
      waitUntil,
    },
    waitUntil,
  };
};

describe('worker/index.ts', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('onBackgroundMessage handler', () => {
    it('shows a notification with notification-payload fields taking priority', async () => {
      const { backgroundHandler, self: fakeSelf } = await loadWorker();

      await backgroundHandler?.({
        data: { body: 'data-body', title: 'data-title', type: 'new' },
        notification: { body: 'notif-body', title: 'notif-title' },
      });

      expect(fakeSelf.registration.showNotification).toHaveBeenCalledWith(
        'notif-title',
        expect.objectContaining({
          body: 'notif-body',
          data: { body: 'data-body', title: 'data-title', type: 'new' },
          icon: '/icons/ball-tennis.svg',
        })
      );
    });

    it('falls back to data-payload fields for data-only messages', async () => {
      const { backgroundHandler, self: fakeSelf } = await loadWorker();

      await backgroundHandler?.({
        data: { body: 'data-body', title: 'data-title' },
      });

      expect(fakeSelf.registration.showNotification).toHaveBeenCalledWith(
        'data-title',
        expect.objectContaining({ body: 'data-body' })
      );
    });

    it('resolves only after showNotification settles (iOS silent-push guard)', async () => {
      const { backgroundHandler, self: fakeSelf } = await loadWorker();

      let resolveShow: (() => void) | undefined;
      fakeSelf.registration.showNotification.mockImplementation(
        () =>
          new Promise<undefined>((resolve) => {
            resolveShow = () => resolve(undefined);
          })
      );

      let settled = false;
      const handlerPromise = backgroundHandler?.({
        data: { title: 't' },
      })?.then(() => {
        settled = true;
      });

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(settled).toBe(false);

      resolveShow?.();
      await handlerPromise;

      expect(settled).toBe(true);
    });
  });

  describe('notificationclick', () => {
    it('deep-links new/update notifications with reservationId and datetime', async () => {
      const { listeners, self: fakeSelf } = await loadWorker();
      const { event } = clickEvent({
        datetime: '2026-08-06T18:00',
        reservationid: 'abc123',
        type: 'update',
      });

      listeners.get('notificationclick')?.(event);

      expect(fakeSelf.clients.openWindow).toHaveBeenCalledWith(
        `${WEBSITE_URL}/admin-legacy?reservationId=abc123&datetime=2026-08-06T18:00`
      );
    });

    it('prefers camelCase reservationId over the lowercase API field', async () => {
      const { listeners, self: fakeSelf } = await loadWorker();
      const { event } = clickEvent({
        datetime: 'd',
        reservationId: 'camel',
        reservationid: 'lower',
        type: 'new',
      });

      listeners.get('notificationclick')?.(event);

      expect(fakeSelf.clients.openWindow).toHaveBeenCalledWith(
        `${WEBSITE_URL}/admin-legacy?reservationId=camel&datetime=d`
      );
    });

    it('deep-links delete notifications with datetime only', async () => {
      const { listeners, self: fakeSelf } = await loadWorker();
      const { event } = clickEvent({
        datetime: '2026-08-06T18:00',
        type: 'delete',
      });

      listeners.get('notificationclick')?.(event);

      expect(fakeSelf.clients.openWindow).toHaveBeenCalledWith(
        `${WEBSITE_URL}/admin-legacy?datetime=2026-08-06T18:00`
      );
    });

    it('falls back to the site root for unknown notification types', async () => {
      const { listeners, self: fakeSelf } = await loadWorker();
      const { event } = clickEvent(undefined);

      listeners.get('notificationclick')?.(event);

      expect(fakeSelf.clients.openWindow).toHaveBeenCalledWith(WEBSITE_URL);
    });

    it('closes the notification and defers openWindow via waitUntil', async () => {
      const { listeners } = await loadWorker();
      const { event, waitUntil } = clickEvent({ type: 'other' });

      listeners.get('notificationclick')?.(event);

      expect(event.notification.close).toHaveBeenCalledTimes(1);
      expect(waitUntil).toHaveBeenCalledTimes(1);
    });
  });

  describe('activate', () => {
    it('claims clients on activate', async () => {
      const { listeners, self: fakeSelf } = await loadWorker();

      const waitUntil = vi.fn();
      listeners.get('activate')?.({ waitUntil });

      expect(waitUntil).toHaveBeenCalledTimes(1);

      const [claimPromise] = waitUntil.mock.calls[0] as [Promise<void>];
      await claimPromise;

      expect(fakeSelf.clients.claim).toHaveBeenCalledTimes(1);
    });
  });
});
