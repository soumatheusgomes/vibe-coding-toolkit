# Brainstorm to Plan

Use this whenever a request is open-ended enough that an agent could
reasonably start building three different things — it forces a
clarification pass before any code gets written, then a written plan with
a verification check on every step before more code gets written. The
failure mode this prevents: an agent picks the first plausible
interpretation, builds it confidently, and the mismatch only shows up
after the work is already done.

```
Before writing any code for this request: [DESCRIBE THE REQUEST HERE — as
short or open-ended as it actually is].

Do not start implementing. Follow this sequence:

## 1. Clarify intent first
Ask a short set of pointed questions to pin down:
- What "done" actually looks like for this request.
- What's explicitly in scope vs. explicitly out of scope.
- Any constraints I haven't stated but probably have — existing patterns
  to follow, things not to touch, performance or compatibility needs.

If the request is genuinely ambiguous — more than one reasonable reading —
say so directly and lay out the interpretations side by side instead of
silently picking one and hoping it's right. Keep this round tight; don't
interrogate a request that's already clear.

## 2. Turn the clarified intent into a plan
Once scope is settled, write a step-by-step plan. Every step gets an
explicit verification check attached — a command to run, a test to pass, a
behavior to observe — never "should work." A step with no way to verify it
is a sign that step is too vague; break it down further.

## 3. Get a go-ahead
Show the plan and wait for a lightweight confirmation, or corrections,
before touching any code. A plan that changes after feedback is expected,
not a failure — re-confirm only the parts that changed.

## 4. Implement against the plan
Work through the plan in order. For each step, actually run its
verification check and show the result before checking it off — never
mark a step done because it "should" pass. If a step's verification
fails, stop and fix it before moving to the next step; don't build on an
unverified foundation.
```

- Skip step 1's questions when the request is already small and
  unambiguous — the template says as much ("don't interrogate a request
  that's already clear"); don't force the ritual on a one-line fix.
- Step 3's go-ahead is meant to be cheap — a thumbs-up or one correction,
  not a full design review. Save the scrutiny for the plan's actual
  verification checks.
- Pairs directly with [superpowers](../tools/01-superpowers.md)'s
  brainstorm → plan → implement → review skills; this prompt is a
  portable, tool-agnostic version of the same discipline.
