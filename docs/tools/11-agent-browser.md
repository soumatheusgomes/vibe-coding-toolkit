# agent-browser

A native CLI — not a Playwright or Puppeteer wrapper — that drives a real
Chrome/Chromium browser over the DevTools protocol, built specifically for
AI agents rather than adapted from a human-testing tool. Instead of CSS
selectors or screenshot-only interaction, it works from accessibility-tree
snapshots with compact element references, which holds up much better
across page re-renders and layout changes than a selector that assumes the
DOM looks the way it did when the script was written.

## Why use it

A CSS selector breaks the moment a page's markup shifts. A screenshot-only
approach forces the agent to reason over pixels. An accessibility-tree
snapshot with short, stable references (`@e1`, `@e2`, ...) gives the agent
something it can act on directly and re-request cheaply after the page
changes — closer to how a screen reader sees the page than how a scraper
does.

## Install

```bash
npm i -g agent-browser
agent-browser install
```

## Core workflow

```bash
agent-browser open example.com
agent-browser snapshot            # accessibility tree, with refs
agent-browser click @e2           # act on a ref from the snapshot
agent-browser fill @e3 "test@example.com"
agent-browser screenshot page.png
```

Take a new snapshot after any action that meaningfully changes the page —
refs are only valid against the snapshot they came from.

## The discovery-stub pattern

The skill file a coding agent loads for this tool is deliberately tiny.
Instead of duplicating a full usage guide in Markdown — which drifts out of
sync the moment the CLI ships a new release — it tells the agent to pull the
real, current instructions live from the CLI itself:

```bash
agent-browser skills get core          # workflows, patterns, troubleshooting
agent-browser skills get core --full   # full command reference and templates
agent-browser skills list              # every skill available for this install
```

The stub never goes stale because it doesn't contain anything that could —
the actual content always matches whatever version is installed. It's a
pattern worth copying in your own tooling: keep the always-loaded file tiny,
fetch the real instructions live.

## Beyond plain web pages

Extended capabilities load the same way — on demand, as their own skill,
rather than bundled into the core docs upfront:

| Skill | Covers |
|---|---|
| `electron` | Electron desktop apps — code editors, chat apps, design tools |
| `slack` | Workspace chat-app automation |
| `dogfood` | Exploratory/dogfooding QA passes over a web app |
| `derive-client` | Deriving a standalone API client from a captured network trace (HAR) |
| `vercel-sandbox` | Running inside disposable cloud sandbox VMs |
| `agentcore` | Cloud-hosted browser sessions |

Pull any of them the same way: `agent-browser skills get <name>`.
