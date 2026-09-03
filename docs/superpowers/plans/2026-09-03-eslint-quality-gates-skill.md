# ESLint Quality Gates Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a copy-and-run Claude Code skill in `templates/skills/eslint-quality-gates/` that an agent can point at any JavaScript/TypeScript project to install three business-agnostic custom ESLint rules plus a two-tier config skeleton.

**Architecture:** Three CommonJS rule modules exposed through a plugin entry (`quality` namespace), two flat-config skeletons (fast tier and type-aware tier), one `RuleTester`-based self-check, and a `SKILL.md` that is a numbered install procedure rather than an explanation. Nothing is built, published, or bundled — installation is a file copy plus config edits.

**Tech Stack:** ESLint 9 flat config, CommonJS rule authoring, Node ESM for the verifier, ESLint's built-in `RuleTester`. No test framework, no bundler, no new `package.json` in this repository.

**Spec:** `docs/superpowers/specs/2026-09-03-eslint-quality-gates-skill-design.md`

## Global Constraints

- ESLint 9 or newer. The skeletons use `defineConfig` and `globalIgnores` from `eslint/config`, which do not exist before v9.
- Rules are authored as CommonJS `.cjs`. No build step, no transpile, no new runtime dependency beyond ESLint itself.
- The plugin namespace is `quality`. Rule ids are `quality/max-lines`, `quality/no-direct-console`, `quality/no-direct-data-access`.
- No identifier or term from the source project survives into any shipped file. Forbidden substrings, case-insensitive, in everything under `templates/skills/eslint-quality-gates/`: `firebrocks`, `tron`, `trx`, `usdt`, `sun`, `custody`, `tronzap`.
- `SKILL.md` and every file inside the skill folder are written in English. Prose added to `docs/` and `README.md` stays in Portuguese, matching the repository's existing split.
- `verify.mjs` imports only `eslint` and Node builtins.
- Verified against ESLint 9.39.5: importing a `.cjs` plugin from ESM yields the `module.exports` object directly (`plugin.rules`), `RuleTester.run()` works with no `describe`/`it` globals and throws on failure, `sourceType: "module"` is the flat-config default, and plain JavaScript source with a `.ts` or `.tsx` filename parses without a TypeScript parser.

## File Structure

```
templates/skills/eslint-quality-gates/
  SKILL.md                          # Task 5 — the install procedure the agent follows
  eslint-rules/
    utils.cjs                       # Task 1 — path helpers and shared constants
    core-rules.cjs                  # Tasks 1-3 — the three rule objects
    index.cjs                       # Task 1 — plugin entry, grows in Tasks 2-3
  eslint.config.mjs.example         # Task 4 — fast tier skeleton
  eslint.typed.config.mjs.example   # Task 4 — type-aware tier skeleton
  verify.mjs                        # Task 1 — self-check, grows in Tasks 2-3
```

Modified outside the skill folder: `docs/tools/06-eslint-biome-quality-gates.md`, `docs/prompts/07-eslint-complete-setup.md`, `README.md` (all Task 6).

## Development Harness

The toolkit repository has no `package.json` and no `node_modules`, so ESLint cannot be resolved from inside it. Every task verifies by copying the skill folder into a scratch directory that has ESLint installed, which is also exactly what installation looks like in a real project.

Run this once before Task 1:

```bash
SCRATCH="${TMPDIR:-/tmp}/eslint-skill-scratch"
mkdir -p "$SCRATCH" && cd "$SCRATCH"
printf '{"name":"scratch","private":true,"type":"module"}\n' > package.json
npm i -D eslint@^9 --no-audit --no-fund
```

Then, from the toolkit repository root, the verification loop used by every task below is:

```bash
SCRATCH="${TMPDIR:-/tmp}/eslint-skill-scratch"
rm -rf "$SCRATCH/skill" \
  && cp -r templates/skills/eslint-quality-gates "$SCRATCH/skill" \
  && (cd "$SCRATCH" && node skill/verify.mjs skill/eslint-rules/index.cjs)
```

Node resolves the `eslint` import from the location of `verify.mjs`, walking up to `$SCRATCH/node_modules`. The scratch directory lives outside the repository and is never committed.

---

### Task 1: Path helpers, plugin entry, verifier, and `quality/max-lines`

**Files:**
- Create: `templates/skills/eslint-quality-gates/eslint-rules/utils.cjs`
- Create: `templates/skills/eslint-quality-gates/eslint-rules/core-rules.cjs`
- Create: `templates/skills/eslint-quality-gates/eslint-rules/index.cjs`
- Test: `templates/skills/eslint-quality-gates/verify.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `utils.cjs` exports `DEFAULT_MAX_LINES` (number, 350), `BANNED_CONSOLE_METHODS` (`Set<string>`), `fileName(context) -> string`, `isTestFile(filename: string) -> boolean`, `isCheckableSourceFile(filename: string) -> boolean`, `isBaselineIgnored(filename: string, ignore: string[]) -> boolean`. `core-rules.cjs` exports `maxLines` (an ESLint rule object). `index.cjs` exports `{ rules: { "max-lines": maxLines } }`. `verify.mjs` accepts the plugin path as `process.argv[2]`, defaulting to `./eslint-rules/index.cjs`, resolved against the current working directory.

- [ ] **Step 1: Write the failing test**

Create `templates/skills/eslint-quality-gates/verify.mjs`:

```js
// Self-check for the quality/* rules. Uses ESLint's own RuleTester and
// nothing else -- no test framework, no dev dependency beyond ESLint.
//
// Usage, from the root of a project that installed the rules:
//   node .claude/skills/eslint-quality-gates/verify.mjs
// Pass a path to check a copy that lives somewhere else:
//   node verify.mjs ./eslint-rules/index.cjs
//
// RuleTester.run() throws on the first failing case, so a non-zero exit is
// the failure signal; there is no assertion library to configure. Test
// sources are plain JavaScript with .ts/.tsx filenames on purpose: the
// rules only ever look at the filename and at syntax espree already
// understands, so the check needs no TypeScript parser.
import path from "node:path";
import { pathToFileURL } from "node:url";

import { RuleTester } from "eslint";

const target = process.argv[2] ?? "./eslint-rules/index.cjs";
const plugin = (await import(pathToFileURL(path.resolve(target)).href)).default;

