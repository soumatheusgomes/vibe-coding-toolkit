# Install ESLint quality gates (350-line ceiling)

## Shortcut: just the link

If you do not want to copy a prompt, paste this line into your agent. It
works with any agent that can read a URL — Claude Code, Codex, Cursor:

```
Read https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/docs/prompts/08-eslint-quality-gates-install.md
and execute the prompt in that file in this project. Use MAX_LINES=350
and the package manager you find in the repository.
```

The rest of this document contains the same prompt in full, for those who
prefer to paste the entire text or adapt it first.

## When to use

Use this prompt when you want the three lint rules this toolkit advocates
running in any JavaScript or TypeScript project — a file-size ceiling, a
ban on direct `console` calls, and a ban on the presentation layer importing
the database client — without reconstructing the reasoning behind them.

The difference from [`07-eslint-complete-setup.md`](07-eslint-complete-setup.md)
is scope. Prompt 07 evaluates the whole stack and reuses the relevant
profiles, including framework rules. This one focuses on three existing,
tested `.cjs` files to copy and connect. Use it when you want the 350-line
ceiling and local boundaries installed with a measured adoption baseline.

After installation, the natural next step is
[`09-file-size-refactor.md`](09-file-size-refactor.md) — it tells the agent
to split the files exceeding the ceiling.

## Why it works

The hard part of a custom lint rule is not the idea, but the code. A rule
written on the fly from a description fails silently: it exempts too many
or too few test files, does not know that the size of an `index.ts` that
only re-exports has no meaningful limit, and reports at the wrong position.
None of these errors looks like a failure — it looks like a rule that
"catches nothing" or "catches everything", and someone turns it off.

The ceiling identifies barrels through the AST, without exempting `index.*`,
`types.*` or `constants.*` by name. Imports, ESM re-exports and type
declarations with no logic of their own may be exempt; executable code
counts. The `.test`, `.spec`, `-test` and `-spec` suffixes (including
`.e2e-spec`) and test directories share the three rules' classification.
`includeTests` measures those tests with their own budget.

When updating an existing installation, recopy the three `.cjs` files from
the same revision, run the self-check and measure the baseline again:
modules with logic previously exempted by name may start appearing in the
report. Updating this toolkit does not change copies already installed in
other projects.

That is why the prompt does not ask the agent to write rules. It asks it to
copy. The agent decides only what actually depends on your project: where
the presentation layer lives, which module exports the database client,
which file is the log adapter, and which directories to ignore.

The final step is measuring, not fixing. The prompt tells the agent to run
the linter, count violations per rule, and choose severity from that count:
a rule with zero violations starts as `error`; a rule with violations starts
as `warn`, with the count recorded as a baseline. A gate that starts red
because of preexisting code is not a gate, but noise someone will disable
by the first Friday.

## How to adapt the placeholders

This prompt deliberately has few placeholders — step 1 tells the agent to
discover almost everything it needs by reading the project.

- **`[MAX_LINES]`** — the per-file line ceiling. The toolkit default is
  `350`. Below ~200, the rule constantly fights legitimate code; above
  ~500, it stops applying pressure.
- **`[PACKAGE_MANAGER]`** — `npm`, `pnpm`, `yarn` or `bun`. If unsure, leave
  `npm` and the agent will correct it after reading the project.
- **`[SOURCE_URL]`** — where the agent gets the files. If you cloned this
  repository, use the local path `templates/eslint`. Otherwise, use the
  GitHub raw URL already filled in the prompt. Its `main` is resolved to a
  commit SHA once, so the files and the `verify.mjs` that runs them come
  from one revision; replace `main` with a SHA you reviewed to pin it.

## The prompt

```
Install this project's ESLint quality gates by COPYING pre-written rule
files, not by writing rules from scratch. The rules already exist and are
already tested; your job is to place them and adapt the configuration to
this project's real shape.

## 0. Get the files

Fetch these six files into a temporary location from the same revision of
[SOURCE_URL] (default:
https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/templates/eslint).
If the URL names a branch such as `main`, first resolve it to a commit SHA
(for example `git ls-remote https://github.com/soumatheusgomes/vibe-coding-toolkit.git main`),
report that SHA, and fetch every file from it; a branch can move between
two downloads:

  eslint-rules/utils.cjs
  eslint-rules/core-rules.cjs
  eslint-rules/index.cjs
  eslint.config.mjs.example
  eslint.typed.config.mjs.example
  verify.mjs

After inspecting the project in step 1, place or merge them like this;
preserve existing configuration, scripts, and protections:

  ./eslint-rules/utils.cjs
  ./eslint-rules/core-rules.cjs
  ./eslint-rules/index.cjs
  ./eslint.config.mjs          (from eslint.config.mjs.example)
  ./eslint.typed.config.mjs    (from eslint.typed.config.mjs.example, TypeScript only)
  ./verify.mjs                 (temporary; delete after step 5)

Copy the .cjs files byte for byte. Do not reformat them, do not convert
them to ESM, do not merge them into one file, do not "improve" them. They
are CommonJS on purpose so ESLint loads them with no build step. If you
rewrite them, this prompt has failed.

## 1. Read the project before changing anything

Report what you found before continuing:

- package manager, existing lint script, existing ESLint version
- whether this is TypeScript, and what path aliases tsconfig.json defines
- the source root: src/, app/, lib/, or the repository root
- the presentation layer: which directories hold UI or route entrypoints
- the data module: which file exports the database/ORM client, and under
  what name
- the log adapter: the module the project already logs through, if any

