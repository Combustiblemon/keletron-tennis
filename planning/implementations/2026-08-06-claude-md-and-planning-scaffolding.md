# CLAUDE.md project documentation + planning scaffolding

Date: 2026-08-06

## What was built

Expanded `CLAUDE.md` from process-rules-only into full project documentation for AI-assisted
sessions: stack, commands, backend summary with pointers into the server repo
(`/home/combustiblemon/dev/tennis-app/packages/server`), API client guidance, structure,
conventions, and doc pointers. Created the `planning/` directory that CLAUDE.md already
referenced but which did not exist.

Content is based on a full exploration of both repos (frontend and server) done the same day.

## Files touched

- `CLAUDE.md` — appended project documentation below the existing "Working with an AI assistant"
  section (kept verbatim)
- `planning/DOCUMENTATION.md` — new; conventions for implementation docs, TODO, gotchas
- `planning/TODO.md` — new; seeded from root `TODO.md` open items plus items surfaced during
  exploration
- `planning/GOTCHAS.md` — new; legacy/dead code, known bugs, server-side quirks
- `planning/implementations/` — new directory; this file is its first entry

## Key decisions (all developer rulings, asked 2026-08-06)

- CLAUDE.md body written caveman-compressed (terse, token-lean); technical substance kept.
- Gotchas/legacy list kept out of CLAUDE.md in a separate file. Location `planning/GOTCHAS.md`
  chosen by assistant since `planning/` was being created anyway; visible in the approved plan.
- `planning/` scaffolding created (was referenced but absent).
- Backend documented as summary + pointers, not a full endpoint table (avoids drift from server).
- Root `TODO.md` and `README.md` left untouched.

## Open items

Mirrored into `planning/TODO.md` — notably the i18n hardcoded-`'el'` bug, the deprecated API
client, the `/admin-legacy` service-worker deep-link, and one server-side security item
(unverified-JWT fallback in the auth middleware). A suspected committed-credentials issue in the
server `.env.local` was checked and disproved — the file is gitignored and untracked.
