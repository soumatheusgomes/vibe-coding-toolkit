# Obsidian as Memory

An Obsidian vault — plain Markdown files on disk, arranged in a folder
convention — used as a project's long-term memory. Every reader or writer
touches it exclusively through an MCP server that exposes vault operations
as structured tools, never through direct filesystem access. That's what
keeps it from turning into just another pile of drifting notes: every write
goes through validation — required frontmatter, a template per folder,
wikilink checks, a consistent slug and tag style — instead of an ad-hoc file
edit that quietly breaks the convention.

## Why use it

A single always-loaded memory index (see
[Claude memory system](09-claude-memory-system.md)) has to stay small to
stay useful — bloat it and it gets skimmed instead of read. Most of what's
worth remembering about a project doesn't belong there: it's too specific,
too rarely needed, or would push the index past the size where it's still
worth loading every session. A vault is where that long tail goes — searched
on demand, unbounded in size, structured enough that a search actually finds
what it's looking for.

## Structure

A generic PARA-style layout:

- a folder for **active projects** — work with a defined end state
- a folder for **ongoing areas** — responsibilities with no end date
- a folder for **consolidated knowledge** — timeless, reusable lessons
- a folder for **reference resources**
- a folder for a **running daily/session log**
- a **templates** folder defining the required shape for each of the above

## Install

Several open-source MCP servers expose an Obsidian vault (or any Markdown
folder) as a set of tools. Search an MCP registry for "obsidian" and pick
one that supports enforced templates and frontmatter if you want this exact
pattern — no single server is named here, since which one to recommend
isn't settled.

## Enforcing MCP-only access mechanically

A written rule saying "always use the MCP tools" gets forgotten mid-session
under context pressure. Enforce it with a hook instead: a PreToolUse hook
that denies any direct `Read`/`Grep`/`Glob`/`Write`/`Edit` call whose path
touches the vault directory. A narrow read-only carve-out for the daily-log
folder is fine, if useful — everything else in the vault stays MCP-only.

Same stdin-JSON reader as the token proxy hook
(`../../templates/hooks/hook-io.mjs.example`):

```js
#!/usr/bin/env node
// PreToolUse hook — matcher: Read|Grep|Glob|Write|Edit
(async () => {
  const { readStdinJson } = await import("./hook-io.mjs");
  const event = await readStdinJson();

  const path =
    event?.tool_input?.file_path ??
    event?.tool_input?.path ??
    event?.tool_input?.pattern ??
    "";

  if (!path.includes("vault/")) process.exit(0); // not the vault — allow

  const isDailyRead =
    path.includes("vault/daily/") && ["Read", "Grep", "Glob"].includes(event.tool_name);
  if (isDailyRead) process.exit(0); // narrow read-only carve-out

  console.error("vault/ is MCP-only — use the vault's MCP tools, not direct file access.");
  process.exit(2); // block, message shown to the agent
})();
```

## Automating capture and consolidation

Two scheduled hooks close the loop instead of relying on the agent to
remember to do it:

- A **SessionEnd** hook appends a short summary of the session to today's
  daily note.
- A **SessionStart** hook, on a later day, promotes yesterday's daily notes
  into permanent knowledge notes, then deletes the now-redundant raw daily
  log once it's compiled.

This keeps the daily folder a rolling scratchpad instead of a second
permanent store competing with the knowledge folder.

## Migrating from the always-loaded index

The always-loaded index and the vault aren't two competing stores — there's
an explicit migration path from one to the other, for when an index entry
stops earning its place in something that's read every session:

1. **Dedup** — search the vault first; extend an existing note instead of
   creating a duplicate.
2. **Match the template** — fetch the target folder's required template and
   match it exactly.
3. **Create** the note.
4. **Confirm** by reading it back — no successful read means the migration
   didn't happen.
5. **Only then** delete the short-term copy from the always-loaded index.

See [Claude memory system](09-claude-memory-system.md) for the index side of
this — what belongs there instead of here, and the same migration path
described from that end.
