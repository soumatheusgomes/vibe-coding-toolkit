# Parallel Wave Dispatch

Use this to turn a list of tasks — from a plan, an epic, or a batch of
independent fixes — into safe parallel execution instead of one agent
working through them serially. The two rules in step 2 (no dependency, no
file overlap) are what make concurrent agents safe to run at all; skip
either and you get silent conflicts, or a wave that wasn't actually
independent. Directly implements the pattern in [subagent
orchestration](../tools/02-subagent-orchestration.md) and [the parallel
dispatch rule
template](../../templates/rules/parallel-subagent-driven-development.md).

```
Break [FEATURE/PLAN/TASK LIST] into parallel execution waves. Follow this
exactly — the safety of running multiple agents at once depends on the
rules below, not on judgment calls made in the moment.

## 1. List every task
For each unit of work, write:
- **ID** — short and stable (T01, T02, ...).
- **Description** — one line.
- **Files:** — every path/glob this task will create or modify. Be exact;
  when in doubt, list more rather than fewer.
- **Depends-on:** — task IDs whose output this task needs, or `none`.
- **Owner:** — the specialist role responsible (e.g. [BACKEND_ROLE],
  [FRONTEND_ROLE], [DB_ROLE], [TEST_ROLE] — use whatever roles this
  project defines).

Any task where `Files:` or `Depends-on:` is uncertain gets `Depends-on:
everything already listed` — that's the safe default, not a shortcut to
skip filling it in.

## 2. Group into waves
Two tasks go in the **same wave** only if BOTH hold:
1. Neither depends on the other, directly or transitively.
2. Their `Files:` sets are completely disjoint — zero overlap.

If either fails, put the dependent (or file-colliding) task in a later
wave. A task with no valid same-wave partner is simply a wave of one —
that's correct, not a failure of the grouping.

Show the result as a table: wave number, task IDs in it, owner per task.

## 3. Execute each wave, in order
For every wave:
1. **Dispatch every implementer in the wave in a single batch** — this is
   what makes it parallel instead of a string of sequential turns.
2. **Implementers do not commit.** They implement, verify their own work,
   and report exactly which files changed — and stop there.
3. **The orchestrator commits**, one task at a time, in a fixed order:
   right before each commit, capture the current HEAD fresh (never reuse a
   HEAD captured earlier, never assume `HEAD~1`), stage that task's files,
   commit.
4. **That wave's reviewers run together, after all its commits exist** —
   dispatch them in one batch too, each reviewing their task's own
   before/after range.
5. Only once every task in the wave is committed and reviewed, move to
   the next wave.

Plan/task list: [FEATURE/PLAN/TASK LIST].
```

- Default to `Depends-on: everything already listed` for anything
  uncertain — worst case you lose some parallelism, not gain a race
  condition.
- Fixed commit order per wave (not "whichever task finishes first") keeps
  HEAD easy to reason about — capture it immediately before that task's
  own commit, never earlier.
- When two tasks genuinely can't avoid touching the same files, treat that
  as a signal to merge them into one task or isolate them in separate
  worktrees — not to force them into the same wave.
