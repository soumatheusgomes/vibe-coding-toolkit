# Parallel Subagent-Driven Development

## Problem

The base subagent-driven-development pattern dispatches one implementer at a
time. That default is safe — but slow when a plan contains genuinely
independent tasks. The naive fix, dispatching every task in parallel, is
fast but unsafe in two specific ways:

- Two agents can edit the same file concurrently, and one's write silently
  clobbers the other's.
- Two agents can race each other to `git commit`, interleaving unrelated
  changes into a single commit or committing against a stale HEAD.

This rule describes when full parallel dispatch is safe, and how to
structure it so it stays safe.

## Why this override is safe

Both failure modes above are removed structurally, not by discipline or
convention:

- **File collisions** are prevented by only ever forming a wave from tasks
  whose file sets are fully disjoint. If two tasks might touch the same
  file, they never run in the same wave.
- **Commit races** are prevented by removing self-committing from
  implementers entirely. Implementers leave their changes in the working
  tree; the controller commits every task's changes itself, one at a time,
  after the wave finishes.

Because both preconditions that make parallel dispatch dangerous are
structurally absent, running independent tasks concurrently is no riskier
than running them serially — it's just faster.

## Task tagging

At plan time, every task gets two fields:

- **`Files:`** — the exact file paths or globs the task will create or
  modify.
- **`Depends-on:`** — the IDs of tasks whose output this task consumes, or
  `none`.

If either field is missing, or there's genuine uncertainty about what a
task touches or depends on, treat the task as depending on everything
before it. This is the fail-safe: an under-specified task silently
degrades to serial execution instead of risking a false-parallel bug.
Never guess a narrower scope than you actually know.

## Wave formation rule

Two tasks belong in the same wave if and only if **both** hold:

1. Neither task is in the other's `Depends-on` chain, even transitively.
2. Their `Files` sets are fully disjoint.

If either condition fails, the later or colliding task moves to a
subsequent wave.

A fully linear dependency chain (task 2 depends on task 1, task 3 depends
on task 2, …) degrades to exactly one task per wave — identical to plain
serial execution. There's no regression versus not using this rule at all;
it only adds concurrency where the plan actually has it.

## Per-wave execution loop

For each wave, in order:

1. Write one task-brief file per task in the wave.
2. Dispatch every implementer in the wave in a single message. This is the
   only step where real parallelism happens.
3. Implementers do **not** commit. Each one leaves its changes in the
   working tree and reports back which files it touched.
4. The controller commits per task, in wave order — capturing the current
   HEAD fresh immediately before each commit, never a stale or hardcoded
   ref.
5. Once commits exist for the wave, dispatch that wave's task reviewers
   together. This is safe because review is read-only — each reviewer is
   scoped to its own task's commit range.
6. Make exactly one controller-owned log or ledger write for the whole
   wave, not one per task. Concurrent per-task writes to the same log race
   each other and lose updates; a single write after the wave completes
   doesn't.

## Escape hatch

Sometimes two tasks genuinely can't avoid touching the same files. When
that happens, don't force them into a shared wave — isolate each
implementer in its own git worktree or branch instead, so self-committing
becomes safe again inside that isolated copy.

This is expensive: real disk space and setup cost per isolated agent. Use
it as a last resort for the rare unavoidable collision, not as a default
way to parallelize.

## What this does not change

This rule changes orchestration only:

- The specialist type dispatched for each task still comes from your
  project's specialist-routing table, matched to the task's file scope —
  this rule doesn't add or replace agent types.
- The prompt body given to each implementer and reviewer is still the base
  skill's own unmodified contract: ask questions first if the task is
  ambiguous, follow TDD, self-review before reporting, and return an
  explicit status on completion.

Nothing here changes what an agent does with a task. It only changes how
many tasks run at once, and who is allowed to commit.
