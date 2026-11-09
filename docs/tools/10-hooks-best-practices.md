# Hook best practices

## What it is

A **hook**, in an AI agent such as Claude Code, is a small piece of code
that runs automatically at a specific point in the agent's workflow:
before or after a tool runs, when a session starts or ends, and so on.
The agent does not decide to invoke it: the **harness** (the layer
orchestrating the agent, Claude Code in this case) triggers the hook at
the right moment, consistently and without exception.

A hook's contract is narrow: it receives an event as **JSON** (a text
format representing structured data through key-value pairs) on
**standard input** (*stdin*, the channel a process reads when data does
not come from a file or command-line argument), and responds through its
**exit code** (the number a process returns on termination; by convention,
`0` means success), optionally with text on stdout/stderr. This narrow
contract, events through stdin and responses through exit codes, is where
most hook bugs live and what most of this document addresses.

Hooks are registered in harness configuration, usually
`.claude/settings.json` for Claude Code, indexed by lifecycle event:
`PreToolUse` (before a tool runs), `PostToolUse` (afterward), `SessionStart`
(when the session begins), `SessionEnd` (when it ends), `UserPromptSubmit`
(on each user message), and `Stop` (when the agent finishes and the session
is about to stop), among others. Each entry associates a **matcher** (a
filter, such as “only trigger for Bash”) with a command to execute. See
[`templates/settings.json.example`](../../templates/settings.json.example)
for a concrete configuration example.

## Why use it

### Fail-open is a policy, not a habit

**Fail-open** means allowing the original action to proceed normally when
the hook encounters an error, instead of blocking everything. The opposite,
blocking by default whenever something goes wrong, is **fail-closed**. It
has its place, but is not the general rule (see the FAQ below).

Write this choice as an explicit rule rather than an implicit habit: a
hook exits with `0` (allow) or a designated blocking code, and **only**
those two. Any other exit code, or an unhandled error crashing the process
partway through, is a bug in the hook itself.

This needs a written rule rather than assumed common sense because a hook
that crashes instead of degrading gracefully can lock a developer out of
their own session. A `SessionStart` hook throwing before printing anything
can prevent the session from starting, the worst place for failure because
there is no session left from which to debug it.

The default should be **silent degradation**: skip the reinforcement,
check, warning, or other extra behavior rather than block, unless it is a
hard security requirement. A hook adding a convenience, such as reminding
the agent of a project convention, should not fail the same way as one
enforcing a real security boundary, such as blocking credential-file reads.

### Exit 127: the hook never ran

A hook can fail before its first line executes. The harness starts the
registered command with **its own** environment, not the one from your
interactive terminal. Desktop apps, IDE integrations, and login shells often
skip `.zshrc`/`.bashrc`, so a Node installed through nvm or Volta, loaded only
by those files, is not on the hook's PATH. The shell then reports
`node: command not found` and exits with `127`.

Exit `127` is neither allow nor block. In Claude Code, any code other than
`0` and `2` is a non-blocking error, so the action proceeds: a security hook
such as the one in the tutorial below silently stops protecting. The same
hook works from the terminal CLI and fails from the desktop app, which makes
the cause easy to look for in the wrong place.

Launch the hook through
[`templates/hooks/node.sh.example`](../../templates/hooks/node.sh.example),
copied to `.claude/hooks/node.sh`: it uses `node` from PATH when present,
otherwise checks the common install locations, and exits with a readable
message instead of `127` when Node is missing. Register
`sh .claude/hooks/node.sh .claude/hooks/<hook>.mjs` instead of
`node .claude/hooks/<hook>.mjs`. A bare `node` remains fine when Node is
installed on the system PATH.

### The bug worth naming: `JSON.parse("null")`

This bug deserves a name because it is easy to write, difficult to notice
in review, and accidentally defeats the fail-open policy without anyone
doing anything obviously wrong.

`JSON.parse("null")` returns JavaScript `null` **without throwing**. It is
valid JSON, just like `"true"` or `"42"`. A seemingly defensive pattern
therefore does not actually protect you:

```javascript
let event;
try {
  event = JSON.parse(readStdin() || "{}");
} catch {
  event = {}; // never reached for `null` stdin — JSON.parse("null") does not throw
}

if (event.tool_name === "Bash") { // TypeError: Cannot read properties of null
  // ...
}
```