const ruleTester = new RuleTester();
const lines = (count) => "const value = 1;\n".repeat(count);

ruleTester.run("quality/max-lines", plugin.rules["max-lines"], {
  valid: [
    {
      name: "a file under the budget",
      code: lines(3),
      filename: "src/service.ts",
      options: [{ max: 10 }],
    },
    {
      name: "test files are exempt by default",
      code: lines(20),
      filename: "src/service.test.ts",
      options: [{ max: 10 }],
    },
    {
      name: "files inside a test directory are exempt by default",
      code: lines(20),
      filename: "src/__tests__/helpers.ts",
      options: [{ max: 10 }],
    },
    {
      name: "declaration files are never checked",
      code: lines(20),
      filename: "src/types.d.ts",
      options: [{ max: 10 }],
    },
    {
      name: "barrel files are never checked",
      code: lines(20),
      filename: "src/index.ts",
      options: [{ max: 10 }],
    },
    {
      name: "generated output is never checked",
      code: lines(20),
      filename: "src/generated/client.ts",
      options: [{ max: 10 }],
    },
    {
      name: "a baseline entry silences a known offender",
      code: lines(20),
      filename: "src/legacy.ts",
      options: [{ max: 10, ignore: ["src/legacy.ts"] }],
    },
  ],
  invalid: [
    {
      name: "a file over the budget",
      code: lines(20),
      filename: "src/service.ts",
      options: [{ max: 10 }],
      errors: [{ messageId: "tooLong" }],
    },
    {
      name: "includeTests brings test files back under the budget",
      code: lines(20),
      filename: "src/service.test.ts",
      options: [{ max: 10, includeTests: true }],
      errors: [{ messageId: "tooLong" }],
    },
  ],
});

console.log("quality/max-lines: ok");
```

- [ ] **Step 2: Run the verifier to watch it fail**

```bash
SCRATCH="${TMPDIR:-/tmp}/eslint-skill-scratch"
rm -rf "$SCRATCH/skill" \
  && cp -r templates/skills/eslint-quality-gates "$SCRATCH/skill" \
  && (cd "$SCRATCH" && node skill/verify.mjs skill/eslint-rules/index.cjs)
```

Expected: `ERR_MODULE_NOT_FOUND` for `skill/eslint-rules/index.cjs` — the plugin does not exist yet.

- [ ] **Step 3: Write the path helpers**

Create `templates/skills/eslint-quality-gates/eslint-rules/utils.cjs`:

```js
"use strict";

const DEFAULT_MAX_LINES = 350;

const BANNED_CONSOLE_METHODS = new Set([
  "log",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "dir",
  "table",
  "time",
  "timeEnd",
  "timeLog",
  "group",
  "groupEnd",
  "groupCollapsed",
  "count",
  "countReset",
  "assert",
  "profile",
  "profileEnd",
]);

// A file whose basename says it is not production source. Config and story
// files are here for the same reason as tests: their length says nothing
// about how well the code behind them is factored.
const NON_SOURCE_BASENAME = /\.(test|spec|stories|config|conf)\.[^.]+$/;

// A barrel or a pure declaration module. An index.ts that only re-exports
// has no meaningful size, and neither does a file that is nothing but type
// or constant declarations.
const TYPE_BARREL_BASENAME =
  /^(index|types?|interfaces?|constants?|dtos?|enums?|vo)\.[^.]+$/;

// Directories whose contents are either not authored by hand or not part of
// the application being linted.
const IGNORED_PATH_SEGMENTS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  "generated",
  "__generated__",
  "migrations",
  "migration",
  "locales",
  "__tests__",
  "__mocks__",
  "fixtures",
  "mocks",
]);

function normalizeFilePath(filename) {
  return filename.replace(/\\/g, "/");
}

// context.filename is the ESLint 9 property; getFilename() is kept as a
// fallback so these rules also load under a v8 host without editing.
function fileName(context) {
  return normalizeFilePath(context.filename ?? context.getFilename());
}

function isTestFile(filename) {
  return /(^|\/)(__tests__|__mocks__|fixtures|mocks)(\/|$)|\.(test|spec)\.[cm]?[jt]sx?$/.test(
    filename
  );
}

function isCheckableSourceFile(filename) {
  if (filename.endsWith(".d.ts")) return false;
  const segments = filename.split("/");
  for (const segment of segments.slice(0, -1)) {
    if (IGNORED_PATH_SEGMENTS.has(segment)) return false;
  }
  const base = segments[segments.length - 1];
  return !NON_SOURCE_BASENAME.test(base) && !TYPE_BARREL_BASENAME.test(base);
}

// Baseline entries are matched as a whole path or as a path suffix, so an
// entry written the way a lint report prints it ("src/legacy.ts") matches
// regardless of whether ESLint hands the rule an absolute path.
function isBaselineIgnored(filename, ignore) {
  return ignore.some(
    (entry) => filename === entry || filename.endsWith(`/${entry}`)
  );
}

module.exports = {
  BANNED_CONSOLE_METHODS,
  DEFAULT_MAX_LINES,
  fileName,
  isBaselineIgnored,
  isCheckableSourceFile,
  isTestFile,
};
```

- [ ] **Step 4: Write the rule**

Create `templates/skills/eslint-quality-gates/eslint-rules/core-rules.cjs`:

```js
"use strict";

const {
  DEFAULT_MAX_LINES,
  fileName,
  isBaselineIgnored,
  isCheckableSourceFile,
  isTestFile,
} = require("./utils.cjs");

const maxLines = {
  meta: {
    type: "suggestion",
    docs: { description: "Enforce a source file size budget." },
    messages: {
      tooLong: [
        "File too large ({{lines}} lines | max {{max}}).",
        "",
        "Refactor into smaller, focused units:",
        "  - Business logic -> domain service or use-case module",
        "  - Repeated UI blocks -> reusable sub-component",
        "  - Data access code -> repository or adapter",
        "  - Helper clusters -> domain-specific utility module",
      ].join("\n"),
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
          ignore: { type: "array", items: { type: "string" } },
          includeTests: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] ?? {};
    const max = options.max ?? DEFAULT_MAX_LINES;
    const ignore = options.ignore ?? [];
    // Opt-in, default false. Test files are outside isCheckableSourceFile by
    // design; turning this on is how the same budget gets applied to them in
    // a separate "warn" block without loosening the "error" on production
    // code. See the test-file block in eslint.config.mjs.example.
    const includeTests = options.includeTests ?? false;
    const filename = fileName(context);
    const checkable =
      isCheckableSourceFile(filename) ||
      (includeTests && isTestFile(filename) && !filename.endsWith(".d.ts"));
    if (!checkable || isBaselineIgnored(filename, ignore)) {
      return {};
    }
    return {
      Program() {
        const lines = context.sourceCode.lines.length;
        if (lines > max) {
          context.report({
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
            messageId: "tooLong",
            data: { lines, max },
          });
        }
      },
    };
  },
};

