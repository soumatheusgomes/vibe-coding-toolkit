# Graphify

Graphify turns a folder of code, docs, papers, images, or video into a
persistent knowledge graph — community detection to cluster related files
and concepts, an audit trail distinguishing directly-extracted facts from
inferred or ambiguous ones, and three output artifacts: an interactive HTML
graph, a GraphRAG-ready JSON graph, and a plain-language written report.

It's a standalone Python CLI, not a Claude Code plugin — it works the same
way regardless of which coding agent is driving it.

## Why use it

Re-deriving a codebase's structure from scratch with grep, every session, is
slow and burns tokens on exploration that doesn't need to happen twice. A
persistent graph answers "what calls this," "which modules are central," and
"what breaks if I change this" in one query instead of dozens of exploratory
reads — and stays current with an incremental update instead of a full
rebuild.

## Install

```bash
pip install graphifyy
# or
uv tool install graphifyy
```

The PyPI package is `graphifyy` (double "y"); the CLI command it installs is
`graphify`.

## API keys

None, for a pure-code corpus — extraction there is AST-based and fully
local. An LLM is only invoked for semantic extraction of non-code material
(docs, papers, images), and it can use the calling coding agent itself for
that instead of requiring a separate API key.

## Core commands

```bash
# Full pipeline run on a path — extraction, clustering, report, graph
graphify extract <path>

# Incremental — only re-extracts changed files
graphify update <path>

# Re-run clustering without re-extracting
graphify cluster-only <path>

# Budget-capped graph traversal that answers a question
graphify query "<question>"

# Shortest relationship path between two named concepts
graphify path "<A>" "<B>"

# Focused, plain-language explanation of one node
graphify explain "<concept>"

# Export to a specific format
graphify export html
graphify export obsidian
graphify export wiki
graphify export svg
graphify export graphml
graphify export neo4j      # or falkordb — pushes directly to either

# Run as an MCP stdio server
graphify --mcp

# Auto-rebuild as files change
graphify watch <path>

# Ingest a URL into the corpus
graphify add <url>
```

## Automating updates with git hooks

Once a graph already exists, `post-commit` and `post-checkout` hooks can
kick off an incremental update automatically, in the background, after
every commit or branch switch — non-blocking, so it never adds latency to
the commit or checkout itself.

Write the hook file with no extension, using only dynamic `import()` (never
a top-level `import`/`export`/`require`) — that's what lets the exact same
file parse whether the target repo resolves as CommonJS or ESM:

```js
#!/usr/bin/env node
// .git/hooks/post-commit and .git/hooks/post-checkout — the same file.
(async () => {
  const { existsSync } = await import("node:fs");
  const { execFile } = await import("node:child_process");

  // Skip while a rebase/merge/cherry-pick is in progress.
  const midOperation = [
    ".git/rebase-merge",
    ".git/rebase-apply",
    ".git/MERGE_HEAD",
    ".git/CHERRY_PICK_HEAD",
  ].some(existsSync);
  if (midOperation) process.exit(0);

  const child = execFile("graphify", ["update", "."], {
    detached: true,
    stdio: "ignore",
  });
  child.unref(); // commit/checkout returns immediately
})();
```

## Orientation hook

A companion pattern, separate from the git hooks above: a PreToolUse hook
that never blocks anything.

- No graph yet, and this is the agent's first touch of the repo this
  session → kick off one detached background build. Use a plain directory
  creation as an atomic lock, so two concurrent tool calls can't race a
  duplicate build.
- Graph already exists → gently remind the agent to query it before a
  broad, raw grep or read — cheaper and more accurate than re-deriving
  structure from scratch.

```js
#!/usr/bin/env node
// PreToolUse hook — advisory only, never blocks.
(async () => {
  const fs = await import("node:fs");
  const { execFile } = await import("node:child_process");

  const GRAPH = "graphify-out/graph.json";
  const LOCK = "graphify-out/.building";

  if (fs.existsSync(GRAPH)) {
    console.error(
      'graphify-out/graph.json exists — try `graphify query "<question>"` ' +
        "before a broad grep/read."
    );
    process.exit(0);
  }

  try {
    fs.mkdirSync(LOCK); // atomic: a second concurrent call fails here
  } catch {
    process.exit(0); // another call already claimed the build
  }

  execFile("graphify", ["extract", "."], { detached: true, stdio: "ignore" }).unref();
  process.exit(0);
})();
```

See [Hooks best practices](10-hooks-best-practices.md) for the general rules
both of these hooks follow — fail open, never block on a slow background
task, and keep the advisory message short.
