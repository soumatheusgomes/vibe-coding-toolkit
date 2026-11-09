import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean))];
const manifest = JSON.parse(await readFile(path.join(root, "templates/project-docs/manifest.json"), "utf8"));
const destinations = new Map(Object.entries(manifest).map(([destination, source]) => [path.posix.normalize(`templates/project-docs/${source}`), destination]));
const anchors = new Map();
const repositoryPrefix = /^https:\/\/(?:raw\.githubusercontent\.com\/soumatheusgomes\/vibe-coding-toolkit\/(?:main|[0-9a-f]{40})\/|github\.com\/soumatheusgomes\/vibe-coding-toolkit\/(?:blob|tree)\/(?:main|[0-9a-f]{40})\/)/;

function getAnchors(text) {
  text = text.replace(/^```[^\n]*\n[\s\S]*?^```/gm, "");
  const ids = new Set([...text.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]));
  const duplicates = new Map();
  for (const match of text.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const base = match[1].toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\p{L}\p{N}_\-\s]/gu, "").replace(/\s/g, "-");
    const count = duplicates.get(base) ?? 0;
    duplicates.set(base, count + 1);
    ids.add(count ? `${base}-${count}` : base);
  }
  return ids;
}

let links = 0;
for (const file of files) {
  if (/\.json(?:\.example)?$/.test(file)) JSON.parse(await readFile(path.join(root, file), "utf8"));
  if (!/\.md(?:\.template)?$/.test(file)) continue;
  const content = await readFile(path.join(root, file), "utf8");
  const text = content.replace(/^```[^\n]*\n[\s\S]*?^```/gm, "").replace(/`[^`\n]+`/g, "");
  const targets = [...text.matchAll(/\]\(([^)]+)\)|\b(?:href|src)=["']([^"']+)["']/g)].map(match => match[1] ?? match[2]);
  for (const match of text.matchAll(/\bsrcset=["']([^"']+)["']/g)) {
    targets.push(...match[1].split(",").map(candidate => candidate.trim().split(/\s+/)[0]));
  }
  // Public shortcuts target this checkout, including URLs inside copyable prompts.
  for (const match of content.matchAll(/https:\/\/[^\s<>"'`)\]}]+/g)) {
    if (repositoryPrefix.test(match[0])) targets.push(match[0]);
  }
  for (let target of new Set(targets)) {
    const repository = repositoryPrefix.test(target);
    if (repository) target = target.replace(repositoryPrefix, "");
    if (/^(?:[a-z]+:|\/\/)/i.test(target)) continue;
    target = target.replace(/^<|>$/g, "");
    const [relative, anchor] = target.split("#");
    let resolved;
    if (destinations.has(file) && !repository) {
      const destination = path.posix.normalize(path.posix.join(path.posix.dirname(destinations.get(file)), relative || path.posix.basename(destinations.get(file))));
      assert(Object.hasOwn(manifest, destination), `${file}: unknown generated-document link ${target}`);
      resolved = path.resolve(root, "templates/project-docs", manifest[destination]);
    } else {
      resolved = relative ? path.resolve(root, repository ? "." : path.dirname(file), decodeURIComponent(relative)) : path.join(root, file);
    }
    assert((await stat(resolved).catch(() => null)), `${file}: missing link ${target}`);
    if (anchor && /\.md(?:\.template)?$/.test(resolved)) {
      if (!anchors.has(resolved)) anchors.set(resolved, getAnchors(await readFile(resolved, "utf8")));
      assert(anchors.get(resolved).has(decodeURIComponent(anchor)), `${file}: missing anchor ${target}`);
    }
    links++;
  }
}
console.log(`PASS documentation: ${links} local links/anchors, document destinations and JSON configurations`);
