# Caveman

Caveman is a communication-compression layer: a Claude Code plugin that
strips filler words, hedging, and pleasantries from the agent's own prose.
It's independent of and composable with [Ponytail](04-ponytail.md) —
Ponytail governs what gets built, Caveman governs how the agent talks about
it.

## Why use it

Agent prose defaults to padded — "I'll go ahead and...", "It looks like this
might potentially...", "Great question!" — none of which changes what got
done. Caveman removes the padding without removing information: numbers,
units, code, and exact error text pass through untouched.

## Install

```bash
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
```

## What gets compressed

Filler words, hedging, and pleasantries — the parts of a response that exist
to sound polite or thorough rather than to convey something new.

## What never changes

- **Negation words** — not, never, no, only, except. Dropping one of these
  would flip the sentence's actual meaning, so compression leaves them
  alone.
- **Numbers and units.**
- **Code and exact error text.**
- **The user's own language.** Caveman compresses style, not language — it
  keeps answering in whatever language the user is writing in.

## Auto-clarity override

Compression turns off automatically for:

- security warnings
- confirmations before irreversible actions
- anywhere compressing the sentence would itself create technical ambiguity

Clarity wins over brevity exactly where it matters most.

## Switching intensity

```bash
/caveman
```

Sets the intensity level for the session — independent of, and alongside,
Ponytail's own switch command.

## Companion commands

- `/caveman-commit` — generate a terse commit message
- `/caveman-review` — one-line code review comments
- `/caveman-stats` — session token usage and cumulative savings
- `/caveman-init` — drop the always-on activation rule into a repo for every
  IDE agent, not just this one

## Pairs with Ponytail

See [Ponytail](04-ponytail.md) for the companion layer that governs what
gets built rather than how it's described.
