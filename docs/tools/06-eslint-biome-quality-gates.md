# ESLint/Biome Quality Gates

Two linters, two jobs, deliberately not overlapping. One carries a small,
hand-picked rule set targeting specific anti-patterns; the other carries the
bulk of type-aware and framework-specific coverage. Running both isn't
redundancy — it's two tools doing the parts they're actually good at.

## Why use it

A single linter's "recommended" preset is a one-size-fits-all bundle — it
either misses rules you actually need or fights you with ones you don't.
Splitting the work lets each tool cover what it's fast and precise at, and
lets you make an explicit, defensible choice about what's enforced instead
of inheriting someone else's default.

## Install

```bash
npm install --save-dev eslint
npm install --save-dev --save-exact @biomejs/biome
```

## The split: curated vs. bulk coverage

Biome runs fast enough to use for a small, deliberately curated set of
rules — not its full bundled "recommended" preset. Opting into roughly five
targeted rules instead of roughly two hundred is a legitimate, defensible
choice on its own, and the reasoning for *why* should live as a comment
right next to the config that makes the choice, not in a separate doc that
can drift out of sync with it:

```jsonc
// biome.jsonc
{
  // Deliberately NOT using Biome's "recommended" preset (~200 rules).
  // Biome covers a handful of specific anti-patterns here; ESLint (with
  // type-aware and framework-specific rules) covers everything else.
  // Overlapping coverage between two linters just means two places to
  // update the same rule.
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": false,
      "correctness": {
        "noUnusedVariables": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
      // ...a handful more, each chosen on purpose.
    }
  }
}
```

ESLint (with `typescript-eslint` or your framework's plugin) carries the
rest: type-aware rules that need the full compiler's type information,
framework-specific rules (hooks, accessibility, routing conventions), and
anything Biome's curated set deliberately leaves out.

## The formatter is off, on purpose

Turning on a first-time formatter across a large, pre-existing codebase
produces a wall of formatting-only diffs across every file it touches —
thousands of line changes with zero relationship to any real bug, burying
whatever actual review was supposed to happen. On a codebase that's never
been run through a formatter, leaving it off and documenting *why*, inline,
is a legitimate choice — not a gap to apologize for:

```jsonc
// biome.jsonc
{
  // Off on purpose: this codebase predates Biome and has never been run
  // through a formatter. A first pass across thousands of untouched files
  // would produce a wall of formatting-only diffs unrelated to real bugs —
  // worse than leaving this off and explaining why, right here.
  "formatter": {
    "enabled": false
  }
}
```

## The warn → error rollout as a migration tool

A new rule doesn't flip straight to blocking. It lands at `"warn"` across
the whole codebase first, so every existing violation becomes visible
without breaking anyone's build. The warning count is now a real, trackable
number — not a comment saying "we'll tighten this later" that nobody
revisits. Once the count reaches zero, the rule flips to `"error"` and stays
there.

```js
// eslint.config.js (excerpt)
export default [
  {
    rules: {
      // New rule, rolled out at "warn" so the violation count is visible
      // without blocking anyone. Flip to "error" once it hits zero.
      complexity: ["warn", 10],
    },
  },
];
```

See [Prompt: ESLint warning burndown](../prompts/02-eslint-warning-burndown.md)
for the actual process of driving that count to zero.

## Enforcing architecture boundaries

Import-restriction rules block specific layers from importing specific other
layers directly — for example, keeping UI code from reaching a database
client directly, or from reaching a low-level infrastructure/adapter layer
directly instead of going through the domain layer that's supposed to sit in
between.

A useful trick: register the *same* restriction rule twice, at two different
severities. One instance is a hard error for boundaries the team has
committed to never crossing again; a second instance, scoped to a different,
already-known set of violations, stays at `"warn"` — visible and tracked as
debt, without blocking the whole build immediately:

```js
// eslint-plugin-local/index.js — one implementation, two rule IDs
const noCrossLayerImport = require("./rules/no-cross-layer-import");

module.exports = {
  rules: {
    "no-cross-layer-import": noCrossLayerImport, // used at "error"
    "no-cross-layer-import-legacy": noCrossLayerImport, // used at "warn"
  },
};
```

```js
// eslint.config.js (excerpt)
export default [
  {
    rules: {
      // Boundaries the team commits to never crossing again.
      "local/no-cross-layer-import": ["error", { from: "ui", to: "database" }],
      // Same rule, same logic — a different, already-known set of
      // violations, still being paid down. Visible, not blocking.
      "local/no-cross-layer-import-legacy": ["warn", { from: "ui", to: "infra-adapters" }],
    },
  },
];
```

## Building custom rules

Community rule sets run out of coverage eventually. A small, in-house rule
is worth writing once you hit something specific to your codebase that
nothing off-the-shelf catches. Generic examples of the category:

- a per-file line-length cap
- a ban on ad-hoc `console.*` logging in production code
- a ban on reaching a low-level client or resource directly from a layer
  that shouldn't have direct access to it
- a ban on floating-point arithmetic for monetary values
- a required-authentication-check rule for API route handlers
- a required max-length attribute rule for user-facing text inputs

A minimal example of the shape one of these takes:

```js
// rules/no-console-in-production.js
module.exports = {
  meta: { type: "problem" },
  create(context) {
    return {
      "CallExpression[callee.object.name='console']"(node) {
        context.report({
          node,
          message: "Use the shared logger, not console.*, in production code.",
        });
      },
    };
  },
};
```

## Keep the type-aware tier out of the fast path

Rules that need full TypeScript type information are much slower to run
than syntax-only rules. On a large codebase, that's worth keeping *out* of
the default lint script and pre-commit hook deliberately — run it as a
separate, manual or CI-only command instead of adding real latency to every
commit:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:types": "eslint . --config eslint.type-aware.config.js"
  }
}
```

`lint` runs fast and blocks; `lint:types` runs in CI (or on demand), not on
every commit.

## Gotchas

- **An "unsafe regex" heuristic can flag any regex with two or more
  sequential quantifier groups**, regardless of whether each one is already
  properly bounded. The fix is restructuring into separate, single-quantifier
  expressions — tightening the existing bounds further does not satisfy the
  heuristic, no matter how tight they get.
- **Cyclomatic-complexity rules can count optional chaining (`?.`) as a full
  branch point** — the same weight as `&&`, `||`, or a ternary. A function
  with several chained optional property accesses can hit a complexity
  ceiling much sooner than an eyeballed if/else count would suggest.
- **A hard per-file line-length cap can leave a file sitting exactly at the
  ceiling with zero slack.** A routine extraction meant to fix one warning
  can silently introduce a brand-new file-length violation somewhere else.
  Always re-verify with the real linter after any refactor — never by
  hand-counting lines. When a file's already at the ceiling, prefer, in this
  order: a zero-parameter nested closure, then a guard-wrapper closure, then
  just compacting the existing code — and only as a last resort, splitting
  the file in two.
- **A function where every branch returns an object literal can have its
  inferred return type silently change when extracted into its own named
  function.** Some type systems narrow a per-branch optional property
  precisely only when the whole thing is inferred inline, and lose that
  precision once it's pulled into a standalone function signature — which
  can break a caller's type-check far away from the file you actually
  edited, with zero diagnostic at the edit site itself. Grep every call site
  before extracting a function shaped like this.
- **A hand-rolled AST-walking analysis script can fail to resolve values
  through shorthand object properties** (`{ x }` vs. the explicit
  `{ x: x }`). Worth a dedicated test case in any custom compiler-API
  tooling you write.
