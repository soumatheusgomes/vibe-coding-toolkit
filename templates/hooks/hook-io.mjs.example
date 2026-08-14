// JSON.parse("null") is valid and returns null without throwing — a naive
// `JSON.parse(readStdinRaw())` would treat a literal "null" stdin payload as
// a successful parse. parseHookEvent() below guards against that.

import { readFileSync } from "node:fs";

export function readStdinRaw() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

export function parseHookEvent(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed === null) {
    return null;
  }
  return parsed;
}

// Usage in a hook's entry point:
//
// const event = parseHookEvent(readStdinRaw());
// if (event === null) {
//   process.exit(0);
// }
// // ...proceed, `event` is a real parsed object