module.exports = {
  maxLines,
};
```

Create `templates/skills/eslint-quality-gates/eslint-rules/index.cjs`:

```js
"use strict";

const { maxLines } = require("./core-rules.cjs");

module.exports = {
  rules: {
    "max-lines": maxLines,
  },
};
```

- [ ] **Step 5: Run the verifier to watch it pass**

```bash
SCRATCH="${TMPDIR:-/tmp}/eslint-skill-scratch"
rm -rf "$SCRATCH/skill" \
  && cp -r templates/skills/eslint-quality-gates "$SCRATCH/skill" \
  && (cd "$SCRATCH" && node skill/verify.mjs skill/eslint-rules/index.cjs)
```

Expected output: `quality/max-lines: ok`, exit code 0.

- [ ] **Step 6: Check for leaked source-project terms**

```bash
grep -riE "firebrocks|tron|trx|usdt|\bsun\b|custody|tronzap" templates/skills/eslint-quality-gates/ ; echo "exit=$?"
```

Expected: no matches, `exit=1`.

- [ ] **Step 7: Commit**

```bash
git add templates/skills/eslint-quality-gates
git commit -m "feat(skill): add quality/max-lines rule with a RuleTester self-check"
```

---

### Task 2: `quality/no-direct-console`

**Files:**
- Modify: `templates/skills/eslint-quality-gates/eslint-rules/core-rules.cjs`
- Modify: `templates/skills/eslint-quality-gates/eslint-rules/index.cjs`
- Test: `templates/skills/eslint-quality-gates/verify.mjs`

**Interfaces:**
- Consumes: `fileName`, `isTestFile`, `BANNED_CONSOLE_METHODS` from `utils.cjs` (Task 1).
- Produces: `core-rules.cjs` additionally exports `noDirectConsole`. `index.cjs` additionally registers `"no-direct-console": noDirectConsole`. The rule accepts `{ allow?: string[], logger?: string }`.

- [ ] **Step 1: Write the failing test**

Append to the end of `templates/skills/eslint-quality-gates/verify.mjs`:

```js
ruleTester.run("quality/no-direct-console", plugin.rules["no-direct-console"], {
  valid: [
    {
      name: "a logging helper is fine",
      code: "logger.info('hello');",
      filename: "src/service.ts",
    },
    {
      name: "test files may log freely",
      code: "console.log('hello');",
      filename: "src/service.test.ts",
    },
    {
      name: "an allowed method is not reported",
      code: "console.error('boom');",
      filename: "src/service.ts",
      options: [{ allow: ["error"] }],
    },
    {
      name: "a method that is not a console method is not reported",
      code: "console.render('x');",
      filename: "src/service.ts",
    },
    {
      name: "an identifier that merely ends in console is not the console",
      code: "fakeconsole.log('x');",
      filename: "src/service.ts",
    },
  ],
  invalid: [
    {
      name: "a direct console call in production code",
      code: "console.log('hello');",
      filename: "src/service.ts",
      errors: [
        {
          messageId: "banned",
          data: { method: "log", logger: "the project logging helper" },
        },
      ],
    },
    {
      name: "the logger option names the replacement in the message",
      code: "console.warn('hello');",
      filename: "src/service.ts",
      options: [{ logger: "logger.warn()" }],
      errors: [{ messageId: "banned", data: { method: "warn", logger: "logger.warn()" } }],
    },
  ],
});

console.log("quality/no-direct-console: ok");
```

- [ ] **Step 2: Run the verifier to watch it fail**

```bash
SCRATCH="${TMPDIR:-/tmp}/eslint-skill-scratch"
rm -rf "$SCRATCH/skill" \
  && cp -r templates/skills/eslint-quality-gates "$SCRATCH/skill" \
  && (cd "$SCRATCH" && node skill/verify.mjs skill/eslint-rules/index.cjs)
```

Expected: `quality/max-lines: ok` prints, then a `TypeError` because `plugin.rules["no-direct-console"]` is `undefined`.

- [ ] **Step 3: Write the rule**

In `templates/skills/eslint-quality-gates/eslint-rules/core-rules.cjs`, extend the `require` at the top of the file to also pull `BANNED_CONSOLE_METHODS`:

```js
const {
  BANNED_CONSOLE_METHODS,
  DEFAULT_MAX_LINES,
  fileName,
  isBaselineIgnored,
  isCheckableSourceFile,
  isTestFile,
} = require("./utils.cjs");
```

Add the rule after `maxLines`:

```js
const noDirectConsole = {
  meta: {
    type: "problem",
    docs: { description: "Disallow direct console output outside log adapters." },
    messages: {
      banned: "Use {{logger}} instead of console.{{method}}().",
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: { type: "array", items: { type: "string" } },
          logger: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] ?? {};
    const allow = new Set(options.allow ?? []);
    const logger = options.logger ?? "the project logging helper";
    // The project's own log adapter -- the file that IS the console wrapper,
    // plus anything that must log before the rest of the infrastructure is
    // reachable -- is exempted with a glob override in the config, not with
    // a hardcoded list here. Test files are exempt in the rule because every
    // rule in this plugin treats them the same way.
    const filename = fileName(context);
    if (isTestFile(filename)) return {};
    return {
      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          node.object.name === "console" &&
          node.property.type === "Identifier" &&
          BANNED_CONSOLE_METHODS.has(node.property.name) &&
          !allow.has(node.property.name)
        ) {
          context.report({
            node,
            messageId: "banned",
            data: { logger, method: node.property.name },
          });
        }
      },
    };
  },
};
```

Update the export block at the bottom of the file:

```js
module.exports = {
  maxLines,
  noDirectConsole,
};
```

Replace the contents of `templates/skills/eslint-quality-gates/eslint-rules/index.cjs`:

```js
"use strict";

