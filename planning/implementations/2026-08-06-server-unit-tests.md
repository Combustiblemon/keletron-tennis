# Server unit tests (Jest) — notification token lifecycle

## What was built

First actual tests for the backend (`/home/combustiblemon/dev/tennis-app/packages/server`, branch
`legacy`). The Nx Jest infrastructure already existed (`jest.config.ts`, ts-jest,
`passWithNoTests`) but had zero test files; specs follow the repo's own colocated
`src/**/*.spec.ts` convention rather than the FE `__tests__/` ruling, since that convention is
baked into the existing `jest.config.ts`/`tsconfig.spec.json` include patterns. 25 tests across
three suites, mirroring the FE batch as the regression net for the 2026-08-06 notification fix:

- `src/handlers/notification.spec.ts` (12) — PUT stores new tokens, skips the Clerk write for
  already-stored tokens, **never deletes a token on any failure path** (the old topic-gated
  handler did), throws `ServerError` 500 on Clerk write failure / 400 on invalid body (no more
  200-with-error-body), no-ops without an authenticated user; DELETE removes stored tokens,
  **idempotent 200 for unknown tokens**, 500 on Clerk removal failure, 400 on invalid body.
- `src/modules/notifications.spec.ts` (6) — `sendMessageToTokens` early-returns on empty input,
  passes `{data, tokens}` through to `sendEachForMulticast`, prunes **both** dead-token codes
  (`registration-token-not-registered`, `invalid-registration-token`) while leaving
  `invalid-argument` alone, removes failed tokens only from users that hold them, and contains
  multicast failures (returns `[]`, no throw).
- `src/services/userService.spec.ts` (7) — `addFCMToken` appends while preserving other
  privateMetadata keys, starts a list when none exists, exact-string dedupe without writing,
  `false` on Clerk failure; `removeFCMToken` removes only the target token, `false` for unknown
  token / Clerk failure; `getUserFromClerk` defaults (`role: USER`, `FCMTokens: []`).

## Files touched

- `packages/server/src/handlers/notification.spec.ts` — new.
- `packages/server/src/modules/notifications.spec.ts` — new.
- `packages/server/src/services/userService.spec.ts` — new.
- `packages/server/tsconfig.spec.json` — include collapsed to `src/**/*.ts` (fixes the
  **pre-existing** `server:typecheck` failure: TS6307, composite project referencing
  `src/modules/clerk.ts` outside its file list); spec `outDir` moved from `../../dist/server` to
  `../../dist/out-tsc/server-spec` so spec declaration emit no longer pollutes the app build
  output (stray `*.spec.d.ts` were landing next to deployable JS; existing strays deleted).

## Key decisions

- **Use the existing Nx Jest setup and colocated `*.spec.ts` convention** — not a new framework;
  no developer ruling needed (following repo's own wiring). The FE `__tests__/` ruling was
  FE-specific.
- Mock seams: `firebase-admin` / `firebase-admin/app`, `../services/userService`,
  `../modules/clerk` (`clerkClient`), and `signale` (silence). Handlers exercised with plain fake
  `req`/`res` objects through the real `authUserHelper`/zod/`ServerError` paths — judgment call.
- Fixing `tsconfig.spec.json` (include + outDir) counts as a bug fix (broken config blocked
  `server:typecheck` on a clean tree) — judgment call per CLAUDE.md bug exception.

## Open items

- `server:lint` still has pre-existing errors in files unrelated to this work (global.d.ts,
  authConfig.ts, reservation handlers, helpers, email); the three new spec files lint clean.
- Reservation-handler send paths (admin targeting, error fan-out to developers) untested — larger
  mocking surface (Mongoose models); candidate for a future batch.
- Handler quirk kept as-is and covered by tests: a stale middleware-loaded `user.FCMTokens` can
  make `addFCMToken` return `false` for an already-stored token, yielding a spurious 500; the FE
  retry then sees the token as existing and gets 200.
