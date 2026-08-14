# Project Sanitation

Use this for a general "clean up this codebase" pass — dead code, stale
TODOs, drifting dependencies — when you want an agent that measures before
it acts instead of guessing at severity or silently taking on risk. It
forces every claim about the codebase's state to come from an
actually-executed command, separates mechanical fixes from judgment calls
that need a human, and works in small steps instead of one sprawling diff.
On a large codebase, pair it with [parallel specialist
dispatch](../tools/02-subagent-orchestration.md) instead of running the
whole thing through one agent.

```
You are doing a codebase sanitation pass. Goal: leave the repo measurably
cleaner without changing behavior, and without guessing at the current state.

## 0. Ground truth — run these now, don't estimate
- Lint: `[LINT_COMMAND]`
- Typecheck: `[TYPECHECK_COMMAND]`
- Tests: `[TEST_COMMAND]`
- Build: `[BUILD_COMMAND]`
- Dependency audit: `[DEPENDENCY_AUDIT_COMMAND]`

Report the literal output of each — pass/fail counts, warning counts,
vulnerability counts. This is the baseline everything below is measured
against. If any of these are already failing, say so before doing anything
else; don't layer cleanup on top of a broken baseline.

## 1. Inventory — find, don't fix yet
- Dead code: unused exports, unreachable branches, orphaned files.
- `TODO` / `FIXME` / `XXX` markers, with file:line and enough context to
  judge whether they're stale or still real.
- Unused dependencies declared in [PACKAGE_MANIFEST] but never imported.
- Anything the Step 0 commands already flagged before you touched a thing.

## 2. Prioritized plan — safe default vs. needs sign-off
Split findings into:
1. **Safe / conservative (default if I don't respond).** Mechanical and
   behavior-preserving only: unused imports, files with zero references,
   TODOs that reference already-resolved work.
2. **Needs my sign-off before you touch it.** Anything where "unused" is
   ambiguous (reflection, dynamic imports, public API surface), any
   dependency removal that might be a transitive/peer requirement, and any
   TODO documenting a real known gap.
3. **Out of scope — note only.** Architectural debt, anything not already
   surfaced by Step 0.

Present the plan and wait for a decision on group 2. If I don't respond,
proceed with group 1 only.

## 3. Execute in small, verifiable steps
One item at a time — never a bundle of unrelated cleanups in one diff.
After each change, re-run the specific check that proves it, the actual
command, not the full suite from memory. Move to the next item only once
the current one is verified.

## 4. Final report
Re-run every Step 0 command once more and show before/after numbers side
by side. Never write "fixed" or "cleaned up" without the command output
that proves it.

Codebase: [STACK/FRAMEWORK], root at [ROOT_PATH].
```

- On a large codebase, split Step 1's inventory and Step 3's execution
  across parallel specialist subagents by directory or domain instead of
  one agent working through everything serially.
- Re-run Step 0 fresh every time you report a number — a remembered count
  from earlier in the session is the most common way this drifts from
  reality.
- Group 2 is the point of the exercise; resist folding a "probably safe"
  item into group 1 just because deleting it looks easy.
