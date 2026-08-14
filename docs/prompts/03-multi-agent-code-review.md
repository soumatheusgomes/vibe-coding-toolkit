# Multi-Agent Code Review

Use this before merging any non-trivial change, instead of relying on one
reviewer pass that inevitably favors whatever lens that reviewer defaults
to. Running several narrow specialists in parallel surfaces more real
issues than a single generalist pass — but only if the synthesis step
actually discards noise instead of just concatenating everyone's output,
which is what most of this template is about.

```
Review [DIFF/PR/BRANCH] using a panel of independent specialist reviewers,
then synthesize their findings into one ranked report. Do not review it
yourself first — dispatch the panel.

## 1. Dispatch the panel — in parallel, one batch
Send the same diff to each of these reviewer lenses at once, dropping any
that don't apply to this change:
- **General code quality** — readability, structure, error handling, dead
  code, missing test coverage.
- **Security** — OWASP Top 10, hardcoded secrets, injection, broken auth,
  unsafe deserialization, dependency CVEs.
- **[LANGUAGE] type-safety** — unsafe type assertions/casts, escape hatches
  around the type system, async/concurrency correctness, injection risk
  from unchecked input.
- **[FRAMEWORK]-specific** — e.g. component/hook rules, render performance,
  accessibility, framework-specific footguns. Only if this diff touches
  framework-facing code.

Each reviewer works independently — no reviewer sees another's findings —
and reports every finding as: `file:line — severity — one-sentence claim —
concrete failure scenario (the input or state that actually makes this
break)`. A finding with no failure scenario isn't a finding, it's a hunch;
reviewers should drop those themselves instead of padding the list.

## 2. Synthesize
Once every reviewer has reported:
1. **Dedupe** — the same underlying issue flagged by more than one reviewer
   collapses into a single entry; keep the sharpest description and note
   which reviewers agreed.
2. **Filter** — drop anything without a concrete failure scenario, or
   anything already handled elsewhere in the code. Verify against the
   actual diff before dropping a finding — don't take a reviewer's claim
   on faith in either direction.
3. **Rank** — CRITICAL (security/data-loss, must fix before merge) → HIGH
   (real bug or significant quality issue) → MEDIUM (maintainability) →
   LOW (style/optional).

## 3. Present
One report, most severe first. Each entry: file:line, one-sentence
summary, failure scenario, severity, which reviewer(s) raised it. State
plainly if nothing survived synthesis — an empty CRITICAL/HIGH list is a
valid, useful result, not a failure to find something.

Target: [DIFF/PR/BRANCH]. Stack: [LANGUAGE] / [FRAMEWORK].
```

- Drop reviewer lenses that don't apply — no framework reviewer for a pure
  backend/CLI change — rather than forcing all four every time.
- The dedupe/filter step in part 2 matters as much as the panel itself;
  four reviewers each padding their list with low-confidence guesses just
  produces a longer, less trustworthy report.
- See [subagent orchestration](../tools/02-subagent-orchestration.md) for
  actually firing these off as parallel subagents rather than sequential
  turns.
