# Gotchas, legacy code, and known bugs

Read this before touching auth, API clients, admin pages, or i18n. Items here are documented,
not fixed — do not build on top of anything listed as dead or deprecated.

## Two parallel API clients

- [lib/api/hooks.ts](../lib/api/hooks.ts) — `useApiClient()`. **The one to use.** Wraps Clerk's
  `useAuth().getToken()` and sets `Authorization: Bearer <token>` on every request. On 401 it
  re-checks `getToken({ skipCache: true })` and redirects to `/sign-in` only from non-public pages.
- [lib/api/utils.ts](../lib/api/utils.ts) — `endpoints` object, explicitly `@deprecated`. No auth
  header, never redirects on 401. Roughly 90% duplicated from `hooks.ts`; kept only for migration.
  Do not add new endpoints here. `GET /user` / `PUT /user` currently exist only in this deprecated
  client — porting them to `hooks.ts` is an open item.

## Dead NextAuth/JWT-era code

The project migrated to Clerk (PRs #54–#59). Leftovers that are no longer wired up:

- [lib/api/helpers.ts](../lib/api/helpers.ts) — JWT/cookie signing; imports `jose`, which is not
  even in `package.json` anymore.
- [constants.ts](../constants.ts), [types/next-auth.d.ts](../types/next-auth.d.ts)
- Password logic in [models/User.ts](../models/User.ts)
- [lib/context/CurrentUserContext.tsx](../lib/context/CurrentUserContext.tsx) — 5-line stub
- Unused dependencies: `@auth/mongodb-adapter`, `bcryptjs`, `nodemailer`, `mongodb`

## Admin legacy page still live

- [pages/admin-legacy.tsx](../pages/admin-legacy.tsx) coexists with the new
  [pages/admin/](../pages/admin/) panel.
- [worker/index.ts](../worker/index.ts) still deep-links notification clicks to
  `/admin-legacy?reservationId=…` — removing the legacy page breaks notification clicks until the
  service worker is updated.

## i18n bug

`useTranslation()` in [lib/i18n/i18n.ts](../lib/i18n/i18n.ts) hardcodes `'el'` and ignores the
selected language (`overrideLang` / `language` unused). Much of the admin UI is hardcoded Greek
rather than going through translation keys.

## Vestigial files

- [lib/connectionUtils.ts](../lib/connectionUtils.ts) — empty, 0 bytes
- [context/AppModeContext.tsx](../context/AppModeContext.tsx) — never mounted in `_app.tsx`
- [lib/indexDBUtils.ts](../lib/indexDBUtils.ts) — Dexie `TokenDatabase` for FCM tokens, appears
  vestigial (tokens now live in Clerk metadata)
- [README.md](../README.md) — stale create-next-app boilerplate; wrongly references the `app/`
  router (project uses Pages Router)

## Server-side quirks that affect the frontend

Server repo: `/home/combustiblemon/dev/tennis-app/packages/server`

- `GET /reservations/:id` (and the admin equivalents) actually read `req.query.id`, not the path
  param — the query param supports a comma-separated id list.
- The server auth middleware has a fallback path that base64-decodes the JWT payload and trusts
  `sub` **without verifying the signature** when Clerk's middleware yields no `userId`
  (`src/middleware/clerkAuth.ts`). Security-relevant — flag before any auth work.
