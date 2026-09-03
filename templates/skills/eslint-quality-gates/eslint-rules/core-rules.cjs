"use strict";

const {
  BANNED_CONSOLE_METHODS,
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

module.exports = {
  maxLines,
  noDirectConsole,
};