A stdin payload containing literal `null` is a nonempty, perfectly
parseable string. The `|| "{}"` fallback does not run because it is not
empty; `catch` does not run because parsing succeeded. Nothing went wrong
from the `try/catch` perspective. `event` silently becomes `null` rather
than the `{}` that `catch` was meant to guarantee. The crash happens on
the next line, at the first unguarded property read, **outside** any
`try/catch` protecting parsing itself.

A `typeof` check does not help either:

```javascript
typeof event.tool_name === "string" // still throws: Cannot read properties of null
```

Property access (`event.tool_name`) happens *before* `typeof` can inspect
the result, so access throws first and `typeof` never runs.

#### The fix

Two small reusable helpers solve this: `readStdinRaw` (reads raw stdin)
and `parseHookEvent` (interprets the text as an event), the same names used
in the ready-to-copy file linked at the end of this section:

- `readStdinRaw` reads stdin and **never throws**; any failure returns an
  empty string.
- `parseHookEvent` attempts to parse the string as JSON and returns `null`
  for **both** invalid JSON and literal JSON `null`, collapsing both
  failure cases into one signal.

```javascript
import { readFileSync } from "node:fs";

export function readStdinRaw() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

export function parseHookEvent(raw) {
  try {
    return JSON.parse(raw); // "null" becomes `null`, the same signal as a parse failure
  } catch {
    return null;
  }
}
```

No special case is required: `JSON.parse` already returns `null` for
literal `null` input, producing the same signal as `catch` for an actual
parse failure. Each call site then needs just one check:

```javascript
const event = parseHookEvent(readStdinRaw());
if (event === null) {
  process.exit(0); // fail open: nothing usable to act on
}
// ...continue the hook — `event` here is guaranteed to be an actual object
```

See [`templates/hooks/hook-io.mjs.example`](../../templates/hooks/hook-io.mjs.example)
for a ready-to-copy version of these two functions.

### Migration debt is real — document it instead of assuming

Do not assume a fix was applied uniformly just because most project hooks
import the shared helper. Some may remain unfixed while surviving “by
accident” for reasons unrelated to the fix:

- A different earlier check happens to catch `null`, such as optional
  chaining (`?.`) on the next property access.
- A broad `try/catch` around the entire handler happens to swallow this
  `TypeError`, despite not being written for this bug.

Both protections work today, but both are one code reorder or refactor
away from breaking because neither was written specifically for this bug.
Explicitly document which hooks were deliberately fixed and which are
accidentally safe, rather than assuming uniform coverage. Migrate the
latter opportunistically when they are next touched for another reason,
rather than as an urgent fix when nothing is currently broken.

## Step-by-step tutorial — writing a safe hook from scratch

Let's build a minimal real hook: a `PreToolUse` hook that warns and blocks
when the agent tries to edit a potentially sensitive file, such as `.env`.
It is small enough for a tutorial and uses the two helpers above.

### Step 1 — create the hook file

Create `.claude/hooks/protect-env-files.mjs`. Every hook here is a Node.js
module (`.mjs`, the ECMAScript module format used by modern JavaScript)
that reads stdin, makes a decision, and exits with a code.

### Step 2 — import the safe-reading helpers

```javascript
import { readStdinRaw, parseHookEvent } from "./hook-io.mjs";
```

If that file does not exist yet, copy
[`templates/hooks/hook-io.mjs.example`](../../templates/hooks/hook-io.mjs.example)
to `.claude/hooks/hook-io.mjs`: the two functions from the preceding
section, ready to use.

### Step 3 — read and parse the event with a safe default exit

```javascript
const event = parseHookEvent(readStdinRaw());
if (event === null) {
  process.exit(0); // nothing usable: fail open, avoiding accidental blocks
}
```

This is the first reflex of every hook: before anything else, ensure the
event is an actual object. Everything afterward assumes `event` is safe
to access.

### Step 4 — extract only what you need with a fallback

```javascript
const path = event?.tool_input?.file_path ?? "";
```

Optional chaining (`?.`) prevents a crash if `tool_input` is missing;
`?? ""` ensures `path` is always a string, even if empty, so the next
step, a regex test, never throws because it received `undefined`.

### Step 5 — decide and return the correct exit code

```javascript
const looksSensitive = /\.env(\..+)?$/.test(path);
if (!looksSensitive) {
  process.exit(0); // not what we are watching for: allow
}

console.error(
  `Warning: ${path} looks like a secrets file. Confirm before editing.`
);
process.exit(2); // block: the agent sees the message above as the reason
```

