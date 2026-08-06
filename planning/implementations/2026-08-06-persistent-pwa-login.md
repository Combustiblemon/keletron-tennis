# 2026-08-06 — Persistent PWA login (Clerk session hardening)

## What was built

Users opening the PWA every couple of weeks were logged out each time. The real cause is
server-side: Clerk's session settings (documented as 7-day lifetime + 1-day inactivity timeout)
expire the session long before the next visit. That is a Clerk Dashboard change, not code — it is
documented in `CLERK_SETUP.md` and tracked as a manual open item.

Two frontend problems that fake or worsen logouts were fixed in code: the API client's 401 handler
could redirect to `/sign-in` on transient/offline failures, and the service worker carried a
"Clerk keep-alive" (5-minute `setInterval` broadcasting a refresh ping) that never fires because
browsers terminate idle service workers after ~30 seconds. The handler was hardened and the dead
keep-alive removed entirely.

## Files touched

- `lib/api/hooks.ts` — modified: exported prefix-aware `isPublicPage()` (Clerk sub-routes like
  `/sign-in/factor-one` now count as public); 401 branch wraps `getToken({ skipCache: true })` in
  try/catch and redirects only when the token is `null` **and** `navigator.onLine`.
- `worker/index.ts` — modified: removed `broadcastClerkTokenRefresh`, the 5-minute `setInterval`,
  and the Clerk import; `activate` handler reduced to `clients.claim()`.
- `lib/clerkSwRefresh.ts` — deleted (only defined the ping message constant).
- `components/FCM/FCM.tsx` — deleted: its sole job was listening for the SW ping; FCM
  init/registration lives in `UserProvider` and user-gesture paths (Navbar, NotificationSettings).
- `pages/_app.tsx` — modified: removed `FCM` import and `<FCM />` mount.
- `__tests__/worker/index.test.ts` — modified: removed the `Clerk refresh ping` describe block and
  fake timers; activate test now asserts only `clients.claim()`.
- `__tests__/lib/api/hooks.test.ts` — created: unit tests for `isPublicPage()`.
- `CLERK_SETUP.md` — modified: section 7 rewritten with the persistent-session settings, the
  "one of lifetime/inactivity must stay enabled" rule, and the paid-plan note for production.
- `ENV_SETUP_INSTRUCTIONS.md` — modified: warning that production must use `pk_live_`/`sk_live_`
  keys (dev-instance dev-browser JWT is not durable in Safari/iOS PWA standalone).
- `CLAUDE.md` — modified: stack line no longer references the deleted `FCM.tsx` mount.
- `planning/GOTCHAS.md` — modified: 401-handler description updated.
- `planning/TODO.md` — modified: manual dashboard change + pk_live verification added.

## Key decisions

- **Max session lifetime, no inactivity timeout** — developer ruling (asked 2026-08-06):
  Facebook-style, signed in until manual logout. **Constraint surfaced mid-implementation: the app
  is on Clerk's free tier and lifetime customization is paid** — production stays at the 7-day
  default, so full persistence needs a paid plan (developer decision, open item).
- **Remove (not repair) the SW keep-alive** — presented in the approved plan. Repair is
  impossible (no spec-compliant way to keep a SW alive on a timer); Clerk's client SDK already
  refreshes the ~60s token while a tab is open; with inactivity timeout disabled the mechanism has
  no purpose.
- **401 hardening semantics** — bug-fix judgment call within the approved plan: a thrown
  `getToken` (Clerk unreachable) or an offline device is never treated as a logout; the
  `UNAUTHORIZED` envelope is still returned so callers see the failure.

## Open items

- [x] Dashboard verified (developer, 2026-08-06): free plan locks the session window at 7 days,
  not changeable. Re-login after any >7-day gap is expected behavior until a paid-plan upgrade
  (open decision, tracked in TODO.md).
- [x] Production keys verified `pk_live_`/`sk_live_` (developer, 2026-08-06).
- [ ] Soak test: after the dashboard change, leave the PWA closed >1 day and reopen — should
  still be signed in.
