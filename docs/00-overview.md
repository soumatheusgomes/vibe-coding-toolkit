# Overview

This is not a list of tools. It's a workflow, assembled piece by piece from
real day-to-day use, where each piece covers a failure mode the others don't.
Read this page first — the individual tool docs make more sense once you see
how they fit together.

## 1. Orchestration, not solo implementation

The main session's job is to plan, decide, and coordinate — not to write
code itself. Real work is delegated to named specialist subagents (a
backend agent, a database agent, a reviewer agent, and so on), dispatched in
parallel when their scopes don't overlap. A single generic agent trying to do
everything loses the thread on anything non-trivial; a set of narrowly
briefed specialists doesn't.

See [Subagent orchestration](tools/02-subagent-orchestration.md).

## 2. Brainstorm → plan → implement → review

Code is the last step, not the first. Requirements get explored before
anything is written, ambiguity gets resolved into an explicit plan, and the
plan gets executed against a review checkpoint — not "write code and hope
it's right." This discipline is what the orchestration layer above actually
executes.

## 3. A token-economy layer

Long agentic sessions burn tokens on routine, repetitive command output —
`git status`, `git diff`, test runs — that don't need to be read in full
every time. A command-rewriting proxy sits transparently in front of these
commands and returns a filtered, token-cheap version instead, so a session
can run for hours without the context window filling up with output nobody
reads.

See [Token proxy pattern](tools/03-rtk-token-proxy.md).

## 4. Two composable persona layers

Two independent behavioral layers stack on top of the base agent:

- **What gets built** — a lazy-engineer discipline that defaults to YAGNI:
  the simplest thing that solves the actual problem, no speculative
  abstractions, no unrequested configurability.
- **How the agent talks about it** — a terse, fact-dense communication style
  that reports results instead of narrating process.

They're independent because engineering discipline and communication style
are different problems — a verbose agent can still write lean code, and a
terse agent can still over-engineer. Composing two focused layers beats one
layer trying to do both.

See [Ponytail](tools/04-ponytail.md) and [Caveman](tools/05-caveman.md).

## 5. Quality gates as a tracked migration

Lint rules don't flip from off to error in one commit — that either blocks
everyone immediately or gets disabled out of frustration. Instead, new rules
land as warnings first, get burned down deliberately over time, and only
then get promoted to errors. The gate tightens; it's never sprung.

See [ESLint/Biome quality gates](tools/06-eslint-biome-quality-gates.md).

## 6. A code knowledge graph

Before touching an unfamiliar part of a codebase, an agent needs orientation:
what calls what, which modules are central, how a change's blast radius
spreads. Re-deriving that from scratch with grep every session is slow and
expensive. A persistent knowledge graph — god nodes, community structure,
cross-file relationships — answers that in one query instead of dozens of
exploratory reads.

See [Graphify](tools/07-graphify.md).

## 7. A two-tier memory system

Two tiers, matched to two problems:

- A small, always-loaded index for facts a session needs *before* it starts
  working — hard-won lessons, gotchas, decisions that would otherwise get
  rediscovered the hard way every time.
- A long-term, structured vault for everything else — searched on demand,
  unbounded in size, so the always-loaded index never bloats past the point
  where it gets ignored.

See [Claude memory system](tools/09-claude-memory-system.md) and
[Obsidian as memory](tools/08-obsidian-memory.md).

## Why this matters

None of these pieces is remarkable on its own — command filtering, a lint
migration, a memory index. The value is that they compose into one loop:
plan before building, delegate instead of solo-implementing, spend tokens
only on what matters, keep engineering lean, tighten quality gates instead
of springing them, and never relearn the same lesson twice. Pull just one
piece out and it's a minor convenience. Run all of them together and it's a
different way of working.
