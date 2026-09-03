# Setup completo de ESLint

## Quando usar

Use este prompt quando você precisa CONFIGURAR ESLint do zero, ou revisar
e modernizar uma configuração existente aplicando uma filosofia opinativa
e completa — não pra zerar avisos acumulados numa base que já tem lint
configurado (isso é o [`02-eslint-warning-burndown.md`](02-eslint-warning-burndown.md),
um prompt diferente, complementar a este). Três cenários típicos: um
projeto novo que ainda não tem lint nenhum; um projeto com uma
configuração antiga, herdada ou bagunçada, que precisa de uma reforma
completa; ou você simplesmente quer adotar essa filosofia específica
(`error` pra bug real ou coisa sempre insegura, `warn` pra pressão de
refatoração, regras caseiras pra invariantes de domínio que nenhum
plugin genérico cobre) no lugar da configuração que já existe.

> [!TIP]
> Se você quer o resultado em vez do raciocínio, existe um caminho mais
> curto: a skill em
> [`templates/skills/eslint-quality-gates/`](../../templates/skills/eslint-quality-gates/)
> entrega as três regras próprias já escritas e testadas, com um verificador
> junto. Este prompt continua sendo o caminho certo quando você quer que o
> agente monte a configuração raciocinando sobre a sua stack, incluindo as
> regras específicas de framework que a skill deixa de fora de propósito.

## Por que funciona

A filosofia central se resume a quatro decisões. Primeiro, só dois
níveis de severidade existem: `error` pra tudo que é sempre bug ou
sempre inseguro — nunca uma questão de gosto — e `warn` pra pressão de
refatoração e heurísticas com uma taxa real de falso positivo, que
nunca deveriam travar um commit ou derrubar a CI. Segundo, formatação
fica inteiramente fora do ESLint — aspas, ponto e vírgula, quebra de
linha são trabalho de um formatter separado (Prettier, Biome, dprint),
nunca duplicado aqui. Terceiro, lint consciente de tipo (`type-aware`)
vira um tier separado, só em `warn`, nunca bloqueante — é poderoso
demais pro que custa: lento e consumidor de memória o bastante pra
derrubar um runner de CI com heap limitado num projeto grande. Quarto,
um pequeno número de regras caseiras cobre invariantes de arquitetura
ou de domínio que nenhuma regra pronta de mercado expressa — sempre
como último recurso, só depois de confirmar que nenhum plugin publicado
já resolve o caso.

## Como adaptar os placeholders

- **`[BUILD_OUTPUT_DIRS]` / `[GENERATED_CODE_DIRS]` / `[AI_HARNESS_DIRS]`**
  — pastas a ignorar, específicas do seu projeto: saída de build
  (`.next/**`, `dist/**`...), código gerado (`drizzle/**`,
  `prisma/generated/**`...), e a pasta de um harness de IA em-repo
  (`.claude/**`), se houver.
- **`[RAW_LIBRARY]` / `[YOUR_WRAPPER]`** — se o seu projeto baniu alguma
  dependência crua em favor de um wrapper próprio (ex.: proibir importar
  uma lib de datas diretamente porque o projeto tem seu próprio módulo
  de datas), o nome da lib banida e do wrapper que a substitui.
- **`[YOUR_DB_CLIENT_NAME]`** — o nome do seu cliente Drizzle, se o
  projeto usa Drizzle (usado nas regras `enforce-delete-with-where` e
  `enforce-update-with-where`).
- **`[YOUR_REACT_MAJOR]`** — a versão major do React instalada no
  projeto.
- **`[BOOTSTRAP_FILES]`** — arquivos que são exceção deliberada de
  alguma regra caseira, tipicamente o bootstrap de logging (o único
  lugar com permissão de usar `console.*` direto).
- **`[UI_LAYER_GLOB]` / `[DB_CLIENT_ENTRYPOINT]`** — se o seu projeto
  tem fronteiras de arquitetura pra proteger (ex.: UI não pode importar
  o cliente de banco direto), o glob da camada de UI e o caminho de
  entrada do cliente de banco.