const { maxLines, noDirectConsole } = require("./core-rules.cjs");

module.exports = {
  rules: {
    "max-lines": maxLines,
    "no-direct-console": noDirectConsole,
  },
};
```

- [ ] **Step 4: Run the verifier to watch it pass**

```bash
SCRATCH="${TMPDIR:-/tmp}/eslint-skill-scratch"
rm -rf "$SCRATCH/skill" \
  && cp -r templates/skills/eslint-quality-gates "$SCRATCH/skill" \
  && (cd "$SCRATCH" && node skill/verify.mjs skill/eslint-rules/index.cjs)
```

Expected: both `quality/max-lines: ok` and `quality/no-direct-console: ok`, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add templates/skills/eslint-quality-gates
git commit -m "feat(skill): add quality/no-direct-console with allow and logger options"
```

---

### Task 3: `quality/no-direct-data-access`

**Files:**
- Modify: `templates/skills/eslint-quality-gates/eslint-rules/core-rules.cjs`
- Modify: `templates/skills/eslint-quality-gates/eslint-rules/index.cjs`
- Test: `templates/skills/eslint-quality-gates/verify.mjs`

**Interfaces:**
- Consumes: `fileName`, `isTestFile` from `utils.cjs` (Task 1).
- Produces: `core-rules.cjs` additionally exports `noDirectDataAccess`. `index.cjs` additionally registers `"no-direct-data-access": noDirectDataAccess`. The rule requires `{ modules: string[], layers: string[] }` and accepts optional `bindings` (default `["db"]`) and `extensions` (default `[]`). `modules` and `layers` are both `minItems: 1` and both `required`, so a half-configured rule is a loud schema error rather than a rule that silently never fires.

- [ ] **Step 1: Write the failing test**

Append to the end of `templates/skills/eslint-quality-gates/verify.mjs`:

```js
const dataAccess = {
  modules: ["@/db", "@/db/index"],
  layers: ["/src/app/", "/src/components/"],
  extensions: [".tsx"],
};

ruleTester.run(
  "quality/no-direct-data-access",
  plugin.rules["no-direct-data-access"],
  {
    valid: [
      {
        name: "a guarded layer importing something other than the client",
        code: "import { userColumns } from '@/db';",
        filename: "/repo/src/app/page.ts",
        options: [dataAccess],
      },
      {
        name: "a layer that is not guarded may import the client",
        code: "import { db } from '@/db';",
        filename: "/repo/src/server/user-repository.ts",
        options: [dataAccess],
      },
      {
        name: "a module that is not the data module",
        code: "import { db } from './local-cache';",
        filename: "/repo/src/app/page.ts",
        options: [dataAccess],
      },
      {
        name: "test files are exempt",
        code: "import { db } from '@/db';",
        filename: "/repo/src/app/page.test.ts",
        options: [dataAccess],
      },
      {
        name: "a side-effect import pulls no binding",
        code: "import '@/db';",
        filename: "/repo/src/app/page.ts",
        options: [dataAccess],
      },
      {
        name: "a custom binding list does not match the default name",
        code: "import { db } from '@/db';",
        filename: "/repo/src/app/page.ts",
        options: [{ ...dataAccess, bindings: ["prisma"] }],
      },
    ],
    invalid: [
      {
        name: "a guarded layer importing the client by name",
        code: "import { db } from '@/db';",
        filename: "/repo/src/app/page.ts",
        options: [dataAccess],
        errors: [{ messageId: "forbidden", data: { module: "@/db" } }],
      },
      {
        name: "the extensions list guards a file outside the layer paths",
        code: "import { db } from '@/db';",
        filename: "/repo/src/widgets/table.tsx",
        options: [dataAccess],
        errors: [{ messageId: "forbidden", data: { module: "@/db" } }],
      },
      {
        name: "a default import always counts as pulling the client",
        code: "import anything from '@/db';",
        filename: "/repo/src/app/page.ts",
        options: [dataAccess],
        errors: [{ messageId: "forbidden", data: { module: "@/db" } }],
      },
      {
        name: "a namespace import always counts as pulling the client",
        code: "import * as everything from '@/db';",
        filename: "/repo/src/app/page.ts",
        options: [dataAccess],
        errors: [{ messageId: "forbidden", data: { module: "@/db" } }],
      },
      {
        name: "a renamed import is matched on the imported name, not the local one",
        code: "import { db as database } from '@/db';",
        filename: "/repo/src/app/page.ts",
        options: [dataAccess],
        errors: [{ messageId: "forbidden", data: { module: "@/db" } }],
      },
      {
        name: "a custom binding list matches its own name",
        code: "import { prisma } from '@/db';",
        filename: "/repo/src/app/page.ts",
        options: [{ ...dataAccess, bindings: ["prisma"] }],
        errors: [{ messageId: "forbidden", data: { module: "@/db" } }],
      },
    ],
  }
);

console.log("quality/no-direct-data-access: ok");
```

- [ ] **Step 2: Run the verifier to watch it fail**

```bash
SCRATCH="${TMPDIR:-/tmp}/eslint-skill-scratch"
rm -rf "$SCRATCH/skill" \
  && cp -r templates/skills/eslint-quality-gates "$SCRATCH/skill" \
  && (cd "$SCRATCH" && node skill/verify.mjs skill/eslint-rules/index.cjs)
```

Expected: the first two rules print `ok`, then a `TypeError` because `plugin.rules["no-direct-data-access"]` is `undefined`.

- [ ] **Step 3: Write the rule**

In `templates/skills/eslint-quality-gates/eslint-rules/core-rules.cjs`, add this helper immediately below the `require` block at the top of the file:

```js
// A default or namespace import pulls whatever the module exports, so it
// always counts as reaching the client. A named import is matched on the
// imported name rather than the local alias, so `import { db as database }`
// is still caught.
function importsGuardedBinding(node, bindings) {
  return node.specifiers.some((specifier) => {
    if (
      specifier.type === "ImportDefaultSpecifier" ||
      specifier.type === "ImportNamespaceSpecifier"
    ) {
      return true;
    }
    return (
      specifier.type === "ImportSpecifier" &&
      specifier.imported.type === "Identifier" &&
      bindings.has(specifier.imported.name)
    );
  });
}
```

Add the rule after `noDirectConsole`:

