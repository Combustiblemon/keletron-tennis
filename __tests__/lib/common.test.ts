/**
 * Tests for lib/common.ts — device detection and logout.
 *
 * Regression targets from the 2026-08-06 notification fix:
 * - isMobile() is a real OR of isIOS()/isAndroid() (was a function-reference
 *   OR that always evaluated to isIOS).
 * - logout() removes the token from the server BEFORE local deletion and
 *   sign-out, and a failing server call never blocks logout.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const webPushMocks = vi.hoisted(() => ({
  deleteToken: vi.fn(async () => true),
  getToken: vi.fn(async (): Promise<string | undefined> => 'fcm-token-1'),
}));

vi.mock('@/lib/webPush', () => ({
  firebaseCloudMessaging: webPushMocks,
}));

vi.mock('@mantine/core', () => ({
  rem: (value: number | string) => `${value}px`,
}));

// Keeps .tsx (LanguageContext) out of the module graph: tsconfig `jsx:
// preserve` makes JSX untransformable for Vitest without a React plugin.
vi.mock('@/lib/i18n/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

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

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126 Mobile';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)';
const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/126';

const loadCommon = async () => import('@/lib/common');

const makeLogoutDeps = () => {
  const calls: string[] = [];

  const signOut = vi.fn(async () => {
    calls.push('signOut');
  });
  const queryClient = {
    clear: vi.fn(() => {
      calls.push('queryClient.clear');
    }),
  };
  const api = {
    notifications: {
      DELETE: vi.fn(async () => {
        calls.push('api.DELETE');
        return { success: true };
      }),
    },
  };

  webPushMocks.deleteToken.mockImplementation(async () => {
    calls.push('webPush.deleteToken');
    return true;
  });

  return { api, calls, queryClient, signOut };
};

const runLogout = async (
  deps: ReturnType<typeof makeLogoutDeps>,
  callback?: () => void
) => {
  const { logout } = await loadCommon();

  await logout(
    deps.signOut,
    deps.queryClient as unknown as Parameters<typeof logout>[1],
    deps.api as unknown as Parameters<typeof logout>[2],
    callback
  );
};

describe('lib/common', () => {
  beforeEach(() => {
    vi.resetModules();
    setMatchMedia(false);
    setUserAgent(DESKTOP_UA);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('isMobile', () => {
    it('is true on Android (regression: was always isIOS)', async () => {
      setUserAgent(ANDROID_UA);
      const { isMobile } = await loadCommon();

      expect(isMobile()).toBe(true);
    });

    it('is true on iPhone', async () => {
      setUserAgent(IPHONE_UA);
      const { isMobile } = await loadCommon();

      expect(isMobile()).toBe(true);
    });

    it('is false on desktop', async () => {
      setUserAgent(DESKTOP_UA);
      const { isMobile } = await loadCommon();

      expect(isMobile()).toBe(false);
    });
  });

  describe('isInstalled', () => {
    it('is true in standalone display mode', async () => {
      setMatchMedia(true);
      const { isInstalled } = await loadCommon();

      expect(isInstalled()).toBe(true);
    });

    it('is true when opened from an Android app referrer', async () => {
      Object.defineProperty(document, 'referrer', {
        configurable: true,
        value: 'android-app://com.example.app',
      });
      const { isInstalled } = await loadCommon();

      expect(isInstalled()).toBe(true);
    });

    it('is false in a plain browser tab', async () => {
      Object.defineProperty(document, 'referrer', {
        configurable: true,
        value: '',
      });
      const { isInstalled } = await loadCommon();

      expect(isInstalled()).toBe(false);
    });
  });

  describe('logout', () => {
    // jsdom cannot navigate; the final `window.location.href = '/'` logs a
    // "Not implemented: navigation" error to stderr, which is harmless here.
    it('deletes the server token before local deletion and sign-out', async () => {
      const deps = makeLogoutDeps();

      await runLogout(deps);

      expect(deps.api.notifications.DELETE).toHaveBeenCalledWith(
        'fcm-token-1'
      );
      expect(deps.calls).toEqual([
        'api.DELETE',
        'webPush.deleteToken',
        'queryClient.clear',
        'signOut',
      ]);
    });

    it('skips the server call when no token exists', async () => {
      const deps = makeLogoutDeps();
      webPushMocks.getToken.mockResolvedValueOnce(undefined);

      await runLogout(deps);

      expect(deps.api.notifications.DELETE).not.toHaveBeenCalled();
      expect(deps.signOut).toHaveBeenCalledTimes(1);
      expect(webPushMocks.deleteToken).toHaveBeenCalledTimes(1);
    });

    it('completes logout even when the server DELETE fails', async () => {
      const deps = makeLogoutDeps();
      deps.api.notifications.DELETE.mockRejectedValueOnce(
        new Error('server down')
      );

      await runLogout(deps);

      expect(webPushMocks.deleteToken).toHaveBeenCalledTimes(1);
      expect(deps.queryClient.clear).toHaveBeenCalledTimes(1);
      expect(deps.signOut).toHaveBeenCalledTimes(1);
    });

    it('completes logout even when reading the token throws', async () => {
      const deps = makeLogoutDeps();
      webPushMocks.getToken.mockRejectedValueOnce(new Error('no messaging'));

      await runLogout(deps);

      expect(deps.api.notifications.DELETE).not.toHaveBeenCalled();
      expect(deps.signOut).toHaveBeenCalledTimes(1);
    });

    it('runs the callback after sign-out', async () => {
      const deps = makeLogoutDeps();
      const callback = vi.fn(() => {
        deps.calls.push('callback');
      });

      await runLogout(deps, callback);

      expect(deps.calls.indexOf('callback')).toBeGreaterThan(
        deps.calls.indexOf('signOut')
      );
    });
  });
});
