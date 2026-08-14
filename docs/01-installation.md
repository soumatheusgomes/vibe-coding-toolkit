# Installation

Six steps: install Claude Code, add the plugins, wire up hooks, add the two
standalone CLIs, optionally set up long-term memory, then drop the project
template in place. Steps 4 and 5 are optional — skip them if you don't need
codebase-graph orientation or cross-session memory yet.

## 1. Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Verify it's on your `PATH`:

```bash
claude --version
```

Full setup and auth details: [Claude Code docs](https://docs.claude.com/en/docs/claude-code).

## 2. Add marketplaces and install the plugins

Run these inside a `claude` session. Each plugin has its own doc under
[`docs/tools/`](./tools/) — read the relevant one before relying on it.

```bash
# Superpowers — brainstorm → plan → implement → review skills
/plugin marketplace add anthropics/claude-plugins-official
/plugin install superpowers@claude-plugins-official

# Ponytail — lazy-engineer / YAGNI persona
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail

# Caveman — terse, fact-dense communication persona
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman

# aia-harness — Claude Code harness scaffolding
/plugin marketplace add leandrosilvaferreira/claude-plugins-registry
/plugin install aia-harness@leandro-plugins-registry

# ui-ux-pro-max — component/UX design skill
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

The `anthropics/claude-plugins-official` marketplace (added above) also
carries several standalone plugins worth installing the same way:

```bash
/plugin install hookify@claude-plugins-official
/plugin install pr-review-toolkit@claude-plugins-official
/plugin install commit-commands@claude-plugins-official
/plugin install claude-code-setup@claude-plugins-official
/plugin install feature-dev@claude-plugins-official
/plugin install code-review@claude-plugins-official
/plugin install claude-md-management@claude-plugins-official
```

See [Superpowers](tools/01-superpowers.md), [Ponytail](tools/04-ponytail.md),
and [Caveman](tools/05-caveman.md) for what each persona layer actually
changes about agent behavior.

## 3. Wire up hooks and the token proxy

Copy the example settings into your project:

```bash
mkdir -p .claude
cp templates/settings.json.example .claude/settings.json
```

Edit `.claude/settings.json` for your project's own hooks and permissions.
Two docs matter here:

- [Hooks best practices](tools/10-hooks-best-practices.md) — how to write a
  hook that fails safe instead of crashing the session.
- [Token proxy pattern](tools/03-rtk-token-proxy.md) — the command-rewriting
  pattern that keeps long sessions cheap; `templates/hooks/hook-io.mjs.example`
  is the I/O helper it depends on.

## 4. Optional: Graphify and agent-browser

Both are standalone CLIs, not Claude Code plugins — install them with your
usual package manager.

```bash
# Graphify — persistent code knowledge graph
pip install graphifyy
# or
uv tool install graphifyy
```

```bash
# agent-browser — browser automation for agents
npm i -g agent-browser
agent-browser install
```

Docs: [Graphify](tools/07-graphify.md), [agent-browser](tools/11-agent-browser.md).

## 5. Optional: long-term memory with Obsidian

Set up an Obsidian vault and connect it through an MCP server so an agent
can search and write structured notes that outlive any single session. This
repo describes the pattern; pick an open-source Obsidian MCP server from the
MCP registry to implement it.

See [Obsidian as memory](tools/08-obsidian-memory.md).

## 6. Add the project template

Copy the template into your project root and fill in the placeholders:

```bash
cp templates/CLAUDE.md.template CLAUDE.md
```

Open `CLAUDE.md` and replace every placeholder with your project's actual
stack, commands, and conventions — this file is what turns the tools above
into a workflow tuned to your codebase instead of a generic default. If you
adopted step 3's parallel-wave dispatch pattern, also copy
`templates/rules/parallel-subagent-driven-development.md` into your own
rules directory and link it from `CLAUDE.md`.
