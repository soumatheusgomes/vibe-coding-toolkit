# Memory Bootstrap

Use this when starting a fresh project — or retrofitting an existing one —
that has no persistent memory yet, before an agent re-learns the same
hard-won lesson every single session. It sets up a small, always-loaded
index for what a session needs to know before it starts working, plus a
disciplined migration path to a larger long-term store so the index never
bloats past the point where it stops getting read. Modeled on [the Claude
memory system](../tools/09-claude-memory-system.md) for the index tier and
[Obsidian as memory](../tools/08-obsidian-memory.md) for the long-term
tier.

````
Set up a two-tier memory system for this project: a small always-loaded
index for facts a session needs before it starts working, and a place for
everything else that doesn't need to load every time.

## 1. Tier one — the always-loaded index
Create:
- `[MEMORY_DIR]/INSTRUCTIONS.md` — the rules below, wired into whatever
  this project auto-loads at session start (e.g. [CONFIG_FILE]), so every
  session reads them without being asked.
- `[MEMORY_DIR]/MEMORY.md` — the index itself: one line per saved fact,
  linking to its own topic file.
- `[MEMORY_DIR]/` as a folder for individual topic files, each with
  frontmatter:
  ```
  ---
  name: kebab-case-slug
  description: one-line summary — used to judge relevance in a future session
  metadata:
    type: feedback | architecture | business-rule | reference
  ---
  ```

## 2. What's worth saving — the narrow test
Save a memory only when the answer to this is yes: **would a future
session be surprised and grateful to know this before starting, rather
than discovering it the hard way?**

Concretely:
- Derivable by reading the code or git history → don't save it.
- A deadline, a motivation, or anything temporary to right now → don't
  save it.
- A debugging recipe that belongs in a commit message → don't save it.
- A mistake a session made that had to be corrected, an architecture
  pattern found only after failed attempts, a business rule invisible in
  the code, or where to find something outside the repo (a dashboard, a
  wiki, a channel) → save it.

Err toward not saving. A memory nobody needed is clutter; a lesson
relearned the hard way is expensive — but a small, high-signal index beats
a large, ignored one every time.

## 3. Growth policy — keep the index small forever
Before adding a new entry, count the index's non-blank lines. Past
[LINE_CAP] (e.g. 130), sanitize first:
1. Score every existing entry: recency × specificity × likelihood of
   preventing a real future mistake.
2. For each low-scoring entry, migrate it out — never just delete it —
   in this exact order:
   1. **Dedup** — search the long-term store (below) for the same topic;
      extend an existing note instead of creating a duplicate.
   2. **Match the target's template** — long-term notes may have their
      own required structure; follow it exactly.
   3. **Create** the note in the long-term store.
   4. **Confirm** — read the note back. No successful read, no deletion.
   5. **Only then** delete the entry from the index and its topic file.
3. Rewrite the index with only what's left.
4. Then add the new entry.

Deleting before the read-back confirms is data loss, not cleanup. If
unsure whether an entry still earns its place, leave it — migrating later
costs nothing.

## 4. Tier two — the long-term store
[If this project has a long-term vault/wiki already: name it explicitly —
e.g. "migrate low-value entries to [VAULT_TOOL/LOCATION], accessed via
[HOW — MCP tool, CLI, direct file edit]." If nothing like that exists yet,
say so and stop after tier one; don't invent a destination for entries the
cap will eventually need to shed.]

Project: [PROJECT NAME/STACK].
````

- The save criterion in step 2 is deliberately narrow — most things an
  agent learns in a session aren't memory-worthy. Resist logging
  everything "just in case."
- The migrate-before-delete order in step 3 exists because an unconfirmed
  migration is data loss, not a move — never skip straight to deleting the
  index entry.
- If there's no long-term store yet, ship tier one alone rather than
  inventing a destination — see [Obsidian as
  memory](../tools/08-obsidian-memory.md) for what standing one up looks
  like.