```js
const noDirectDataAccess = {
  meta: {
    type: "problem",
    docs: {
      description: "Keep the database client out of presentation layers.",
    },
    messages: {
      forbidden:
        "Do not import {{module}} from this layer; go through a repository or service instead.",
    },
    // modules and layers are both required with minItems 1. A rule that is
    // half-configured should fail loudly at config load, not quietly match
    // nothing forever.
    schema: [
      {
        type: "object",
        properties: {
          modules: { type: "array", items: { type: "string" }, minItems: 1 },
          layers: { type: "array", items: { type: "string" }, minItems: 1 },
          bindings: { type: "array", items: { type: "string" } },
          extensions: { type: "array", items: { type: "string" } },
        },
        required: ["modules", "layers"],
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] ?? {};
    const modules = new Set(options.modules ?? []);
    const layers = options.layers ?? [];
    const bindings = new Set(options.bindings ?? ["db"]);
    const extensions = options.extensions ?? [];
    const filename = fileName(context);
    if (isTestFile(filename)) return {};
    // Two independent ways a file counts as presentation: it sits under one
    // of the guarded paths, or it carries a guarded extension wherever it
    // lives. The extension branch exists because a component file is a
    // component regardless of which directory someone parked it in.
    const guarded =
      layers.some((layer) => filename.includes(layer)) ||
      extensions.some((extension) => filename.endsWith(extension));
    if (!guarded) return {};
    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        if (!modules.has(source)) return;
        if (!importsGuardedBinding(node, bindings)) return;
        context.report({ node, messageId: "forbidden", data: { module: source } });
      },
    };
  },
};
```

Update the export block at the bottom of the file:

```js
module.exports = {
  maxLines,
  noDirectConsole,
  noDirectDataAccess,
};
```

Replace the contents of `templates/skills/eslint-quality-gates/eslint-rules/index.cjs`:

```js
"use strict";

const {
  maxLines,
  noDirectConsole,
  noDirectDataAccess,
} = require("./core-rules.cjs");

module.exports = {
  rules: {
    "max-lines": maxLines,
    "no-direct-console": noDirectConsole,
    "no-direct-data-access": noDirectDataAccess,
  },
};
```

- [ ] **Step 4: Run the verifier to watch it pass**

```bash
SCRATCH="${TMPDIR:-/tmp}/eslint-skill-scratch"
rm -rf "$SCRATCH/skill" \
  && cp -r templates/skills/eslint-quality-gates "$SCRATCH/skill" \
  && (cd "$SCRATCH" && node skill/verify.mjs skill/eslint-rules/index.cjs)
```

Expected: three `ok` lines, exit code 0.

- [ ] **Step 5: Prove the schema rejects a half-configured rule**

```bash
SCRATCH="${TMPDIR:-/tmp}/eslint-skill-scratch"
cat > "$SCRATCH/schema-check.mjs" <<'EOF'
import { RuleTester } from "eslint";
import plugin from "./skill/eslint-rules/index.cjs";
const ruleTester = new RuleTester();
try {
  ruleTester.run("schema", plugin.rules["no-direct-data-access"], {
    valid: [{ code: "const a = 1;", filename: "src/a.ts", options: [{ modules: ["@/db"] }] }],
    invalid: [],
  });
  console.log("FAIL: a missing layers option was accepted");
  process.exit(1);
} catch {
  console.log("schema rejects a missing layers option: ok");
}
EOF
(cd "$SCRATCH" && node schema-check.mjs)
```

Expected: `schema rejects a missing layers option: ok`, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add templates/skills/eslint-quality-gates
git commit -m "feat(skill): add quality/no-direct-data-access with configurable modules and layers"
```

---

### Task 4: The two config skeletons

**Files:**
- Create: `templates/skills/eslint-quality-gates/eslint.config.mjs.example`
- Create: `templates/skills/eslint-quality-gates/eslint.typed.config.mjs.example`

**Interfaces:**
- Consumes: `index.cjs` from Tasks 1-3, imported as `quality` and registered under the `quality` plugin key.
- Produces: two files an agent copies to `eslint.config.mjs` and `eslint.typed.config.mjs` in a target project. The type-aware file imports the fast one with `import defaultConfig from "./eslint.config.mjs"` and spreads it, so the fast file must keep that exact default export shape.

- [ ] **Step 1: Write the fast tier skeleton**

Create `templates/skills/eslint-quality-gates/eslint.config.mjs.example`:

```js
// Fast lint tier. Everything here runs without type information, which is
// what keeps it quick enough for a pre-commit hook. The rules that need the
// type checker live in eslint.typed.config.mjs and run on their own script.
//
// Adapt before use:
//   - the paths in the import-x zones and in quality/no-direct-data-access
//   - the framework blocks, commented out below
//   - the globalIgnores list
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importX from "eslint-plugin-import-x";
import tseslint from "typescript-eslint";

import quality from "./eslint-rules/index.cjs";

