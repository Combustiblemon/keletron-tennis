# Fix admin push-notification delivery (FE + server)

## What was built

Diagnosed and fixed why two admin devices (an Android and an iPhone, both installed-PWA-only) stopped
receiving push notifications while the developer's own device kept working. Root cause was server-side:
`subscribeUser` mutated the shared `topicMap.USER` array by reference, appending `'admin'` once per
admin token registration for the process lifetime. Since the frontend re-registers the token on every
window focus, the array grew until the fanned-out `subscribeToTopic` calls started failing — and the
PUT handler *deleted the stored token* on subscribe failure while returning HTTP 200 with an error
body that the frontend swallowed. Admin tokens flapped in and out of Clerk metadata; idle admins had
no token at send time. Topics were pure overhead: `sendMessageToTopic` had zero call sites.

The topic system was removed entirely (developer ruling); tokens are now stored unconditionally and
registration errors return real HTTP statuses. The client push flow was restructured: permission is
never requested automatically (iOS rejects non-gesture prompts) — the silent auto path only proceeds
when permission is already granted, and prompting happens from two user-gesture paths: the mobile
burger menu (previously deadlocked by `isInitialized()`) and a new notification panel inside Clerk's
`<UserProfile>` on `/settings`. Firebase now binds the push subscription to the next-pwa root service
worker registration instead of registering a duplicate SW at its private scope (legacy scope
registrations are unregistered on init). The SW background handler now awaits `showNotification`
(iOS revokes subscriptions after silent pushes — the likely reason the iPhone "worked then stopped").
Logout now informs the server via a new `DELETE /notifications` before deleting the token locally.

## Files touched

Server (`/home/combustiblemon/dev/tennis-app/packages/server`, branch `legacy`):

- `src/modules/notifications.ts` — removed `Topics`, `topicMap`, `sendMessageToTopic`,
  `subscribeToTopic`, `unsubscribeFromTopic`, `subscribeUser`, `unsubscribeUser`; prune now also
  covers `messaging/invalid-registration-token` (`PRUNEABLE_ERROR_CODES`).
- `src/handlers/notification.ts` — rewritten: `updateToken` stores unconditionally (no topic gate,
  never deletes tokens, real 4xx/5xx via `ServerError`, fixed `'user/id'` → `'notifications'`
  envelope tag); new idempotent `deleteToken`.
- `src/modules/routes.ts` — added `DELETE /notifications`.
- `src/modules/common.ts` — removed unused `ERRORS.FAILED_TO_SUBSCRIBE_TO_TOPIC` (no FE mirror existed).

Frontend (`/home/combustiblemon/dev/keletron-tennis`, branch `main`):

- `lib/webPush.ts` — restructured: `init()` (silent, granted-only), `enable()` (gesture,
  `requestPermission` is the first await to preserve WebKit transient activation), `hasToken()`
  (replaces the deadlocking `isInitialized()`), `getPermission()`, guarded `getToken()`, awaited
  `deleteToken()`; passes `serviceWorkerRegistration` (next-pwa root, via `serviceWorker.ready` with
  10s timeout) to firebase `getToken`; unregisters legacy `firebase-cloud-messaging-push-scope`
  registrations; single-flight token fetch; foreground handler uses the known registration instead of
  `registrations[0]`; removed dead `saveToken()` stub.
- `worker/index.ts` — background handler awaits `self.registration.showNotification`.
- `lib/api/hooks.ts` — added `notifications.DELETE`; exported `ApiClient` type.
- `lib/common.ts` — fixed `isMobile` (was a function-reference OR, always `isIOS`); `logout` takes
  the api client and best-effort `DELETE`s the token server-side before local deletion/sign-out.
- `components/UserProvider/UserProvider.tsx` — queryFn uses `init()` only, checks the response
  envelope's `success` flag and throws on failure so react-query retries; removed dead
  `publicMetadata.FCMTokens` read (server stores them in privateMetadata).
- `components/FCM/FCM.tsx` — auto-init effect removed (UserProvider owns the auto path); keeps only
  the Clerk SW-refresh message listener.
- `components/MobileNavbar/Navbar.tsx` — burger uses `getPermission()`/`hasToken()` + `enable()`
  (deadlock fix); passes api client to `logout`.
- `components/NotificationSettings/NotificationSettings.tsx` — new panel: permission state, enable
  button (gesture), denied/unsupported/install-first hints; invalidates `['fcm-token']` on success.
- `pages/settings.tsx` → `pages/settings/[[...index]].tsx` — wraps `<UserProfile>` with a custom
  `<UserProfile.Page url="notifications">` hosting the panel. Converted to a catch-all route with
  `routing="path" path="/settings"` (matches the sign-in/up page idiom): Clerk custom pages
  error out on a non-catch-all route ("The `<UserProfile/>` component is not configured
  correctly"), found in manual testing.
- `lib/i18n/locales/el.json`, `en.json` — new `settings.notifications.*` keys (parity checked).

## Key decisions

- **Remove topics entirely** (vs. fixing the mutation or decoupling) — developer ruling 2026-08-06.
- **Admin delivery fix only**; USER-facing notification sends stay out of scope — developer ruling.
- **Prompt UX: both** fixed burger fallback and an explicit settings panel; panel lives in a Clerk
  `UserProfile.Page` (vs. homepage banner / navbar bell) — developer ruling.
- **`DELETE /notifications` is idempotent** (unknown token → 200) so logout never blocks — developer
  ruling.
- **FCM.tsx auto-init removed**; UserProvider is the single silent path — developer ruling.
- **Focus-refetch re-PUT kept** (no staleTime damping) as the self-healing mechanism — developer ruling.
- **el/en copy** for the panel — drafts approved by developer.
- Rollout order **server first** (old FE + new server fully compatible; the reverse can still delete
  tokens) — bug-fix judgment call.
- Prune extension limited to `invalid-registration-token` (not `invalid-argument`, which can indicate
  payload bugs rather than dead tokens) — bug-fix judgment call.
- `isMobile` fix and awaited `deleteToken` — plain bug fixes, no ruling needed per CLAUDE.md.

## Open items

- Verify the two broken admin phones recover after deploy (open PWA twice; check Clerk
  `privateMetadata.FCMTokens`; if iOS shows `denied`, re-allow in iOS Settings then use the new
  settings panel). Only then tick "iPhone notifications" in TODO.md.
- `useTranslation()` hardcodes `'el'` — the new `settings.notifications.*` EN strings won't render
  until that pre-existing bug is fixed (already in TODO.md).
- Server repo pre-existing failures, untouched by this work: `server:typecheck` fails
  (`tsconfig.spec.json` missing `src/modules/clerk.ts` in file list) and `server:lint` has errors in
  unrelated files. This change's four files lint clean; `server:build` passes.
- Clerk metadata read-modify-write race in `addFCMToken` can drop a token on concurrent registration
  (pre-existing); focus-refetch self-heals. Not fixed.
- Old tokens remain topic-subscribed at FCM — harmless, nothing sends to topics; they die with the
  tokens.
