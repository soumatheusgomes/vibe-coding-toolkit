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