export default defineConfig([
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
      // js.configs.recommended turns on no-undef, which knows nothing about
      // the runtime this project targets -- without this, every console or
      // process reference is reported as an undefined variable. Declare what
      // the code actually uses. When the list outgrows a handful, install the
      // `globals` package and spread globals.node or globals.browser instead.
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.strict,

  // Framework presets. Uncomment only what this project actually uses, and
  // add the matching import at the top of the file. Turning on a preset
  // wholesale is the opposite of what the rest of this config does -- prefer
  // a curated subset per plugin, added as its own files-scoped block below.
  //
  //   nextPlugin.configs["core-web-vitals"],
  //   reactPlugin.configs.flat["jsx-runtime"],
  //   reactHooks.configs.flat.recommended,

  {
    // import-x resolves TypeScript path aliases so no-unresolved is accurate.
    // The two no-restricted-paths entries are the architecture boundary: the
    // first plugin key carries what must never regress, the second carries
    // the debt that already exists.
    plugins: { "import-x": importX, "import-x-debt": importX },
    settings: {
      "import-x/resolver-next": [createTypeScriptImportResolver()],
    },
    rules: {
      "import-x/no-unresolved": "error",
      "import-x/no-duplicates": "error",
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            // Scope `from` as narrowly as the boundary actually needs. A
            // schema directory usually also exports plain shared constants
            // and types that the UI legitimately imports; blocking the whole
            // tree turns a real boundary into noise people learn to ignore.
            { target: "./src/app/**/*", from: "./src/db/index.ts" },
            // `except` is relative to `from`, not an independent path. It
            // carves specific files back out of the `from` glob -- it cannot
            // exempt an importer. To exempt an importer, narrow `target`.
            {
              target: ["./src/app/**/*", "./src/components/**/*"],
              from: "./src/db/schema/**/*",
              except: ["**/shared-enums.ts"],
            },
            {
              target: ["./src/app/**/*", "./src/components/**/*"],
              from: "./src/server/adapters/**/*",
            },
          ],
        },
      ],
      // The same package, registered a second time under a different plugin
      // key. Flat config cannot mix severities inside one rule's `zones`
      // array, and two blocks matching the same files replace each other
      // rather than merging their zones -- so an aliased key is the only way
      // to run "error" zones and "warn" zones side by side. Put pre-existing
      // boundary debt here, fix it, then promote the zone into the block
      // above and delete it from this one.
      "import-x-debt/no-restricted-paths": [
        "warn",
        {
          zones: [
            // A barrel that is a sibling of the directory
            // (src/server/repositories.ts next to src/server/repositories/)
            // is not matched by "repositories/**/*". It needs its own entry.
            // That entry has to be a glob too: `from` rejects an array that
            // mixes globs with a literal path, and the failure mode is the
            // rule reporting a schema message on every file the zone touches
            // instead of the violations you wanted.
            {
              target: "./src/app/**/*",
              from: [
                "./src/server/repositories/**/*",
                "./src/server/repositories.*",
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    plugins: { quality },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-var": "error",
      "prefer-const": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // The size and complexity budget is all "warn" on purpose. These
      // numbers are a conversation starter about factoring, not a gate --
      // promote one to "error" once the count for it reaches zero.
      complexity: ["warn", 12],
      "max-depth": ["warn", 4],
      "max-statements": ["warn", 20],
      "max-params": ["warn", 4],
      "max-lines-per-function": [
        "warn",
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
      "max-nested-callbacks": ["warn", 3],
      "quality/max-lines": "error",
      "quality/no-direct-console": [
        "error",
        { logger: "the project logging helper" },
      ],
      "quality/no-direct-data-access": [
        "error",
        {
          modules: ["@/db", "@/db/index"],
          bindings: ["db"],
          layers: ["/src/app/", "/src/components/"],
          extensions: [".tsx"],
        },
      ],
    },
  },
  {
    // The log adapter itself, and anything that has to log before the rest of
    // the infrastructure is reachable. This block MUST come after the block
    // that turns the rule on: for a file matched by both, flat config applies
    // the later block's rules last, so an "off" placed earlier is silently
    // overridden by the "error" that follows it.
    files: ["src/server/logger.ts", "src/db/migrate.ts"],
    rules: {
      "quality/no-direct-console": "off",
    },
  },
  {
    // The same file budget for test files, at "warn". Also placed after the
    // "error" block for the same ordering reason. Two glob branches, because
    // a file counts as a test either by suffix or by directory -- and the
    // suffix branch alone misses test-support files that live in __tests__/
    // without being *.test.ts themselves.
    files: [
      "**/*.test.{ts,tsx}",
      "**/{__tests__,__mocks__,fixtures,mocks}/**/*.{ts,tsx}",
    ],
    plugins: { quality },
    rules: {
      "quality/max-lines": ["warn", { includeTests: true }],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      // These three fire heavily on describe/it nesting and on long arrange
      // sections without pointing at a real problem. complexity, max-depth
      // and max-params stay on for tests -- they were not part of the noise.
      "max-statements": "off",
      "max-lines-per-function": "off",
      "max-nested-callbacks": "off",
      // no-restricted-paths has no concept of a test file the way the
      // quality/* rules do, and fixtures legitimately import schema objects
      // directly.
      "import-x/no-restricted-paths": "off",
      "import-x-debt/no-restricted-paths": "off",
    },
  },
  {
    files: ["eslint-rules/**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { module: "readonly", require: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    // Agent harness files, vendored automation and standalone tooling are not
    // the application this config polices. Without these, Node-runtime
    // scripts that never declared Node globals drown real findings in
    // no-undef noise.
    ".claude/**",
    ".github/agents/**",
    ".github/hooks/**",
    ".github/skills/**",
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "**/*.tsbuildinfo",
    "package-lock.json",
    "src/generated/**",
  ]),
]);
```

- [ ] **Step 2: Write the type-aware tier skeleton**

Create `templates/skills/eslint-quality-gates/eslint.typed.config.mjs.example`:

```js
// Type-aware lint tier, deliberately kept OUT of eslint.config.mjs. Turning
// on projectService means ESLint builds a full TypeScript program, which on
// a large codebase is slow enough to break a pre-commit hook and heavy
// enough to exhaust the heap on a small CI runner.
//
// Two config files and two npm scripts (`lint` and `lint:types`), rather
// than one config branching on process.env.CI: branching makes local and CI
// behavior diverge silently for identical code, and reading process.env
// inside a flat config file trips that config's own no-undef rule.
import defaultConfig from "./eslint.config.mjs";

export default [
  ...defaultConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Every rule here starts at "warn". None of them has a known violation
      // count on a codebase this config has never run against, so none of
      // them gets to fail a build sight unseen. Promote to "error" per rule,
      // once its count is zero.
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

- [ ] **Step 3: Prove the fast skeleton loads and enforces the quality rules**

This installs the skeleton into the scratch project exactly the way the skill will, then lints a fixture that violates all three rules.

```bash
SCRATCH="${TMPDIR:-/tmp}/eslint-skill-scratch"
rm -rf "$SCRATCH/skill" && cp -r templates/skills/eslint-quality-gates "$SCRATCH/skill"
cd "$SCRATCH"
npm i -D @eslint/js typescript-eslint eslint-plugin-import-x eslint-import-resolver-typescript typescript --no-audit --no-fund
cp -r skill/eslint-rules .
cp skill/eslint.config.mjs.example eslint.config.mjs
printf '{"compilerOptions":{"strict":true,"module":"esnext","moduleResolution":"bundler","baseUrl":".","paths":{"@/*":["./src/*"]}},"include":["src"]}\n' > tsconfig.json
mkdir -p src/app src/db
printf 'export const db = {};\n' > src/db/index.ts
printf "import { db } from '@/db';\nconsole.log(db);\n" > src/app/page.ts
npx eslint src --no-cache
```

Expected: exit code 1, with `quality/no-direct-data-access` and `quality/no-direct-console` both reported on `src/app/page.ts`, and no config-loading error.

- [ ] **Step 4: Prove the type-aware skeleton loads on top of the fast one**

```bash
SCRATCH="${TMPDIR:-/tmp}/eslint-skill-scratch"
cd "$SCRATCH"
cp skill/eslint.typed.config.mjs.example eslint.typed.config.mjs
npx eslint --config eslint.typed.config.mjs src --no-cache
```

Expected: exit code 1 with the same two errors as Step 3, and no config-loading error — the type-aware tier composes the fast tier rather than replacing it.

- [ ] **Step 5: Check for leaked source-project terms**

```bash
grep -riE "firebrocks|tron|trx|usdt|\bsun\b|custody|tronzap" templates/skills/eslint-quality-gates/ ; echo "exit=$?"
```

Expected: no matches, `exit=1`.

- [ ] **Step 6: Commit**

```bash
git add templates/skills/eslint-quality-gates
git commit -m "feat(skill): add the fast and type-aware ESLint config skeletons"
```

---

### Task 5: `SKILL.md`

**Files:**
- Create: `templates/skills/eslint-quality-gates/SKILL.md`

**Interfaces:**
- Consumes: every file produced by Tasks 1-4, referenced by its exact path relative to the skill folder.
- Produces: the entry point an agent reads. Frontmatter `name` must be `eslint-quality-gates`, matching the directory name, or Claude Code will not load the skill.

- [ ] **Step 1: Write the skill file**

Create `templates/skills/eslint-quality-gates/SKILL.md`:

````markdown
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
npm i -D eslint@^9 @eslint/js
# TypeScript projects:
npm i -D typescript-eslint
# Only if enforcing import boundaries:
npm i -D eslint-plugin-import-x eslint-import-resolver-typescript
```

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
  delete the whole `import-x` block if the project has no layering yet
- The `quality/no-direct-console` "off" block — point it at the real log
  adapter, or delete the block if there is none
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
````

- [ ] **Step 2: Check the frontmatter parses and the name matches the directory**

```bash
head -5 templates/skills/eslint-quality-gates/SKILL.md
grep -c '^name: eslint-quality-gates$' templates/skills/eslint-quality-gates/SKILL.md
```

Expected: the frontmatter block prints with `---` on line 1, and the grep prints `1`.

- [ ] **Step 3: Check every path the skill references exists**

```bash
cd templates/skills/eslint-quality-gates
for f in eslint-rules/index.cjs eslint-rules/utils.cjs eslint-rules/core-rules.cjs \
         eslint.config.mjs.example eslint.typed.config.mjs.example verify.mjs; do
  test -f "$f" && echo "ok $f" || echo "MISSING $f"
done
```

Expected: six `ok` lines, no `MISSING`.

- [ ] **Step 4: Check for leaked source-project terms**

```bash
grep -riE "firebrocks|tron|trx|usdt|\bsun\b|custody|tronzap" templates/skills/eslint-quality-gates/ ; echo "exit=$?"
```

Expected: no matches, `exit=1`.

- [ ] **Step 5: Commit**

```bash
git add templates/skills/eslint-quality-gates/SKILL.md
git commit -m "feat(skill): add the SKILL.md install procedure"
```

---

### Task 6: Documentation pointers

**Files:**
- Modify: `docs/tools/06-eslint-biome-quality-gates.md` (append a section at the end)
- Modify: `docs/prompts/07-eslint-complete-setup.md` (insert a note under "Quando usar")
- Modify: `README.md` (the `templates/` bullet in the "Como usar este repositório" list)

**Interfaces:**
- Consumes: the skill folder path `templates/skills/eslint-quality-gates/`.
- Produces: nothing other files depend on.

- [ ] **Step 1: Append the pointer section to the tool doc**

Append to the end of `docs/tools/06-eslint-biome-quality-gates.md`:

```markdown
## O caminho executável: a skill

Tudo acima é o raciocínio — por que duas ferramentas, por que aviso vira
erro, por que a fronteira de arquitetura mora no lint. Se você quer o
resultado sem reconstruir o raciocínio, a versão executável está em
[`templates/skills/eslint-quality-gates/`](../../templates/skills/eslint-quality-gates/).

A pasta é uma skill de Claude Code com as três regras próprias já escritas e
testadas — teto de tamanho de arquivo, console direto e acesso direto ao
banco a partir da camada de apresentação — mais os dois esqueletos de
configuração e um verificador que prova que a cópia chegou íntegra.

Para usar, copie a pasta para `.claude/skills/` do seu projeto e peça ao
agente para instalar as regras. Ou, sem copiar nada, aponte o agente direto
para a pasta dentro do clone deste repositório:

> Leia `templates/skills/eslint-quality-gates/SKILL.md` deste clone do
> vibe-coding-toolkit e siga o procedimento para instalar as regras neste
> projeto.

O agente detecta a stack, copia as regras, adapta os caminhos, roda o
verificador e reporta a contagem de violações por regra. Ele não conserta as
violações — para isso existe o
[burndown de avisos](../prompts/02-eslint-warning-burndown.md).
```

- [ ] **Step 2: Add the note to the prompt doc**

In `docs/prompts/07-eslint-complete-setup.md`, insert this immediately after the last paragraph of the `## Quando usar` section, before the `## Por que funciona` heading:

```markdown
> [!TIP]
> Se você quer o resultado em vez do raciocínio, existe um caminho mais
> curto: a skill em
> [`templates/skills/eslint-quality-gates/`](../../templates/skills/eslint-quality-gates/)
> entrega as três regras próprias já escritas e testadas, com um verificador
> junto. Este prompt continua sendo o caminho certo quando você quer que o
> agente monte a configuração raciocinando sobre a sua stack, incluindo as
> regras específicas de framework que a skill deixa de fora de propósito.
```

- [ ] **Step 3: Update the README bullet**

In `README.md`, inside the "Como usar este repositório" list, replace this line:

```markdown
- **Quer só os arquivos de configuração pra colar no seu projeto?** [`templates/`](templates/) tem o `CLAUDE.md.template`, um `settings.json.example` de hooks, e a regra de ondas paralelas pronta pra copiar.
```

with:

```markdown
- **Quer só os arquivos de configuração pra colar no seu projeto?** [`templates/`](templates/) tem o `CLAUDE.md.template`, um `settings.json.example` de hooks, e a regra de ondas paralelas pronta pra copiar.
- **Quer o ESLint configurado sem configurar nada à mão?** [`templates/skills/eslint-quality-gates/`](templates/skills/eslint-quality-gates/) é uma skill pronta: aponte seu agente pra ela e ele instala três regras próprias já testadas, os dois níveis de configuração e um verificador, adaptando tudo pra estrutura do seu projeto.
```

- [ ] **Step 4: Verify every new link resolves**

```bash
test -d templates/skills/eslint-quality-gates && echo "ok skill dir"
test -f docs/prompts/02-eslint-warning-burndown.md && echo "ok burndown link"
grep -c "templates/skills/eslint-quality-gates" README.md docs/tools/06-eslint-biome-quality-gates.md docs/prompts/07-eslint-complete-setup.md
```

Expected: both `ok` lines, then a count of at least 1 for each of the three files.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/tools/06-eslint-biome-quality-gates.md docs/prompts/07-eslint-complete-setup.md
git commit -m "docs: point the ESLint docs at the executable skill"
```

---

### Task 7: End-to-end acceptance

Prove the spec's "critério de pronto": a fresh project, an agent following `SKILL.md` literally, and a working result. This task writes no new shipped files — it either passes or it sends you back to an earlier task.

**Files:**
- Create: nothing in the repository. The fixture project lives in the scratch directory.

**Interfaces:**
- Consumes: the entire skill folder.
- Produces: a pass or fail verdict on the whole plan.

- [ ] **Step 1: Build a fresh fixture project from nothing**

```bash
ACCEPT="${TMPDIR:-/tmp}/eslint-skill-accept"
rm -rf "$ACCEPT" && mkdir -p "$ACCEPT/src/ui" "$ACCEPT/src/data" "$ACCEPT/src/server"
cp -r templates/skills/eslint-quality-gates "$ACCEPT/skill"
cd "$ACCEPT"
printf '{"name":"accept","private":true,"type":"module"}\n' > package.json
npm i -D eslint@^9 @eslint/js typescript-eslint typescript --no-audit --no-fund
printf '{"compilerOptions":{"strict":true,"module":"esnext","moduleResolution":"bundler","baseUrl":".","paths":{"~/*":["./src/*"]}},"include":["src"]}\n' > tsconfig.json
printf 'export const client = {};\n' > src/data/client.ts
printf "export const view = () => 'ok';\n" > src/ui/dashboard.ts
printf 'export const log = (m) => m;\n' > src/server/logger.ts
```

Note the deliberate mismatches with the skeleton's defaults: the alias is
`~/*` not `@/*`, the data module is `~/data/client` exporting `client` not
`db`, the UI layer is `/src/ui/` not `/src/app/`, and there is no React. If
the skeleton only works when the project happens to match its defaults, this
step is where that shows up.

- [ ] **Step 2: Install by following SKILL.md, adapting to this project**

```bash
ACCEPT="${TMPDIR:-/tmp}/eslint-skill-accept"
cd "$ACCEPT"
cp -r skill/eslint-rules .
cp skill/eslint.config.mjs.example eslint.config.mjs
```

Now edit `eslint.config.mjs` the way step 4 of `SKILL.md` says to. Delete the
whole `import-x` block and its two imports, since this fixture has no
`eslint-plugin-import-x` installed and no layering to enforce yet. Then
replace the `quality/no-direct-data-access` options with:

```js
      "quality/no-direct-data-access": [
        "error",
        {
          modules: ["~/data/client"],
          bindings: ["client"],
          layers: ["/src/ui/"],
        },
      ],
```

Point the console carve-out block at this project's real log adapter:

```js
    files: ["src/server/logger.ts"],
```

And delete the test-file block's two `import-x` entries, since that plugin is
no longer registered.

- [ ] **Step 3: Run the verifier**

```bash
ACCEPT="${TMPDIR:-/tmp}/eslint-skill-accept"
cd "$ACCEPT" && node skill/verify.mjs ./eslint-rules/index.cjs
```

Expected: three `ok` lines, exit code 0.

- [ ] **Step 4: Prove the linter runs clean on the clean fixture**

```bash
ACCEPT="${TMPDIR:-/tmp}/eslint-skill-accept"
cd "$ACCEPT" && npx eslint src --no-cache; echo "exit=$?"
```

Expected: `exit=0`, no output. The fixture as written violates nothing.

- [ ] **Step 5: Prove each rule fires on this project's real shape**

```bash
ACCEPT="${TMPDIR:-/tmp}/eslint-skill-accept"
cd "$ACCEPT"
printf "import { client } from '~/data/client';\nconsole.log(client);\n" > src/ui/bad.ts
node -e "const lines = Array.from({ length: 400 }, (_, i) => 'export const n' + i + ' = ' + i + ';').join('\n'); require('fs').writeFileSync('src/ui/huge.ts', lines + '\n')"
npx eslint src --no-cache; echo "exit=$?"
```

Expected: `exit=1`, with `quality/no-direct-data-access` and
`quality/no-direct-console` both reported on `src/ui/bad.ts`, and
`quality/max-lines` reported on `src/ui/huge.ts`.

- [ ] **Step 6: Prove the log adapter carve-out works**

```bash
ACCEPT="${TMPDIR:-/tmp}/eslint-skill-accept"
cd "$ACCEPT"
printf 'export const log = (m) => console.log(m);\n' > src/server/logger.ts
npx eslint src/server --no-cache; echo "exit=$?"
```

Expected: `exit=0`. The carve-out block sits after the block that enables the
rule, so the `off` wins.

- [ ] **Step 7: Clean up the scratch directories**

```bash
rm -rf "${TMPDIR:-/tmp}/eslint-skill-accept" "${TMPDIR:-/tmp}/eslint-skill-scratch"
git status --porcelain
```

Expected: `git status` is clean — the fixtures lived entirely outside the
repository, so nothing was left behind to commit.

- [ ] **Step 8: Commit the plan's completion**

Nothing to commit if steps 1-7 passed and Tasks 1-6 were each committed. Run
`git log --oneline -7` and confirm six feature commits plus the design spec
are present.
