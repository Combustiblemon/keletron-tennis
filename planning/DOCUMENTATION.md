# Documentation conventions

How work in this repo is documented. Referenced by [CLAUDE.md](../CLAUDE.md).

## Implementation docs

Every implementation (feature, fix, refactor — anything that changes the repo) gets one file in
[implementations/](implementations/), written as part of the work itself, not afterwards.

- **Filename:** `YYYY-MM-DD-<short-slug>.md` (date the work was done)
- **Sections, in order:**
  1. **What was built** — one or two paragraphs, plain language.
  2. **Files touched** — list of created/modified/deleted paths, one line each with a short note.
  3. **Key decisions** — each decision, what was chosen, and *who* decided (developer ruling vs.
     bug-fix judgment call). Design decisions must trace back to the developer per CLAUDE.md.
  4. **Open items** — anything left undone, deferred, or discovered along the way. Mirror these
     into [TODO.md](TODO.md).

## TODO.md

[TODO.md](TODO.md) is the living work list. Tick items off and add new ones in the same change
that affects them. Convert relative dates to absolute. The root-level `TODO.md` is the
developer's own list — do not edit it.

## GOTCHAS.md

[GOTCHAS.md](GOTCHAS.md) lists legacy/dead code and known bugs. When a gotcha is fixed or dead
code is removed, delete its entry in the same change. When new legacy traps are discovered, add
them.