`/\.env(\..+)?$/` is a **regex** (regular expression, a text pattern for
matching strings with a particular format) recognizing names ending in
`.env` or `.env.something`. Here `2` is an example blocking code: check
your harness documentation for its “block with a message” code; Claude
Code uses `2`. The important discipline is using only `0` or the documented
blocking code, never a third value accidentally, such as an unhandled
exception terminating the process with `1`.

### Step 6 — the complete file

Combining steps 2 through 5:

```javascript
#!/usr/bin/env node
import { readStdinRaw, parseHookEvent } from "./hook-io.mjs";

const event = parseHookEvent(readStdinRaw());
if (event === null) {
  process.exit(0); // nothing usable: fail open
}

const path = event?.tool_input?.file_path ?? "";
const looksSensitive = /\.env(\..+)?$/.test(path);

if (!looksSensitive) {
  process.exit(0); // not what we are watching for: allow
}

console.error(
  `Warning: ${path} looks like a secrets file. Confirm before editing.`
);
process.exit(2); // block: the agent sees the message above as the reason
```

### Step 7 — register the hook

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/protect-env-files.mjs" }
        ]
      }
    ]
  }
}
```

### Step 8 — manually verify fail-open behavior

Before trusting the hook, test both extremes in the terminal, simulating
the harness's stdin payload:

```bash
# Normal event, nonsensitive file → should exit 0 and do nothing
echo '{"tool_input":{"file_path":"src/index.js"}}' | node .claude/hooks/protect-env-files.mjs; echo "exit: $?"

# Sensitive file → should exit 2 and print the warning
echo '{"tool_input":{"file_path":".env.local"}}' | node .claude/hooks/protect-env-files.mjs; echo "exit: $?"

# The bug this document aims to prevent → should exit 0, never crash
echo 'null' | node .claude/hooks/protect-env-files.mjs; echo "exit: $?"
```

If the third command prints a stack trace instead of `exit: 0`, the hook
still has the bug; return to Step 3.

These commands run with your terminal's PATH, where `node` is always found.
Repeat the last one with a minimal environment, closer to what a desktop or
IDE host provides:

```bash
# Interpreter lookup → should exit 0; exit 127 means the host cannot find node
echo 'null' | env -i HOME="$HOME" PATH=/usr/bin:/bin node .claude/hooks/protect-env-files.mjs; echo "exit: $?"
```

If it prints `exit: 127`, register the hook through the launcher described in
[Exit 127: the hook never ran](#exit-127-the-hook-never-ran) and run it
again with `sh .claude/hooks/node.sh` in place of `node`.

## Concrete examples

Two additional examples, in commented pseudocode, show fail-open outside
security blocking. Here the failing behavior is always an optional
improvement rather than a hard guardrail.

### Example 1 — reinforce a persistent behavior mode

```javascript
#!/usr/bin/env node
// UserPromptSubmit: reinforce an active mode, such as a response style,
// on each user message by reading a state file written at session start.
import { readFileSync } from "node:fs";
import { readStdinRaw, parseHookEvent } from "./hook-io.mjs";

const event = parseHookEvent(readStdinRaw());
if (event === null) {
  process.exit(0); // no usable event: continue without reinforcement
}

let state;
try {
  state = JSON.parse(readFileSync(".claude/state/active-mode.json", "utf8"));
} catch {
  process.exit(0); // missing or corrupt state is no reason to block the session;
                   // it simply means there is no active mode right now
}

console.log(JSON.stringify({
  hookSpecificOutput: { additionalContext: `Active mode: ${state.name}` },
}));
process.exit(0);
```

If the state file is missing or corrupt, the hook simply adds no reminder
to that message. The session proceeds normally without reinforcement.
Compared with blocking the entire user message over an unreadable state
file, this degradation is clearly acceptable.

### Example 2 — automatically format a file after editing

```javascript
#!/usr/bin/env node
// PostToolUse (Edit|Write): format the file just edited. If the formatter
// is missing or fails, the edit has already happened; blocking here
// cannot undo it and only gets in the way.
import { execFileSync } from "node:child_process";
import { readStdinRaw, parseHookEvent } from "./hook-io.mjs";

const event = parseHookEvent(readStdinRaw());
if (event === null) {
  process.exit(0);
}

