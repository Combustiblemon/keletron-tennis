# TODO

Living work list. See [DOCUMENTATION.md](DOCUMENTATION.md) for conventions. Seeded 2026-08-06
from the root `TODO.md` (developer's list, left untouched) plus items surfaced during the
CLAUDE.md/planning setup.

## From root TODO.md

- [ ] Rewrite the BE from MongoDB to a relational database (?)
- [ ] Rewrite API call logic so the app doesn't make so many calls
- [ ] Slow site on PC
- [ ] iPhone notifications — fix implemented 2026-08-06 (see
      [implementations/2026-08-06-fix-admin-push-notifications.md](implementations/2026-08-06-fix-admin-push-notifications.md));
      tick only after the two admin phones are verified receiving pushes again
- [ ] PWA install instructions

## Surfaced 2026-08-06 (see [GOTCHAS.md](GOTCHAS.md) for detail)

- [ ] Fix `useTranslation()` hardcoding `'el'` — selected language is ignored
- [ ] Port `GET /user` / `PUT /user` calls from deprecated `lib/api/utils.ts` to `lib/api/hooks.ts`,
      then delete `lib/api/utils.ts`
- [ ] Update `worker/index.ts` notification clicks off `/admin-legacy`, then remove
      `pages/admin-legacy.tsx`
- [ ] Remove dead NextAuth/JWT-era code and unused deps (`@auth/mongodb-adapter`, `bcryptjs`,
      `nodemailer`, `mongodb`)
- [ ] Replace stale create-next-app `README.md`
- [ ] Server: unverified-JWT fallback in auth middleware (`src/middleware/clerkAuth.ts`) — security

## Surfaced 2026-08-06 (push-notification fix)

- [ ] Verify the two admin phones (Android + iPhone) receive pushes after deploying the
      2026-08-06 notification fix (server first, then FE)
- [ ] Server repo pre-existing: `server:typecheck` fails (`tsconfig.spec.json` file list missing
      `src/modules/clerk.ts`) and `server:lint` errors in files unrelated to the fix
- [ ] Server: `addFCMToken` read-modify-write race on Clerk metadata can drop a token on
      concurrent registration (self-heals via focus-refetch re-PUT)
- [ ] Extend unit tests: React component tests (NotificationSettings, UserProvider, Navbar) —
      needs `@vitejs/plugin-react` in `vitest.config.ts` (tsconfig `jsx: preserve`); see
      [implementations/2026-08-06-pwa-unit-tests.md](implementations/2026-08-06-pwa-unit-tests.md)
- [ ] Server test suite (notification handler, prune logic) — PWA batch done 2026-08-06
