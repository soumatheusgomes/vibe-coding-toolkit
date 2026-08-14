# Claude Memory System

## What it is

A lightweight, file-based pattern for giving an agent persistent memory
across sessions, without a database or a service — just files the agent
reads at the start of every session and writes to occasionally. It sits at
the opposite end of the weight spectrum from
[08-obsidian-memory.md](08-obsidian-memory.md)'s vault: no MCP server, no
graph, no PARA structure — one small index file and a folder of topic
files.

## Why use it

Most of what an agent could "remember" isn't worth remembering — it's
derivable by reading the code again. What's actually valuable is the small
set of things that were expensive to learn the first time: a mistake that
took several corrections to fix, an architectural choice that only makes
sense once you know what was tried and rejected, a business rule the code
doesn't spell out. A memory system's whole job is capturing *that* narrow
slice cheaply enough that it's actually maintained, instead of either being
skipped — nothing gets saved — or overused — everything gets saved and the
index becomes too large to load.

## Structure

- **`MEMORY.md`** — one always-loaded index file, one line per entry. Keep
  it short: a soft cap around 130 lines keeps it from bloating every
  session's context just by existing.
- **Topic files** — one small file per memory, with frontmatter:

```markdown
---
name: kebab-case-slug
description: one-line summary — used to decide relevance in future sessions
metadata:
  type: feedback | architecture | business-rule | reference
---

The fact or rule itself, why it matters, and when it applies.
```

`type` is a fixed small set — `feedback` (a mistake corrected during a
session), `architecture` (a pattern discovered only after failed attempts),
`business-rule` (something that affects code but isn't obvious from reading
it), or `reference` (where external information lives — a dashboard, a
wiki, a tracker).

## How to use

Load the index at the start of a session — or wire it into your project
instructions so it's always loaded — and scan it before acting on anything
non-trivial. Before writing a new entry, apply one literal test:

> Would a future session be surprised and grateful to know this before
> starting?

If not, don't save it. That test explicitly excludes:

- Anything derivable by just reading the code or git history.
- Deadlines, motivations, or other temporary project context.
- Debug steps or fix recipes — the commit message already has that.
- Anything already documented elsewhere in the project's own instructions.

## Growth policy

Once the index passes its soft cap, low-value entries don't get deleted —
they get **migrated** to a long-term store (a wiki, a vault, a docs folder;
whatever your project already uses for long-form notes) through a fixed
sequence, in order:

1. **Dedup** — search the long-term store for the same topic; extend an
   existing note instead of creating a duplicate.
2. **Match the target shape** — long-term stores often enforce their own
   template or required frontmatter; fetch it and match it exactly.
3. **Create** the entry in the long-term store.
4. **Confirm** — read the newly created entry back. No successful read
   means the migration did not happen.
5. **Only then**, delete the short-term file and its line in `MEMORY.md`.

Never skip straight to step 5. An unconfirmed migration is data loss, not a
move — the entry existed nowhere for however long it takes to notice the
mistake. When genuinely unsure whether an entry still earns its place in
the fast index, leave it there; migrating later costs nothing, but a lesson
lost from both places is expensive to relearn.

## The generalizable idea

Whether the long-term store ends up being Obsidian (see
[08-obsidian-memory.md](08-obsidian-memory.md)), a wiki, or a plain docs
folder doesn't matter. What generalizes is the two-tier design itself: a
cheap, always-loaded index for anything currently worth surfacing
automatically, and a deliberate, confirmed promotion path to unlimited
long-term storage once something earns a permanent home. The fast tier
stays small on purpose; the long-term tier has no size limit, because it's
never loaded automatically.