If the project is on ESLint 8 or older, stop and say so. The config uses
defineConfig and globalIgnores from eslint/config, which do not exist
before ESLint 9.

If there is no data module, say so and remove the
quality/no-direct-data-access rule instead of inventing a boundary this
project does not have.

## 2. Install dependencies

  [PACKAGE_MANAGER] i -D eslint@^9 @eslint/js@^9
  # TypeScript projects:
  [PACKAGE_MANAGER] i -D typescript-eslint
  # Only if enforcing import boundaries:
  [PACKAGE_MANAGER] i -D eslint-plugin-import-x eslint-import-resolver-typescript

Pin @eslint/js to the same major as eslint. Unpinned, the installer picks
@eslint/js@10, whose peer range demands eslint@10, and the install fails
with ERESOLVE.

## 3. Adapt eslint.config.mjs

Every item here is a real edit against what step 1 found, not a review:

- the `files` globs, if the source root is not src/
- quality/max-lines: set `max` to [MAX_LINES]
- quality/no-direct-data-access: set `modules` to the real import
  specifiers of the data module, `bindings` to the real exported client
  name, `layers` to the real presentation directories, `extensions` to
  the component file extension (drop `extensions` entirely on a
  non-React project)
- the import-x zones: rewrite them for this project's real layers, or
  delete the whole import-x block if the project has no layering yet. If
  you delete it, also delete its two imports at the top of the file and
  its two entries in the test-file block, or ESLint fails on an unknown
  rule id
- the quality/no-direct-console "off" block: point it at the real log
  adapter, or delete the block if there is none
- the `globals` list: add what this project's runtime actually provides
- globalIgnores: add this project's build output directories

Two failure modes that are completely silent when you get them wrong.
First, a block that turns a rule `off` must come AFTER the block that
turns it on — for a file matched by both, flat config applies the later
block last, so an `off` placed earlier is overridden without any warning.
Second, `except` inside a no-restricted-paths zone is relative to `from`;
it carves files out of `from` and cannot exempt an importer. To exempt an
importer, narrow `target`.

## 4. Wire the scripts

  "lint": "eslint ."
  "lint:fix": "eslint . --fix"
  "lint:typed": "eslint --config eslint.typed.config.mjs ."

Omit lint:typed on a JavaScript project; preserve an equivalent existing
script name. Keep the type-aware tier separate from the fast lint command
and measure its runtime/memory on the actual runner before selecting its
CI scope. Preserve an existing typed gate. Do not add Git hooks.

## 5. Verify the copy survived

  node verify.mjs

Expected: three lines ending in ": ok", exit code 0. Anything else means
the copy is broken — fix it before going further. Delete verify.mjs
afterwards, or keep it and wire it into the test script; do not leave it
lying around unexplained.

## 6. Run the linter and MEASURE

  [PACKAGE_MANAGER] run lint

Report the count per newly introduced rule. Preserve existing severities;
do not downgrade an established protection or add ignores to hide violations.
For the new rules, set severities from the count:

- zero violations for a rule: leave it at "error"
- violations exist: drop that rule to "warn" and write the count in a
  comment next to it. That count is the baseline, and the migration is
  finished when it reaches zero and the rule goes back to "error"
- keep existing exceptions scoped and documented; do not add generic
  exclusions or increase ceilings to manufacture a passing result

## 7. Report

State: which rules were installed, which were skipped and why, the
violation count per rule, which rules are at "warn" with a baseline, the
list of files over the [MAX_LINES]-line budget sorted by size, and the
exact commands to run the linter.

## Rules for you, the agent

Do NOT fix any violation you found. Installing the gate and measuring what
it catches is the entire job. Refactoring is separate work with its own
review.

Do NOT raise [MAX_LINES] to make a file pass. Leave existing offenders
reported with the measured adoption baseline.

Do NOT enable a framework preset because it exists. Uncomment a block only
for a framework this project actually uses.
```

## Usage example

Imagine a Next.js TypeScript project with the `@/*` alias, the database
client in `src/db/index.ts` exported as `db`, components in `src/components/`
and routes in `src/app/`. Fill in:

- `[MAX_LINES]` → `350`
- `[PACKAGE_MANAGER]` → `npm`
- `[SOURCE_URL]` → the default raw URL, already filled in the prompt;
  the agent resolves `main` to a commit SHA in step 0

The agent downloads the six files, reads `tsconfig.json` and discovers the
alias itself, points `modules` to `@/db`, `layers` to `/src/app/` and
`/src/components/`, runs `node verify.mjs` (three `ok`s), runs lint, and
returns something like: `quality/no-direct-console` has zero violations,
stays at `error`; `quality/no-direct-data-access` has two violations, drops
to `warn` with the count recorded; `quality/max-lines` has eleven files over
350 lines, listed largest first. It stops there — fixes nothing.

That eleven-file list is exactly the input for
[`09-file-size-refactor.md`](09-file-size-refactor.md).

## Tips

- If the agent rewrites the `.cjs` files instead of copying them, have it
  redo the work. The whole point is that these three rules always use the
  same tested code — a rule written on the fly fails silently.
- Run `node verify.mjs` before trusting any violation count. If the rules
  arrived broken, clean lint output means nothing.
- Install just `quality/max-lines` first if the project is large and you
  want one gate at a time. All three are independent.
- The full reasoning behind these choices — why warnings become errors,
  why architecture boundaries belong in lint — is in
  [`../tools/06-eslint-biome-quality-gates.md`](../tools/06-eslint-biome-quality-gates.md).
