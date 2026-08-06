## Working with an AI assistant

The assistant uses `caveman ultra` skill all the time.
The assistant does not hold design authority. It **asks, it does not guess.**

- **Any design decision — ask first.** Feel, numbers, scope, naming, UX, architecture shape, what a
  feature does or does not do: stop and ask the developer. One question at a time if that is
  clearer. A plausible-looking guess that lands in the repo is worse than a blocked task, because it
  silently becomes the design.
- **Ambiguity is a question, not a choice.** If the spec, this file, or the task allows two readings,
  the assistant does not pick the "reasonable default" — it surfaces both readings and waits.
- **No silent decisions.** Do not bury a design call in an implementation and mention it afterwards.
  If something had to be decided to make the code compile, say so before writing it.
- **Bugs are the exception.** Fixing a defect — code that does not do what it was clearly meant to
  do — needs no permission. Diagnose and fix it. If the "bug" turns out to be an unspecified
  behaviour rather than a broken one, it is a design question: ask.
- **Branches are the developer's, manually (ruling 2026-07-20).** The assistant never creates,
  switches, or merges git branches. Commits, when asked for, go on whatever branch is currently
  checked out.
- **Document every change.** Each implementation gets its own file in
  [planning/implementations/](planning/implementations/) — what was built, files touched, key
  decisions, and open items. Keep [planning/TODO.md](planning/TODO.md) current with what is left to
  do (tick items off, add new ones). Do this as part of the work, not after being asked. Conventions:
  [planning/DOCUMENTATION.md](planning/DOCUMENTATION.md).

## Project

Keletron tennis club PWA. Frontend only — no `pages/api/`, no DB connection from this repo.
Greek-first UI (`el` default locale). Users book court reservations; admins manage courts,
reservations, announcements.

## Stack

- Next.js 14.2 **Pages Router** (`pages/`, no `app/`), TypeScript strict, React 18, ESM.
- Mantine v7 full suite + `@tabler/icons-react`. PostCSS `postcss-preset-mantine`. No Tailwind.
- TanStack React Query v5 (client in `pages/_app.tsx`).
- Clerk auth (`@clerk/nextjs`): `middleware.ts` + `<ClerkProvider>` + prebuilt sign-in/up/profile pages.
- FCM push (`firebase`): client `lib/webPush.ts`, mount `components/FCM/FCM.tsx`.
- next-pwa 5.6: custom SW source `worker/index.ts`, compiled to `public/firebase-messaging-sw.js`
  (SW filename overridden so FCM SW = workbox SW). `WEBSITE_URL` + `NEXT_PUBLIC_FIREBASE_CONFIG`
  injected into SW via `webpack.DefinePlugin` in `next.config.mjs`.
- `models/*.ts`: zod validators + mongoose schemas — **types only**, nothing connects to Mongo here.

## Commands

- `npm run dev` | `dev:https` (uses `certificates/`) | `build` | `lint` | `typecheck` | `checkTranslations`
- npm. No tests, no CI.

## Backend

Separate repo: `/home/combustiblemon/dev/tennis-app/packages/server` — Express 5 + MongoDB
(Mongoose), Clerk auth, FCM, Mailgun. Run from monorepo root: `npm run server:dev`. Listens
`http://localhost:2000` = `NEXT_PUBLIC_API_URL`.

- **All routes authenticated** (Clerk Bearer token). No public endpoints, no `/api` prefix.
  Route definitions: server `src/modules/routes.ts`. Admin routes under `/admin/*`
  (role `ADMIN` or `DEVELOPER`).
- Response envelope `{ success, data | errors, endpoint, operation }` — FE mirror:
  `lib/api/responseTypes.ts`; error codes enum in `lib/api/common.ts`.
- **No shared types package.** FE `models/*.ts` hand-duplicate server `src/models/*.ts`
  (Reservation, Court, Announcement) — keep in sync manually.
- Users live in **Clerk, not Mongo**. Role in `publicMetadata.role`: `USER | ADMIN | DEVELOPER`.
  FCM tokens in Clerk metadata.
- Reservation `datetime` format: `YYYY-MM-DDTHH:mm` local wall time (Europe/Athens), **NOT ISO/UTC**.
  Duration in minutes, default 90.

## API client

Use `useApiClient()` from `lib/api/hooks.ts` — adds Clerk Bearer header, handles 401 redirect.
`lib/api/utils.ts` deprecated, no auth header — do not extend (see [planning/GOTCHAS.md](planning/GOTCHAS.md)).

## Structure

Flat root, no `src/`. Alias `@/*` = repo root. Components: `components/<Name>/<Name>.tsx`, arrow
functions. Key dirs: `pages/`, `components/` (admin/, forms/, homepage/), `lib/` (api/, i18n/,
webPush), `models/`, `worker/`, `hooks/`, `context/`, `scripts/`.

## Conventions

- ESLint airbnb + prettier (single quotes, es5 trailing comma). `simple-import-sort` enforced.
  Arrow components only. Blank line before every `if` (lint-enforced).
- i18n: hand-rolled `useTranslation()` in `lib/i18n/i18n.ts`, keys in `lib/i18n/locales/{el,en}.json`.
  Run `npm run checkTranslations` after locale edits.
- Route protection, two layers: `middleware.ts` public allowlist + `<ProtectedRoute>` /
  `<RoleGuard>` / `useRoles()` client-side. `isAdmin` = ADMIN **or** DEVELOPER.

## Docs

- Guides: [CLERK_SETUP.md](CLERK_SETUP.md), [ROLE_SYSTEM_GUIDE.md](ROLE_SYSTEM_GUIDE.md),
  [PROTECTED_ROUTES_GUIDE.md](PROTECTED_ROUTES_GUIDE.md).
- Env vars: [ENV_SETUP_INSTRUCTIONS.md](ENV_SETUP_INSTRUCTIONS.md) — no `.env.example`.
- Legacy/dead code + known bugs: [planning/GOTCHAS.md](planning/GOTCHAS.md) — **read before
  touching auth, API clients, admin pages, or i18n.**
- Work tracking: [planning/TODO.md](planning/TODO.md). Implementation docs:
  [planning/implementations/](planning/implementations/) per
  [planning/DOCUMENTATION.md](planning/DOCUMENTATION.md).