const path = event?.tool_input?.file_path ?? "";
if (!path) {
  process.exit(0); // no path to format: nothing to do
}

try {
  execFileSync("npx", ["prettier", "--write", path], { stdio: "ignore" });
} catch {
  process.exit(0); // missing formatter or temporary syntax error:
                   // leave the file as it is without blocking
}

process.exit(0);
```

Both examples share the same principle: the hook adds something, such as
context reinforcement or automatic formatting, rather than enforcing a
hard boundary. Any intermediate failure must mean the session continues
without the extra, never that it becomes blocked.

## Hook category catalog

This is an optional client-hook reference, not a mandatory installation list. Bootstrap does not install Git hooks or edit/push blockers on `main`.

As a project's hook collection matures, several categories tend to recur.
They are useful references even before all are needed:

- **Rewrite or reinforce a proposed terminal command** before execution.
  See [RTK — CLI token proxy](03-rtk-token-proxy.md).
- **Inject orientation context** before broad searching or reading,
  installing itself on first use. See [Graphify](07-graphify.md).
- **Block direct filesystem access** in a protected folder and redirect to
  a safer structured tool. See [Obsidian as memory](08-obsidian-memory.md).
- **Scan content before writing**, looking for accidentally committed
  secrets: API keys, passwords, and access tokens.
- **Automatically format a file** immediately after editing.
- **A pair of session-start and session-end hooks** recording a running
  session log, then compiling it into permanent notes.
- **A completion hook** performing final checks, such as tests and build,
  before the session can be considered complete.

## Tips and pitfalls

- **Fail-open is not always right.** Reserve fail-closed, blocking on
  errors, for cases where allowing access is worse than disruption: real
  security rather than convenience. Uncertainty about which policy a new
  hook needs is itself a reason to document the decision alongside code.
- **`?.` (optional chaining) and `?? value` (nullish coalescing, replacing
  `null`/`undefined` with a default) address most unsafe accesses**, but
  neither replaces the `=== null` check immediately after parsing. They
  protect accesses after you know you have an object, rather than parsing
  itself.
- **Test failures as well as the happy path.** Tutorial Step 8, sending
  literal `null` through stdin, is the cheapest test for this specific bug
  and the easiest to forget because the happy path comes to mind first.
- **Exit `127` points at the environment, not the script.** Rerun the
  registered command with `env -i HOME="$HOME" PATH=/usr/bin:/bin` before
  debugging the hook's code.
- **A convergence worth noticing:** [Ponytail](04-ponytail.md) and
  [Caveman](05-caveman.md), independently built to maintain persistent
  behavior modes throughout a session, arrived at the same hook
  architecture without coordinating: a session-start hook writes state
  and injects active rules in its output, then a `UserPromptSubmit` hook
  reinforces the mode on every message. Neither copied the other, which
  reasonably suggests that saving state at the start and reinforcing it
  each turn is the appropriate solution rather than an implementation
  coincidence.

## Frequently asked questions

**Can a hook really lock me out of my own session?**
Yes. The worst case is a `SessionStart` hook throwing an unhandled
exception before printing any output. If the harness waits for a response
before releasing the session and the hook never returns anything coherent,
the session may never start. Fail-open is designed to prevent this.

**Does fail-open apply to security hooks too?**
Not necessarily: this is the explicit exception. A hook enforcing a hard
security boundary, such as refusing direct access to a credentials folder,
can and usually should fail **closed**. If it cannot assess the situation
confidently, blocking is safer than allowing. The fail-open rule described
here concerns optional improvements rather than the few real security
barriers.

**Must I use these exact two helpers?**
No: file and function names do not matter. The shape matters: a stdin
reader that never throws and a parser that treats invalid JSON and literal
`null` as the same “nothing usable” signal. Any implementation preserving
that shape solves the same problem.

**Which code blocks execution — always `2`?**
It depends on the harness. Claude Code uses `2`, with stderr shown to the
agent; other harnesses may use a different convention. Check your harness
documentation. The shared discipline is using only `0` or the documented
code, never accidentally allowing a third value to escape.

**How can I tell whether a project hook is fixed or merely accidentally
safe?**
You cannot unless someone documented it explicitly. That is why the
migration-debt section recommends recording the decision rather than
assuming uniform coverage. A short comment in the hook is enough, such as
“uses parseHookEvent: fixed” versus “not migrated yet; the broad try/catch
covers it for now.”
