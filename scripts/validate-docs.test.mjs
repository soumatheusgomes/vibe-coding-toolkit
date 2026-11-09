import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

async function validate(document, extra = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "toolkit-docs-test-"));
  try {
    execFileSync("git", ["init", "--quiet"], { cwd: root });
    const files = {
      "README.md": document,
      "guide.md": "# Details\n\n## Repeated\n\n## Repeated\n",
      "image.svg": '<svg xmlns="http://www.w3.org/2000/svg"/>',
      "templates/project-docs/manifest.json": "{}",
      ...extra,
    };
    for (const [file, content] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await writeFile(path.join(root, file), content);
    }
    await mkdir(path.join(root, "scripts"));
    await cp(new URL("./validate-docs.mjs", import.meta.url), path.join(root, "scripts/validate-docs.mjs"));
    const result = spawnSync(process.execPath, ["scripts/validate-docs.mjs"], { cwd: root, encoding: "utf8" });
    assert.ifError(result.error);
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const cases = [
  ["accepts valid links, duplicate-heading fragments, and image alternatives",
    '[Details](guide.md#details) [Repeated](guide.md#repeated-1) <source srcset="image.svg 1x, image.svg 2x">', 0],
  ["rejects missing reduced-motion images", '<source srcset="missing.svg">', 1, "missing.svg"],
  ["checks every image candidate", '<source srcset="image.svg 1x, missing.svg 2x">', 1, "missing.svg"],
  ["rejects broken Markdown anchors", "[Guide](guide.md#missing)", 1, "missing anchor"],
  ["checks anchors in repository URLs", "[Guide](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/main/guide.md#missing)", 1, "missing anchor"],
  ["checks raw repository shortcuts inside prompts", "```text\nRead https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/missing.md and execute.\n```", 1, "missing.md"],
  ["accepts valid raw repository shortcuts", "```text\nRead https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/guide.md and execute.\n```", 0],
  ["checks shortcuts pinned to a commit SHA", "```text\nRead https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/790a895304e0c08b70a5b215c9d334f1c86b816c/missing.md and execute.\n```", 1, "missing.md"],
  ["accepts valid pinned shortcuts", "```text\nRead https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/790a895304e0c08b70a5b215c9d334f1c86b816c/guide.md and execute.\n```", 0],
  ["does not treat fenced HTML examples as actual anchors", "[Example](#example)\n```html\n<a id=\"example\"></a>\n```", 1, "missing anchor"],
];

for (const [name, document, status, error] of cases) {
  test(name, async () => {
    const result = await validate(document);
    assert.equal(result.status, status, result.output);
    if (error) assert(result.output.includes(error), result.output);
  });
}

test("checks anchors against generated document destinations", async () => {
  const result = await validate("# Toolkit", {
    "templates/project-docs/manifest.json": JSON.stringify({ "README.md": "README.md.template", "docs/guide.md": "guide.md.template" }),
    "templates/project-docs/README.md.template": "[Guide](docs/guide.md#missing)",
    "templates/project-docs/guide.md.template": "# Details",
  });
  assert.equal(result.status, 1, result.output);
  assert(result.output.includes("missing anchor"), result.output);
});
