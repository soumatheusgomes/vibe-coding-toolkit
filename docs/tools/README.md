# Tools

Choose a tool for the current need. For a new foundation, follow the [bootstrap](../04-project-bootstrap.md); to configure or update an existing project, use the [complete setup](../prompts/12-existing-project-setup.md); to prepare the machine, use [global setup](../03-environment-setup.md).

| Document | Purpose |
|---|---|
| [01 — Superpowers](01-superpowers.md) | Design, planning, execution, and review |
| [02 — Subagents](02-subagent-orchestration.md) | Delegation and independent waves |
| [03 — RTK](03-rtk-token-proxy.md) | Commands with concise output |
| [04 — Ponytail](04-ponytail.md) | Smallest complete solution |
| [05 — Caveman](05-caveman.md) | Concise communication |
| [06 — ESLint/Biome](06-eslint-biome-quality-gates.md) | Lint and rule evolution |
| [07 — Graphify](07-graphify.md) | Project graph |
| [08 — Obsidian](08-obsidian-memory.md) | Optional external memory |
| [09 — Claude memory](09-claude-memory-system.md) | Persistent context |
| [10 — Hooks](10-hooks-best-practices.md) | Optional client reference |
| [11 — agent-browser](11-agent-browser.md) | Browser automation |
| [12 — Context7](12-context7.md) | Current documentation |
| [13 — Anthropic Skills](13-anthropics-skills.md) | Artifacts and skill creation |
| [14 — Chrome DevTools MCP](14-chrome-devtools-mcp.md) | Console, network, and performance |
| [15 — Codex](15-codex-workflow.md) | Instructions, plugins, MCPs, and discovery |
| [16 — Vercel skills](16-vercel-skills.md) | Catalog, local installation, and workflow |
| [17 — Next.js runtime and performance](17-nextjs-runtime-and-performance.md) | Development feedback and bundle analysis |
| [18 — PostgreSQL](18-postgresql-skills.md) | SQL, indexes, migrations, pooling, and security |
| [19 — GitHub CI repair](19-github-ci-repair.md) | Diagnose failing GitHub Actions checks |
| [20 — Security review](20-security-review.md) | Repository or diff review, trust boundaries, and private evidence-based reports |
| [21 — shadcn/ui](21-shadcn-ui.md) | Work with an adopted component system |
| [22 — Sentry MCP](22-sentry-mcp.md) | Investigate errors and performance in a chosen service |
| [23 — Harness2](23-harness2.md) | Default native harness improvement workflow; optional isolated official CLI lab |
| [24 — agent-qa](24-agent-qa.md) | Self-improving web/mobile regression testing with memidex memory |

## Select by scope

| Capability | Machine preparation | Individual project selection |
|---|---|---|
| `next-dev-loop` | Compatible agent-browser and browser runtime | Compatible Next.js/Turbopack development server |
| `next-bundle-optimizer` | Existing agent and package runner | Next.js analyzer support; audit or requested optimization |
| `supabase-postgres-best-practices` | Existing agent; database tools only when needed | PostgreSQL with any provider/ORM |
| `gh-fix-ci` | GitHub CLI and authorized account | GitHub Actions PR checks; compatible Codex workflow |
| `differential-review` | Compatible agent and Git/history access | Security-sensitive changes and explicit review range |
| `shadcn` | Existing package runner | Adopted or explicitly selected shadcn/ui |
| Sentry MCP | OAuth-capable client and authorized account | Chosen Sentry organization/project |
| Harness2 | Existing agent for the default native adaptation; Git, uv, and compatible Python for a selected isolated CLI lab | Default measured harness workflow in new and existing project setup; official benchmarks require separate dependency, authentication, cost, and isolation decisions |
| agent-qa | Node.js 24+ and the selected browser/mobile runtime | Application regression tests with an explicitly configured model and target; project-local CLI and task-specific skills |

Evaluate every row during setup. Install applicable instructions in project scope; reuse machine prerequisites. Record unavailable prerequisites and not-applicable choices with reasons. For each adopted capability, record source/revision, client, scope, installation, discovery, actual execution, update method, and pending work. An installed skill, a configured server, and a successful live workflow are different evidence.

Harness2 is not a skill or MCP server. Use [prompt 15](../prompts/15-harness-improvement.md) by default during new and existing project setup: establish the native adaptation, run relevant initial smoke cases, and make the procedure reusable. This preserves current session authentication without installing the optional official CLI; a successful CLI demo does not prove benchmark or project integration.
