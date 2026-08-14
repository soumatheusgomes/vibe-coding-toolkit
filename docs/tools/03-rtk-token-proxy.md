# Token Proxy Pattern

A CLI proxy that sits between a coding agent and the shell, rewriting common
read-only commands — status/log/diff/grep/find/ls-style operations — into
token-compact equivalents before they run. It's transparent to the agent: no
added prompt overhead, no extra round trip, just a cheaper result for the
same request.

This page documents a personal, not-publicly-published tool (called `rtk`
below, as a placeholder) as a **pattern**, not a product — there's no
package to install. Treat it as a blueprint for building your own
equivalent.

## Why use it

Long agentic sessions run the same handful of read-only shell commands over
and over. Run raw, these can dump thousands of tokens of output the agent
skims once and discards. A token proxy intercepts exactly these commands and
hands back only what's useful — and because the rewrite happens in a hook,
outside the conversation, it costs nothing to keep active: no system-prompt
instruction to re-read every turn, no chance the agent forgets to use it.

## How it works

1. A PreToolUse-style hook matches on the shell-execution tool (e.g. Bash).
2. The hook receives the proposed command as JSON on stdin.
3. It pattern-matches known-safe, read-only commands and rewrites them to a
   token-compact proxy binary.
4. Anything unrecognized passes through completely unchanged.
5. It's written **fail-open**: if the proxy binary is missing or errors, the
   hook exits cleanly so the original command still runs instead of
   blocking the developer. See [Hooks best practices](10-hooks-best-practices.md)
   for the general fail-open pattern this depends on.

## Building your own

A sketch of the hook — real field names depend on your agent's hook API.
`hook-io.mjs.example` (`../../templates/hooks/hook-io.mjs.example`) is a
stdin-JSON reader you can vendor for this:

```js
#!/usr/bin/env node
// PreToolUse hook, illustrative — not the real tool's source.
import { readStdinJson } from "./hook-io.mjs";
import { execFile } from "node:child_process";
import { access } from "node:fs/promises";

const PROXY_BIN = "/usr/local/bin/proxy";
const REWRITABLE = /^(git status|git diff|git log|grep|find|ls)\b/;

const event = await readStdinJson();
const command = event?.tool_input?.command ?? "";

if (!REWRITABLE.test(command)) {
  process.exit(0); // not recognized — original command runs untouched
}

try {
  await access(PROXY_BIN);
} catch {
  process.exit(0); // proxy not installed — fail open
}

execFile(PROXY_BIN, ["run", command], (err, stdout) => {
  if (err) {
    process.exit(0); // proxy errored — fail open, original command runs
    return;
  }
  // Block the original (expensive) command; hand back the compact result
  // directly so the agent sees an answer, not a retry prompt.
  console.log(JSON.stringify({ decision: "block", reason: stdout }));
  process.exit(0);
});
```

## Meta-commands stay unfiltered

The proxy also exposes its own direct entry points — these must be excluded
from the rewrite rules themselves, or the proxy would end up rewriting its
own invocations:

- a **stats** command reporting cumulative token savings
- a **history** command showing which commands were rewritten and what each
  one saved
- a **raw/passthrough** escape hatch that runs a command completely
  unfiltered, bypassing the proxy's own parsing entirely

The escape hatch matters more than it looks — see the gotcha below.

## Gotchas

**A transparent rewrite can silently change what a flag means.** If the
proxy's own argument parser happens to overlap with the wrapped tool's
flags, a rewrite can misfire. Concrete example: a command using `-h` as a
tool-specific flag gets intercepted as the proxy's *own* `--help` flag
instead — the rewritten command prints the proxy's help text instead of
doing the original job. Nothing crashes; the agent just silently gets the
wrong output.

Lessons:

- Always ship the raw/passthrough escape hatch above, so any rewrite can be
  bypassed on demand.
- Don't assume rewritten output is equivalent to the original without
  checking — especially for less-common flags the proxy's parser was never
  built against.
