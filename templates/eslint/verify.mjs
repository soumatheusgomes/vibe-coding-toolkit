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
