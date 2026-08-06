# PWA unit tests (Vitest) — push-notification regression net

## What was built

First test infrastructure for the frontend repo (there was none): Vitest 4 + jsdom, with a
`__tests__/` mirror tree. 42 tests across three suites covering the lib-level logic changed by the
2026-08-06 push-notification fix, so its guarantees can't silently regress:

- `__tests__/lib/webPush.test.ts` (23) — `init()` never prompts (default/denied/iOS-Safari-tab),
  granted path passes the root `serviceWorkerRegistration` to firebase `getToken`, token caching,
  single-flight dedup of concurrent callers, legacy `firebase-cloud-messaging-push-scope`
  unregistration (root registration untouched), 10s `serviceWorker.ready` timeout resolving null,
  `enable()` calls `requestPermission` before any other async work, denial path, the old
  `isInitialized()` deadlock (gesture path works after a failed silent init), `getToken()` accessor
  never prompting, awaited `deleteToken()` clearing state, `getPermission()` mapping.
- `__tests__/lib/common.test.ts` (11) — `isMobile()` true on Android (regression: was a
  function-reference OR, always `isIOS`), iPhone, false on desktop; `isInstalled()` standalone /
  android-app referrer / plain tab; `logout()` order (server DELETE → local firebase delete →
  query-cache clear → signOut), skip-DELETE when no token, and completion despite server DELETE or
  token-read failures.
- `__tests__/worker/index.test.ts` (8) — background handler resolves only after
  `showNotification` settles (iOS silent-push guard), notification/data payload field priority,
  `notificationclick` deep-link URLs (new/update with `reservationId`+`datetime`, camelCase
  priority over the API's lowercase `reservationid`, delete with datetime only, unknown type →
  site root), close+waitUntil behavior, Clerk refresh ping on activate and on the 5-minute
  interval.

## Files touched

- `package.json` — devDeps `vitest` `jsdom`; scripts `test` (`vitest run`), `test:watch`.
- `vitest.config.ts` — new: jsdom environment, `@/` alias, `__tests__/**/*.test.{ts,tsx}` include.
- `__tests__/lib/webPush.test.ts`, `__tests__/lib/common.test.ts`,
  `__tests__/worker/index.test.ts` — new suites.
- `lib/common.ts` — `import { ApiClient }` → `import type` (type-only import was pulling
  `@clerk/nextjs` into the test module graph at runtime; esbuild can only elide `import type`).

## Key decisions

- **Vitest over Jest** — developer ruling 2026-08-06 (repo is ESM, `moduleResolution: bundler`).
- **`__tests__/` mirror tree** (not colocated) — developer ruling.
- **Scope: lib logic only** (webPush, common, worker); no React component tests in this batch —
  developer ruling.
- tsconfig `jsx: preserve` (required by Next) makes `.tsx` untransformable for Vitest without a
  React plugin; Vitest 4 ignored `esbuild.jsx` overrides. Worked around by mocking
  `@/lib/i18n/i18n` in `common.test.ts` so no `.tsx` enters the module graph — judgment call.
  Future component tests need `@vitejs/plugin-react` (or equivalent) in `vitest.config.ts`.
- Fresh module state per test via `vi.resetModules()` + dynamic import (webPush/common keep
  module-level singletons/caches) — judgment call.
- jsdom's `window.location` is non-configurable, so logout tests assert call order rather than the
  final redirect; the `href` assignment logs a harmless jsdom "Not implemented: navigation" —
  judgment call.

## Open items

- Component tests (NotificationSettings, UserProvider queryFn, Navbar burger) — deferred by scope
  ruling; needs a React plugin for JSX transform (see above).
- Server (`packages/server`) test suite — user said "start with the PWA"; server batch not yet
  requested/implemented.
- `npm run lint` (`next lint`) does not cover `__tests__/` (Next's default dirs); tests are
  typechecked by `tsc` but not linted.
