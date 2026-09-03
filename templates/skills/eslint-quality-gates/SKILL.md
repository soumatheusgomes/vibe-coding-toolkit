---
name: eslint-quality-gates
description: Use when setting up ESLint in a JavaScript or TypeScript project, adding lint quality gates, enforcing a file-size budget, enforcing architecture import boundaries, or splitting lint into a fast tier and a type-aware tier. Triggers on "set up ESLint", "add lint rules", "install quality gates", "enforce architecture boundaries with lint", "my files are too long".
---

# ESLint Quality Gates

Installs three custom ESLint rules and a two-tier flat-config skeleton into
any JavaScript or TypeScript project. The rules ship as source in this
folder — copy them, do not rewrite them.

**Announce at start:** "Using eslint-quality-gates to install lint quality
gates."

## What gets installed

| Rule | Severity | What it catches |
|---|---|---|
| `quality/max-lines` | `error` in source, `warn` in tests | A file that has grown past its budget |
| `quality/no-direct-console` | `error` | Console output outside the log adapter |
| `quality/no-direct-data-access` | `error` | A presentation-layer file importing the database client |

Plus a size and complexity budget at `warn`, architecture boundaries via
`import-x/no-restricted-paths`, and an optional type-aware tier on its own
npm script.

## Requirements

ESLint 9 or newer. The skeletons use `defineConfig` and `globalIgnores` from
`eslint/config`, which do not exist in ESLint 8. If the project is on
ESLint 8, upgrade it first or stop and say so.

## Procedure

### 1. Read the project before changing it

Collect, and state what you found before continuing:

- `package.json` — package manager, existing `lint` script, existing ESLint
  version, whether `"type": "module"` is set
- `tsconfig.json` — whether this is a TypeScript project, and what path
  aliases exist (`paths`)
- The source root — `src/`, `app/`, `lib/`, or the repository root
- The layer directories, if any — which directory holds UI, which holds
  server code, which holds data access
- The data module — the file that exports the database or ORM client, and
  the name it is exported under
- The log adapter, if any — the module the project already logs through

If there is no data module, `quality/no-direct-data-access` does not apply.
Say so and leave it out; do not invent a boundary the project does not have.

### 2. Install dependencies

```bash
npm i -D eslint@^9 @eslint/js@^9
# TypeScript projects:
npm i -D typescript-eslint
# Only if enforcing import boundaries:
npm i -D eslint-plugin-import-x eslint-import-resolver-typescript
```

Pin `@eslint/js` to the same major as `eslint`. Unpinned, npm installs
`@eslint/js@10`, whose peer range demands `eslint@10`, and the install fails
with `ERESOLVE could not resolve`.

Use the project's own package manager if it is not npm.

### 3. Copy the rules

```bash
cp -r <skill>/eslint-rules ./eslint-rules
```

Copy the directory as-is. Do not reformat it, do not convert it to ESM, do
not merge the three files into one. It is CommonJS on purpose: ESLint loads
it with no build step.

### 4. Copy and adapt the fast config

```bash
cp <skill>/eslint.config.mjs.example ./eslint.config.mjs
```

Then edit it against what step 1 found. Every one of these is a real edit,
not a review:

- The `files` globs — replace `src/**/*` if the source root is elsewhere
- `quality/no-direct-data-access` — set `modules` to the real import
  specifiers of the data module, `bindings` to the real exported client
  name, `layers` to the real presentation directories, `extensions` to the
  component file extension (drop it entirely on a non-React project)
- The `import-x` zones — rewrite them for the project's real layers, or
  delete the whole `import-x` block if the project has no layering yet. If
  you delete the block, also delete its two imports at the top of the file
  and its two entries in the test-file block, or ESLint fails on an unknown
  rule id
- The `quality/no-direct-console` "off" block — point it at the real log
  adapter, or delete the block if there is none
- The `globals` list — add what the project's runtime actually provides
- `globalIgnores` — add the project's build output directories

Two ordering rules that are silent when broken. Any block that turns a rule
`off` must come after the block that turns it on, because flat config
applies later matching blocks last. And `except` inside a
`no-restricted-paths` zone is relative to `from`; it cannot exempt an
importer, so narrow `target` instead.

### 5. Copy the type-aware config, on TypeScript projects only

```bash
cp <skill>/eslint.typed.config.mjs.example ./eslint.typed.config.mjs
```

Leave it out of the fast script. It builds a full TypeScript program, which
is too slow for a pre-commit hook and heavy enough to exhaust the heap on a
small CI runner.

### 6. Wire the scripts

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "lint:types": "eslint --config eslint.typed.config.mjs ."
  }
}
```

Drop `lint:types` on a JavaScript project.

### 7. Verify the rules survived the copy

```bash
node <skill>/verify.mjs ./eslint-rules/index.cjs
```

Expected: three `ok` lines and exit code 0. Anything else means the copy is
broken — fix it before going further.

### 8. Run the linter and measure

```bash
npx eslint . --no-cache
```

Count what came back, per rule, and report it. Then set severities from the
count, not from preference:

- Zero violations for a rule: leave it at `error`.
- Violations exist: drop that rule to `warn` and record the count in a
  comment next to it. That count is the baseline; the migration is done when
  it reaches zero and the rule goes back to `error`.
- `quality/max-lines` with a handful of known offenders: keep it at `error`
  and list those files in its `ignore` option instead. A short explicit list
  beats a rule nobody trusts.

### 9. Report

State: which rules were installed, which were skipped and why, the violation
count per rule, which rules are at `warn` with a baseline, and the exact
commands to run the linter.

## What not to do

Do not fix the violations you just found. Installing the gate and measuring
what it catches is the whole job; burning down the backlog is separate work,
with its own review.

Do not raise `max` on `quality/max-lines` to make a file pass. The budget is
the point. Use the `ignore` option for a known offender, or split the file.

Do not turn on a framework preset wholesale because it exists. Uncomment a
block only for a framework the project actually uses.
