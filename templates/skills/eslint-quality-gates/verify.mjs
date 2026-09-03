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
// Unique identifiers per line: repeating one declaration would collide
// with itself and fail as a parse error before any rule ever runs.
const lines = (count) =>
  Array.from({ length: count }, (_, i) => `const value${i} = ${i};`).join("\n") +
  "\n";

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
