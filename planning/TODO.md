# TODO

Living work list. See [DOCUMENTATION.md](DOCUMENTATION.md) for conventions. Seeded 2026-08-06
from the root `TODO.md` (developer's list, left untouched) plus items surfaced during the
CLAUDE.md/planning setup.

## From root TODO.md

- [ ] Rewrite the BE from MongoDB to a relational database (?)
- [ ] Rewrite API call logic so the app doesn't make so many calls
- [ ] Slow site on PC
- [ ] iPhone notifications
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
