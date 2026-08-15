# [PROJECT NAME]

> Project memory for Claude Code. Keep this file short and high-signal.
> Also using other AI tools in this repo? Consider a shared `AGENTS.md` as the cross-tool source of truth, imported here with a single `@AGENTS.md` line instead of duplicating content — optional, doesn't change the structure below.

## Behavioral guidelines

1. **Think before coding** — state assumptions explicitly. If multiple interpretations exist, present them instead of picking silently. Say so when a simpler approach exists. If something is genuinely unclear, stop and ask.
2. **Simplicity first** — minimum code that solves the problem. No speculative features, no abstractions for single-use code, no unrequested configurability, no error handling for impossible scenarios.
3. **Surgical changes** — touch only what the request requires. Match existing style. Don't refactor, reformat, or "improve" adjacent code that wasn't part of the request.
4. **Goal-driven execution** — turn tasks into verifiable goals (e.g. "fix the bug" becomes "write a test that reproduces it, then make it pass"). For multi-step work, state a brief plan with a verify check per step, then loop until every step is verified.
5. **Orchestrator, not implementer** — the main session plans, decides, and coordinates; it does not implement. Delegable implementation and analysis goes to a specialist subagent, dispatched in parallel when task scopes don't conflict.

## Stack

[PLACEHOLDER: languages, frameworks, and package manager — e.g. "TypeScript · Next.js + React · npm"]

## Canonical commands

Always use the exact commands here — don't guess.

- **Install:** `[PLACEHOLDER]`
- **Lint:** `[PLACEHOLDER]`
- **Typecheck:** `[PLACEHOLDER]`
- **Test:** `[PLACEHOLDER]`
- **Build:** `[PLACEHOLDER]`
- **Run/Dev:** `[PLACEHOLDER]`

## Specialist agent routing table

When work is delegable, dispatch the specialist that matches the task instead of a generic agent. Below is a starter set — enough to show the pattern without bloating a file that loads into every session. The full ~20-role reference roster (database, devops, product, security-auditor, performance, and more) lives in [`docs/tools/02-subagent-orchestration.md`](https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/main/docs/tools/02-subagent-orchestration.md) of the vibe-coding-toolkit repo this template came from — copy in only the rows your project actually needs.

| Agent | When to use |
|---|---|
| `orchestrator` | Coordinates multi-agent or cross-domain tasks by delegating to specialized agents. Use when a task spans multiple domains or needs parallel subagent execution. |
| `code-reviewer` | Reviews code changes for bugs, security, error handling, and test coverage. Use after editing any source file. |
| `security-reviewer` | Reviews code for OWASP Top 10 vulnerabilities, hardcoded secrets, broken auth, and dependency CVEs. Use before any merge that touches auth, input handling, or secrets. |
| `test-engineer` | Writes unit and integration tests with TDD discipline and edge-case coverage. Use after implementing new logic. |
| `backend-specialist` | Implements API endpoints, server-side logic, and persistence. Use when building or modifying backend services. |
| `frontend-specialist` | Designs and implements UI components, layouts, and frontend performance. Use when building or refactoring UI. |

## Conventions

[PLACEHOLDER: import style, testing conventions, formatting/linting rules, error-handling patterns, etc.]

## Learn more

This template ships without opinions on stack or conventions — those are yours to fill in. For the reasoning behind each section above, see the `docs/` folder in the vibe-coding-toolkit repository this template came from.
