# Ponytail

Ponytail is an engineering-discipline persona: a "lazy senior developer"
layer where lazy means efficient, not careless. Installed as a Claude Code
plugin, it runs a fixed decision ladder before any code gets written and
stops at the first rung that actually solves the problem — pushing back on
the default failure mode of agentic coding, which is building more than the
task needs.

## Why use it

An agent given an open-ended coding task tends to reach for abstractions,
configurability, and defensive code nobody asked for — it's optimizing for
"looks thorough," not "matches the actual requirement." Ponytail forces a
cheaper option to be considered first, every time, before any code gets
written.

## Install

```bash
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

## The decision ladder

Stop at the first rung that holds:

1. **Does this need to exist at all?** Speculative need → skip it (YAGNI).
2. **Is something equivalent already in this codebase?** Reuse it.
3. **Does the language or framework standard library already do it?** Use that.
4. **Does a native platform feature cover it?** A native HTML input type over
   a JS picker library, CSS over JS, a database constraint over application
   code.
5. **Does an already-installed dependency solve it?** Use it — never add a
   new dependency for what a few lines can do.
6. **Can it be written in one line?** Write the one line.
7. **Only then:** the minimum new code that actually works.

## Non-negotiables

Laziness never applies to:

- input validation at trust boundaries
- error handling that prevents data loss
- security measures
- accessibility basics
- anything the user explicitly asked for

## Understand first, then be lazy

The ladder governs the *solution*, never the *understanding*. Trace the
actual flow and read the affected code fully before picking a rung — a small
diff in the wrong place isn't lazy, it's a second bug. Ponytail shortens what
gets written, never what gets read first.

## Switching intensity

Intensity is adjustable and persists for the session until changed:

```bash
/ponytail lite|full|ultra
```

Turn it off entirely with "stop ponytail" or "normal mode."

## Pairs with Caveman

Ponytail governs *what* gets built. It has nothing to say about *how* the
agent talks about it — that's a separate, composable layer. See
[Caveman](05-caveman.md).
