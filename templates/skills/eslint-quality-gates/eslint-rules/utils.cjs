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