- **`[YOUR_SWITCH_COMPONENT]`** — se o projeto usa um design system
  próprio, o componente de switch/toggle dele (usado na regra
  `jsx-a11y/label-has-associated-control`).
- **`[FORMATTER]`** — qual formatter o projeto usa: `prettier`, `biome`
  ou `dprint`.

## O prompt

````
# ESLint Setup Prompt — Portable

> **How to use:** paste this whole document as an instruction to a coding agent in the
> target repo (Claude Code, Cursor, etc.). Anything in `[BRACKETS]` must be adapted to
> that specific project — ask the user if it's unclear. Everything else is meant to be
> applied close to verbatim.

## Goal

Set up ESLint 9 (flat config, `eslint.config.mjs`) matching this taste:

- **Strict (`error`) on things that are always a bug or always unsafe.**
- **Lenient (`warn`) on refactoring pressure** — complexity/size budgets and
  false-positive-prone heuristics should nudge, never block a commit or fail CI.
- A small number of **project-authored rules** encode architecture/domain invariants
  that no off-the-shelf rule expresses.
- **Formatting is not ESLint's job.** A separate formatter (Prettier/Biome/dprint) owns
  quote style, semicolons, `eqeqeq`-style stuff, line-wrapping. Don't duplicate that
  here.
- **Type-aware linting is a separate, non-blocking tier** — it's powerful but too slow
  and memory-hungry to run on every commit at scale (see §8).

Prerequisite: ESLint ≥ 9, flat config only — no `.eslintrc*` anywhere.

## Language scope

