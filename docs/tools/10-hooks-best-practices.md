# Hooks Best Practices

## What it is

A hook is a small script your Claude Code harness runs automatically around
tool calls and session lifecycle events — before a tool runs, after it
runs, when a session starts, when it ends. It reads a JSON event on stdin
and communicates back through its exit code (and optionally stdout/stderr).
That narrow contract is also where most hook bugs live, which is what most
of this doc is about.

## Enable

Hooks are registered in your Claude Code settings, keyed by lifecycle event
(`PreToolUse`, `PostToolUse`, `SessionStart`, `SessionEnd`,
`UserPromptSubmit`, `Stop`, and others), each entry pairing a matcher with a
command to run. See
[`templates/settings.json.example`](../../templates/settings.json.example)
for a concrete wiring.

## Fail-open is a policy, not a habit

Write it down as an explicit rule, not an implicit habit: a hook exits `0`
(allow) or a designated block code — and *only* those. Any other exit code,
or an uncaught crash, is a bug in the hook itself, full stop.

The reason this has to be explicit: a hook that crashes instead of
degrading gracefully can lock a developer out of their own session — a
`SessionStart` hook that throws before it prints anything can block the
session from starting at all. Default to **silently skipping the
enhancement** rather than blocking, for anything short of a hard safety or
security requirement. A hook that adds a nice-to-have and a hook that
enforces a real boundary should not fail the same way when something goes
wrong.

## A specific, worth-naming bug class: `JSON.parse("null")`

This one is worth calling out by name because it's easy to write, hard to
notice, and defeats the fail-open policy above by accident.

`JSON.parse("null")` returns the JavaScript value `null` — **without
throwing**. It's valid JSON. So a seemingly-defensive pattern like this
doesn't actually protect you:

```javascript
let event;
try {
  event = JSON.parse(readStdin() || "{}");
} catch {
  event = {}; // never reached for stdin `null` — JSON.parse("null") doesn't throw
}

if (event.tool_name === "Bash") { // TypeError: Cannot read properties of null
  // ...
}
```

A stdin payload of literal `null` is a non-empty, perfectly parseable
string, so the `|| "{}"` fallback never fires and the `catch` block never
runs — nothing failed. `event` just silently becomes `null` instead of the
`{}` the `catch` branch was supposed to guarantee. The crash happens one
line later, on the very next unguarded property read, outside whatever
`try/catch` was protecting the parse itself.

A `typeof event.x` guard does not save you here either:

```javascript
typeof event.tool_name === "string" // still throws: Cannot read properties of null
```

The property access (`event.tool_name`) happens *before* `typeof` gets to
see its result — so the read throws first, and `typeof` never runs.

### The fix

Two small, reusable helpers close this for good:

- One function reads stdin and **never throws** — any failure returns an
  empty string.
- A second function tries to parse that string and returns `null` for
  *both* unparseable JSON *and* the literal JSON `null` value — collapsing
  two failure modes into one.

```javascript
import { readFileSync } from "node:fs";

function readStdinRaw() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function parseHookEvent(raw) {
  try {
    return JSON.parse(raw); // "null" parses to the value `null` — same shape as a parse failure
  } catch {
    return null;
  }
}
```

No special-casing needed: `JSON.parse` already returns the value `null` for
literal `null` input, so the same `catch` block that handles a genuine parse
failure handles this case for free. Every call site then needs exactly one
guard:

```javascript
const event = parseHookEvent(readStdinRaw());
if (event === null) {
  process.exit(0); // fail open — nothing usable to act on
}
```

See [`templates/hooks/hook-io.mjs.example`](../../templates/hooks/hook-io.mjs.example)
for a copy-pasteable version of both functions.

### Migration debt is real — track it, don't assume it

Don't assume a fix like this is applied uniformly just because most hooks
in a project already import the shared helper. Some may still be unpatched
but **accidentally safe**, for reasons that have nothing to do with the
fix:

- A different guard already runs first and happens to catch the `null`
  case incidentally — optional chaining on the very next access, say.
- A broad `try/catch` wraps the whole handler and happens to also swallow
  this specific `TypeError`, even though it wasn't written with this bug in
  mind.

Both of those are real, working protection today — and both are one
reordering or one refactor away from breaking, because neither was written
*as* protection against this bug. Track which hooks are patched
deliberately versus safe by accident, explicitly, rather than assuming
uniform coverage. Migrate the accidental ones opportunistically, the next
time each is touched for an unrelated reason — not as an urgent fix, since
nothing is broken right now.

## A short catalog of hook categories

As a project's hook harness matures, these categories tend to show up:

- **PreToolUse — rewrite or augment a proposed shell command** before it
  runs. See [03-rtk-token-proxy.md](03-rtk-token-proxy.md).
- **PreToolUse — inject orientation context** before a broad search or
  read, self-installing its own prerequisite on first use. See
  [07-graphify.md](07-graphify.md).
- **PreToolUse — block direct filesystem access to a protected directory**
  and redirect the agent to a safer, structured tool instead. See
  [08-obsidian-memory.md](08-obsidian-memory.md).
- **PreToolUse — block edits on a protected branch** (e.g. refuse a direct
  write to `main`).
- **PreToolUse — scan content before it's written** for accidentally
  committed secrets.
- **PostToolUse — auto-format a file** immediately after it's edited.
- **SessionStart / SessionEnd pair — persist a running session log**, later
  compiled into permanent notes.
- **Stop — run a final verification pass** (tests, build) before the
  session is allowed to consider itself done.

## A convergence worth noticing

Two independently-built "persistent behavioral mode" tools —
[04-ponytail.md](04-ponytail.md) and [05-caveman.md](05-caveman.md) —
arrived at the exact same hook architecture without coordinating with each
other:

- A `SessionStart` hook writes a small flag/state file and emits the active
  ruleset as hook output.
- A `UserPromptSubmit` hook re-tracks and reinforces that mode on every
  subsequent turn.

Neither tool copied the other. That's good evidence this is simply the
right general shape for "make an agent hold a behavior across a long
session" — independent of which specific tool you're building.