This targets the **JavaScript/TypeScript family** — `.js/.jsx/.mjs/.cjs` and
`.ts/.tsx`, including React JSX. That's ESLint's native, first-class target, and where
essentially every rule below (core, `typescript-eslint`, `react`, `security`,
`import-x`, and all of §7's custom rules) actually applies.

ESLint *can* also lint non-JS-family content through dedicated parser plugins — Vue
SFCs, Svelte, Astro, Markdown, YAML, JSON/JSONC, GraphQL, HTML, CSS-in-JS — but none of
that is covered here. Those need their own parser and rule set, and in particular the
§7 custom rules are written directly against JS/TS/JSX AST node types
(`ImportDeclaration`, `JSXElement`, `MemberExpression`, `TSInterfaceDeclaration`, …) —
they don't translate to a different AST shape without a rewrite, not just a
find-and-replace of names.

Within the JS/TS family this scales down cleanly: React/Next.js-specific rules are
already gated behind "only if" in §0, and a plain-JavaScript project (no TypeScript)
just drops the `typescript-eslint` layer — see §0.

## 0. Detect the stack first

Don't apply every section blindly. Check the target repo for:

- TypeScript, or plain JavaScript? Assume TypeScript unless proven otherwise. **Plain
  JS, no TypeScript:** drop `...tseslint.configs.strict` (§2) and every
  `@typescript-eslint/*` rule (§3, §8) — keep the ESLint-core rules (`no-var`,
  `complexity`, `max-depth`, `max-statements`, `max-params`, `max-lines-per-function`,
  `max-nested-callbacks`, …), none of those are TS-specific.
- Not a JS/TS-family target at all (Vue SFC, Svelte, Markdown, YAML, JSON, GraphQL,
  …)? → see "Language scope" above before going further — this document doesn't cover
  those.
- React? Next.js? → only then pull in `react` / `react-hooks` / `jsx-a11y` /
  `@next/eslint-plugin-next`
- An ORM with destructive statements (Drizzle, Prisma, Knex, …)? → only then add a
  delete/update-without-where guard
- A shared component library with its own text-input primitives? → only then add §7.5
- Does the project handle money/currency? → only then add §7.4
- A layered architecture (domain/application vs. infra vs. UI)? → only then add §6

Skip whatever doesn't apply instead of forcing it in.

## 1. Install

```bash
npm i -D eslint @eslint/js typescript-eslint eslint-plugin-security \
  eslint-plugin-import-x eslint-import-resolver-typescript

# only if React/Next.js:
npm i -D eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y \
  @next/eslint-plugin-next

# only if the ORM has one (Drizzle does):
npm i -D eslint-plugin-drizzle
```

## 2. Base composition skeleton (`eslint.config.mjs`)

Flat config as an ordered array — **later blocks win on the same file**, which is how
several of the overrides below (test-file relaxations, one-off exemptions) are meant to
work. Take each preset as a whole unit; don't hand-pick rules out of it.

```js
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";
import importX from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
// React/Next.js only:
// import reactPlugin from "eslint-plugin-react";
// import reactHooks from "eslint-plugin-react-hooks";
// import jsxA11y from "eslint-plugin-jsx-a11y";
// import nextPlugin from "@next/eslint-plugin-next";
// Drizzle only:
// import drizzle from "eslint-plugin-drizzle";
// Your own local rules (see §7) — CommonJS, since the flat-config loader needs a
// synchronous require for rule modules in most setups:
// import local from "./eslint-rules/local.cjs";

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.strict, // not just "recommended" — drop to recommended only if
                               // the codebase is too legacy to pass strict yet
  // reactPlugin.configs.flat["jsx-runtime"],
  // reactHooks.configs.flat["recommended"], // diff recommended vs recommended-latest
                                              // against the INSTALLED package version
                                              // before picking one — don't assume from
                                              // memory, presets drift between majors
  // nextPlugin.configs["core-web-vitals"],

  { languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },

  // §3 — error-tier hygiene, every source file
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    rules: { /* no-var, prefer-const, no-empty, no-restricted-imports, ... */ },
  },

  // §3 — TypeScript-specific error tier + §5 size/complexity budget, production only
  {
    files: ["src/**/*.{ts,tsx}"], // adjust to your actual source root
    rules: { /* consistent-type-imports, no-unused-vars, complexity, max-depth, ... */ },
  },

  // §3 — ORM guard, if applicable
  // { files: ["src/**/*.{ts,tsx}"], plugins: { drizzle }, rules: { ... } },

  // §3 — security heuristics
  { files: ["src/**/*.{ts,tsx}"], plugins: { security }, rules: { /* ... */ } },

  // §6 — architecture boundaries, if applicable
  {
    plugins: { "import-x": importX, "import-x-debt": importX },
    settings: { "import-x/resolver-next": [createTypeScriptImportResolver()] },
    rules: { "import-x/no-restricted-paths": [/* ... */], "import-x-debt/no-restricted-paths": [/* ... */] },
  },

  // §7 — local custom rules
  // { files: ["src/**/*.{ts,tsx}"], plugins: { local }, rules: { "local/max-file-lines": "error", ... } },

  // Your local-rules directory itself (CommonJS)
  // {
  //   files: ["eslint-rules/**/*.cjs"],
  //   languageOptions: { sourceType: "commonjs", globals: { module: "readonly", require: "readonly" } },
  //   rules: { "@typescript-eslint/no-require-imports": "off" },
  // },

  // React/a11y, if applicable
  // { files: ["src/**/*.{tsx,jsx}"], plugins: { "jsx-a11y": jsxA11y }, settings: { react: { version: "[YOUR_REACT_MAJOR]" } }, rules: { /* §3 */ } },

  // One-off exemptions — MUST come after the block they override, to win
  // { files: ["[BOOTSTRAP_FILES]"], rules: { "local/no-direct-console": "off" } },

  // Test-file relaxations — MUST come after the production blocks above
  {
    files: ["**/*.test.{ts,tsx}", "**/{__tests__,__mocks__,fixtures,mocks}/**/*.{ts,tsx}"],
    rules: { /* see §5's "Test-file relaxation" */ },
  },

  globalIgnores([ /* §4 */ ]),
]);
```

## 3. Severity philosophy — the actual taste

Two tiers only. Nothing in between.

**`error`** — always a bug or always unsafe, never a matter of taste:

```js
"no-var": "error",
"prefer-const": "error",
"no-empty": ["error", { allowEmptyCatch: true }],

"@typescript-eslint/no-require-imports": "error",
"@typescript-eslint/consistent-type-imports": [
  "error",
  { prefer: "type-imports", fixStyle: "inline-type-imports" },
],
"@typescript-eslint/no-unused-vars": [
  "error",
  { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }, // prefix-underscore opt-out,
                                                          // instead of disabling the rule
],

// A stray interface declared inside a function body is a smell — keep shapes at
// module scope or in a shared types module:
"no-restricted-syntax": [
  "error",
  {
    selector:
      ":matches(FunctionDeclaration, ArrowFunctionExpression, FunctionExpression) TSInterfaceDeclaration",
    message: "Declare interfaces outside functions or move exported shapes to a shared types module.",
  },
],

// Ban a raw dependency your project wraps with its own helper, e.g.:
"no-restricted-imports": [
  "error",
  { paths: [{ name: "[RAW_LIBRARY]", message: "Use [YOUR_WRAPPER] instead of importing [RAW_LIBRARY] directly." }] },
],

"security/detect-eval-with-expression": "error",
"security/detect-pseudoRandomBytes": "error",

"import-x/no-unresolved": "error",
"import-x/no-duplicates": "error",

// ORM destructive-without-where guard, if the ORM has one (Drizzle does):
"drizzle/enforce-delete-with-where": ["error", { drizzleObjectName: ["[YOUR_DB_CLIENT_NAME]"] }],
"drizzle/enforce-update-with-where": ["error", { drizzleObjectName: ["[YOUR_DB_CLIENT_NAME]"] }],
```

Explicitly re-disable from `tseslint.configs.strict` if they don't fit your taste
(this source config disables both, on purpose, not by oversight):

```js
"@typescript-eslint/no-non-null-assertion": "off", // pragmatic escape hatch, allowed
"@typescript-eslint/no-empty-object-type": "off",  // {} as a loose-shape placeholder, allowed
```

**`warn`** — refactoring pressure and heuristics with a real false-positive rate. Should
surface in the editor and in `npm run lint` output, but never fail CI or block a commit:

```js
// size/complexity budget — full table in §5, all "warn"

"security/detect-possible-timing-attacks": "warn",
"security/detect-unsafe-regex": "warn",
"security/detect-child-process": "warn",
// security/detect-object-injection: deliberately SKIPPED — flags ordinary bracket
// access, too noisy; if your TS config has noUncheckedIndexedAccess, that already
// covers the real risk here.

// React, if applicable — one exception below is a real bug class, not a heuristic:
"react/jsx-key": "warn",
"react/no-array-index-key": "warn",
"react/jsx-no-target-blank": "warn",
"react/no-danger": "warn",
"react/jsx-no-leaked-render": ["error", { validStrategies: ["ternary", "coerce"] }],
// ^ this one IS "error": `count && <Badge/>` silently renders the literal text "0"
// when count is 0 — a real runtime bug, not a style nit. Forces `count > 0 && ...`
// or a ternary instead.

// jsx-a11y, if applicable — all "warn", same reasoning (real value, real false positives):
"jsx-a11y/alt-text": "warn",
"jsx-a11y/aria-props": "warn",
"jsx-a11y/aria-proptypes": "warn",
"jsx-a11y/aria-role": ["warn", { ignoreNonDOM: true }],
"jsx-a11y/aria-unsupported-elements": "warn",
"jsx-a11y/role-has-required-aria-props": "warn",
"jsx-a11y/role-supports-aria-props": "warn",
"jsx-a11y/label-has-associated-control": ["warn", { controlComponents: ["[YOUR_SWITCH_COMPONENT]"] }],
"jsx-a11y/anchor-is-valid": "warn",
"jsx-a11y/anchor-has-content": "warn",
"jsx-a11y/heading-has-content": "warn",
"jsx-a11y/click-events-have-key-events": "warn",
"jsx-a11y/no-static-element-interactions": "warn",
```

**Formatting rules do not belong here at all** — no `eqeqeq`, quote style, semicolons,
line-wrapping. If your formatter (Prettier/Biome/dprint) already owns one of these,
leave a one-line comment saying so instead of just silently omitting it — otherwise
future-you wonders why an "obvious" rule is missing.

## 4. Ignores (baseline)

```js
globalIgnores([
  "node_modules/**",
  "[BUILD_OUTPUT_DIRS]",       // e.g. .next/**, dist/**, build/**, out/**
  "coverage/**",
  "[GENERATED_CODE_DIRS]",     // e.g. drizzle/**, src/generated/**, prisma/generated/**
  "**/*.tsbuildinfo",
  "package-lock.json",
  "[AI_HARNESS_DIRS]",         // e.g. .claude/** — if an AI coding harness lives
                                // in-repo, exclude its own tooling scripts, or nearly
                                // every reported error becomes no-undef noise from
                                // Node-runtime hook scripts that never declared Node
                                // globals, drowning out real findings
]),
```

Comment **why** each entry is there, not just what it is — an unexplained ignore invites
someone to "clean it up" later and reintroduce exactly the noise it was blocking.

## 5. Size & complexity budget — the core ask

Apply to production source only (e.g. `src/**/*.{ts,tsx}`), all at **`warn`** (§3 — this
is pressure, not a gate):

| Rule | Value | Notes |
|---|---|---|
| `complexity` | `12` | cyclomatic complexity ceiling per function |
| `max-depth` | `4` | nesting ceiling |
| `max-statements` | `20` | statements per function |
| `max-params` | `4` | **stays on even for test files** — a 5-parameter test helper is still a smell |
| `max-lines-per-function` | `{ max: 150, skipBlankLines: true, skipComments: true }` | |
| `max-nested-callbacks` | `3` | |

Plus one project-authored rule that is **not** a vanilla ESLint rule and is deliberately
**`error`**, not `warn` — a whole-file line-count ceiling (§7.1). The asymmetry is
intentional: a function that's grown too complex is a nudge (`warn`); a file that's
grown too large is a hard stop (`error`) — file size is cheap to check, expensive to let
rot, and has no legitimate reason to be waived the way a gnarly function sometimes does.

**Test-file relaxation** — on `**/*.test.{ts,tsx}` and equivalent test/mock/fixture
globs, turn fully **`off`** (not just relaxed): `max-statements`,
`max-lines-per-function`, `max-nested-callbacks`, `@typescript-eslint/no-non-null-assertion`,
and any architecture-boundary rule from §6. Leave `max-params` on, and leave the
file-line-count rule (§7.1) on too but downgraded to `warn` with an explicit
"include tests" flag — a giant test file is still worth flagging, just not as a hard
error.

## 6. Import/architecture boundaries

If the project has a layered architecture, encode the boundaries mechanically instead of
relying on code review to catch a stray import:

```js
"import-x/no-restricted-paths": [
  "error",
  {
    zones: [
      // one entry per invariant that must NEVER regress, e.g.:
      { target: "[UI_LAYER_GLOB]", from: "[DB_CLIENT_ENTRYPOINT]" },
    ],
  },
],
```

For boundaries you're still migrating **toward** — existing violations you haven't
cleaned up yet, but don't want to get worse — register the same plugin under a second
alias and set it to `warn` instead of `error`:

```js
plugins: { "import-x": importX, "import-x-debt": importX },
rules: {
  "import-x-debt/no-restricted-paths": [
    "warn",
    { zones: [ /* boundaries you're still cleaning up */ ] },
  ],
},
```

This lets you commit to a target architecture immediately — as a visible warning
everywhere it's already violated — without a big-bang refactor to reach `error`-clean
first. Promote a zone from the `-debt` list to the `error` list once it's actually clean.

## 7. Project-authored custom rules (patterns to replicate, not copy verbatim)

Rules with no off-the-shelf equivalent, written as a small local flat-config plugin (a
CommonJS `eslint-rules/` directory, imported into `eslint.config.mjs`). Implement
whichever apply to the target project's actual domain — adapt names/paths in
`[BRACKETS]`, don't hardcode a different project's own naming into this one.

### 7.1 File-length ceiling — `error` in production, `warn` on tests

Count lines in the file; report once if over a threshold (350 is what this taste uses —
tune to the codebase). Skip `.d.ts`, generated/vendor paths, and barrel files (`index.*`,
`types.*`, `constants.*` — anything inherently just declarations). On test/mock/fixture
globs: same rule, but `warn`, with an explicit opt-in flag to check them at all (tests
are allowed more slack before this becomes noise).

### 7.2 No direct low-level logging in application code — `error`, exempt tests + designated bootstrap files

Ban `console.log/error/warn/info/debug/...` (and friends: `trace`, `dir`, `table`,
`group*`, `count*`, `time*`, `assert`, `profile*`) outside test files, so a structured
logger is the only sanctioned path. Carve out an explicit exemption for the 1–2 files
that ARE the logging bootstrap itself (a migration runner, an operation-log writer) via
a later config block scoped to those exact paths, setting the rule back to `"off"`.

### 7.3 No direct data-layer access from the UI layer — `error`

If there's a repository/service layer between UI and the database, flag any import of
the raw DB client/handle from UI-layer files (pages, components) — forces routing
through the service layer. Detect via the import specifier (the DB client's module
path) plus which specifiers are pulled from it (default/namespace import, or a named
binding matching the client's conventional name).

### 7.4 No native arithmetic on money-shaped values — `error` — only if the project handles currency/money

Flag `+ - * / % **` (and compound-assignment forms), unary `+`/`-`,
`Number()`/`parseFloat()`/`parseInt()`, `Math.ceil/floor/round/trunc/max/min`,
`.toFixed()`, and `.toNumber()` on any identifier/property whose **name** looks like a
money/currency value — match by word segment (camelCase-split), not substring, so e.g.
`maxConcurrency` isn't a false positive for containing "cur". The point is forcing all
arithmetic on money through a dedicated decimal-safe helper module instead of native
floating point. Exempt test files and the money-math helper module itself.

### 7.5 UI input consistency — only if there's a shared component library

- Ban raw `<input>`/`<textarea>` outside the design system's own primitive components
  (exempt semantic non-text `type`s: `checkbox`, `radio`, `file`, `hidden`, `range`,
  `date`, etc. — those aren't "text entry" in the sense this rule cares about).
- Require a `maxLength` attribute (or a spread prop, trusted to carry one) on every use
  of the shared text-input components, same exemption list. Prevents an unbounded text
  field from shipping by omission. `off` on test files.

### 7.6 Require an auth/session gate on every sensitive server entry point — `error`

For server actions / API route handlers: collect every exported handler in files
matching the sensitive-entrypoint convention (e.g. a `"use server"` file under an
actions directory, or a route handler under an API directory), and verify each is
gated — directly, or transitively through a same-file helper resolved via real ESLint
scope analysis, not string matching — by a call to one of the project's known
auth/session-check functions. Keep that "known gate functions" list as a small config
object at the top of the rule, so adding a new gate helper is a one-line edit. Known
limitation worth keeping honest about: this only proves the gate was *called*, not that
a non-throwing gate's return value was actually checked by the caller — don't oversell
what it guarantees.

## 8. Two-tier lint: fast default + optional type-aware tier

Type-aware ESLint rules (anything needing `parserOptions.projectService`/`project`) are
powerful but expensive — full type-aware linting across a few thousand files can OOM a
constrained CI runner (this taste hit an actual heap-exhaustion failure around 2GB on a
standard CI box). Don't put them in the default `lint` script:

- `eslint.config.mjs` — no type info, fast. This is what `lint` / `lint:fix` /
  pre-commit / pre-push run.
- `eslint.typed.config.mjs` — layers type-aware rules on top, all at `"warn"`:

```js
import defaultConfig from "./eslint.config.mjs";

export default [
  ...defaultConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/only-throw-error": "warn",
      "@typescript-eslint/return-await": ["warn", "in-try-catch"],
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/unbound-method": "warn",
      "@typescript-eslint/restrict-template-expressions": "warn",
      "@typescript-eslint/restrict-plus-operands": "warn",
      "@typescript-eslint/require-await": "warn",
    },
  },
];
```

Run it via its own script (`lint:types`), never wired into `test`/`check`/the commit
gate.

## 9. package.json scripts

```json
"lint": "[FORMATTER] check . && eslint . --cache",
"lint:fix": "[FORMATTER] check --write . && eslint . --fix --cache",
"lint:types": "eslint --config eslint.typed.config.mjs ."
```

If you have local custom rules (§7) and use `--cache`: ESLint's cache invalidates on
linted-file changes but **not** on changes to the custom rule's own implementation file.
Add a tiny pre-lint script that deletes `.eslintcache` whenever a file under the
local-rules directory is newer than the cache file, or you'll silently lint against a
stale rule after editing one.

## 10. Wire it into git hooks

Run `lint` on `pre-commit` and `pre-push` (husky, lefthook, or equivalent) — keep this
tier fast (§8 is what makes that affordable), since pre-commit/pre-push latency is a tax
paid on every single commit.

## 11. After generating the config

Run the lint command for real, read the actual output, and fix or consciously re-tune
(don't silently loosen) whatever it flags. Don't report this as done until it's been run.

---

## What's deliberately left out

- **No character-based line-length rule (`max-len`).** This taste enforces line *count*
  (file/function size — §5, §7.1), not line *width*. If the target project wants a
  character cap per line, that's an intentional addition on top of this, not something
  carried over from here.
- **No formatting rules of any kind** in ESLint — quote style, semicolons, `eqeqeq`,
  wrapping. That's a separate formatter's job (§3).
- **No blocking type-aware rules** — they exist, but only as `warn` in a separate,
  non-default tier (§8), for the OOM/latency reasons stated there.
````

## Exemplo de uso

Imagine um projeto novo em Next.js + TypeScript + Drizzle que nunca
teve ESLint configurado — só o linter que vem de fábrica no
`create-next-app`, nunca customizado. Você preencheria os placeholders
mais ou menos assim:

- `[BUILD_OUTPUT_DIRS]` → `.next/**`
- `[GENERATED_CODE_DIRS]` → `drizzle/**`
- `[YOUR_DB_CLIENT_NAME]` → `db`
- `[YOUR_REACT_MAJOR]` → `19`
- `[FORMATTER]` → `biome`
- `[UI_LAYER_GLOB]` / `[DB_CLIENT_ENTRYPOINT]` → só preenche se o
  projeto já separa camadas de UI e acesso a dados; senão, pula a §6
  inteira

O agente detecta a stack (§0: TypeScript + React/Next.js + Drizzle,
então mantém a camada `typescript-eslint`, os plugins de React/a11y e a
regra de guarda do Drizzle), instala as dependências certas (§1), e
monta um `eslint.config.mjs` completo seguindo o esqueleto do §2 — com
a filosofia de dois níveis do §3, os ignores do §4, o orçamento de
complexidade do §5, e as regras caseiras do §7 que fizerem sentido pro
projeto (pelo menos a §7.1, o teto de linhas por arquivo, e a §7.2, a
proibição de `console.log` direto). Como o projeto mexe com Drizzle mas
ainda não tem fronteiras de camada nem componente de texto próprio, as
§6 e §7.5 ficam de fora. O resultado esperado é um `eslint.config.mjs`
rodável de verdade — não um esqueleto com `TODO` — mais,
opcionalmente, um `eslint.typed.config.mjs` com as regras conscientes
de tipo do §8, num script `lint:types` separado, nunca no caminho
rápido. Por fim, o agente roda o comando de lint de verdade (§11) e
reporta a saída real, em vez de assumir que funcionou.

## Dicas

- Isso é ortogonal ao [prompt de burndown de avisos](02-eslint-warning-burndown.md)
  — use este primeiro pra ter uma configuração boa desde o início, use
  aquele depois, quando os avisos acumularem e for hora de zerar uma
  regra específica.
- A §0 ("Detect the stack first") existe pra evitar que o agente aplique
  seções inteiras que não fazem sentido pro projeto — vale conferir que
  ele realmente pulou o que devia antes de aceitar o resultado.
- A seção final, "What's deliberately left out", não é um detalhe
  menor: ela existe pra deixar claro que a ausência de `max-len` e de
  regras de formatação é intencional, não esquecimento — útil de
  apontar se alguém depois perguntar "cadê a regra de tamanho de
  linha?".
