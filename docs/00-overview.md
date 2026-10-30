# Overview

**Set up your machine. Bootstrap or upgrade your projects.** The toolkit prepares development environments and individual codebases. New projects, existing projects, and partial adoption reuse the same templates and working agreements.

<a id="four-paths"></a>

## Four paths

- **Machine:** [global setup](03-environment-setup.md), including installation, client integration, backups, and a manifest.
- **New project:** [Next.js bootstrap](04-project-bootstrap.md), including `PRODUCT.md`, the official scaffold, local skills, lint, and evidence.
- **Existing project:** [complete setup](prompts/12-existing-project-setup.md), including diagnosis, brainstorming, a harness, adoption/updates of applicable components, and before/after validation.
- **Partial adoption:** [installation](01-installation.md), [tools](tools/), and [prompts](prompts/), choosing only what you need.

The agent needs environment access to execute and validate. Claude Code and Codex use their own configurations; other LLMs can meet the requirements with equivalent capabilities, without assuming format compatibility.

## Product before foundation

The description defines the problem, audience, essential flows, and constraints. `PRODUCT.md` records the MVP, assumptions, and acceptance criteria. The stack serves that scope: Next.js/App Router, TypeScript, Tailwind, ESLint, Drizzle/PostgreSQL, Zod, Pino, and Vitest form the core. Authentication and services depend on the product; an application without persistence may omit the database with a documented reason. See [defaults and adaptation criteria](06-project-defaults.md).

The scaffold comes from the stable version of `create-next-app`, checked during setup. The toolkit maintains the recipe and additions, avoiding a sample application with its own domain, credentials, or dependencies.

<a id="2-brainstorm--plan--implementation--review"></a>
<a id="4-two-composable-personality-layers"></a>
<a id="why-this-matters"></a>

## Proportional process

[Superpowers](tools/01-superpowers.md) provides design, planning, execution, and verification skills. Use the path that matches the request's size. If the user authorizes direct execution, respect that instruction; do not repeat approvals already granted.

[Ponytail](tools/04-ponytail.md) keeps the solution small and complete: reuse, explicit scope, and relevant checks. Security, validation, accessibility, and requested requirements remain intact. [Caveman](tools/05-caveman.md) reduces conversational noise while preserving language and clarity; documents and code use normal wording.

<a id="1-orchestration-not-solo-implementation"></a>

## Delegate when it helps

The main agent can implement small changes. Subagents help with broad investigation, independent tasks, and specialist review. Use only tools and roles that are actually available.

Parallel waves require file ownership and no dependencies between tasks in the same wave. The [orchestration guide](tools/02-subagent-orchestration.md) details this protocol. Preserve the main model and authentication; dynamic selection of lightweight subagents requires an authorized policy, sufficient capability, and client support. The existing-project prompt authorizes this selection within the current session, subject to explicit restrictions.

## Harness and continuous review

The [existing-project setup](prompts/12-existing-project-setup.md) organizes short instructions, discoverable documentation, reproducible commands, verifiable invariants, and evidence for resuming work. Each catalog component receives an explicit decision; working equivalents are preserved.

After implementation or a fix, the [review convention](tools/02-subagent-orchestration.md#review-after-implementation-or-fixes) selects scope by risk, checks connected code, and ends with verified fixes and explicit residual risks. Additional rounds need evidence or an explicit request. The [security prompt](prompts/13-security-review.md) supports read-only repository and diff reviews with private reports.

[Harness evaluation](07-harness-evaluation.md) uses disposable tasks to check instructions, recovery, memory, and review behavior. Installation, passing application checks, and successful agent execution are separate evidence.

[Harness2 adoption](tools/23-harness2.md) makes measured harness improvement a default part of new and existing project setup through [prompt 15](prompts/15-harness-improvement.md). Establish the native method adaptation, run relevant initial smoke cases, and make the procedure reusable while preserving the current client and authentication. Only observed failures need a candidate comparison. The optional official CLI belongs in a separate lab; its benchmark dependencies, model access, costs, and execution permissions are not enabled by ordinary setup.

## Optional advanced security audit

The [security audit guide](08-security-audit.md) explains [prompt 16](prompts/16-security-audit.md): a broader audit with four private artifacts, dependency/runtime recommendations, remediation batches, and a checkpoint for another session. Run it only on explicit request, separately from machine preparation, onboarding, bootstrap, and existing-project setup. Auditing does not authorize fixes or active testing of deployed services.

<a id="6-a-code-knowledge-graph"></a>
<a id="7-a-two-layer-memory-system"></a>

## Knowledge and context

[Context7](tools/12-context7.md) queries current library documentation. Resolve the correct identifier and query one concept at a time, without sending secrets or private code.

[Graphify](tools/07-graphify.md) provides a queryable graph of structure and relationships. Code extraction can be deterministic; document semantics use the authorized native integration when available. Treat an incomplete or outdated graph accordingly.

External memory, such as [Obsidian](tools/08-obsidian-memory.md), and the [Claude memory system](tools/09-claude-memory-system.md) remain optional. Start with short, useful context; do not install an entire memory system for an empty application.

## Vercel skills

The [Vercel catalog](tools/16-vercel-skills.md) identifies skills by installable names and defines local adoption. Composition and React/Next.js best practices support implementation; UI and writing support review. The [scope matrix](tools/README.md#select-by-scope) also routes Next.js runtime/bundle work, PostgreSQL, GitHub CI repair, differential security review, shadcn, and Sentry MCP.

Transitions, Vercel operations, deployment, and optimization require a relevant task. The mobile skill applies to React Native/Expo. Skill availability neither requires creating functionality nor authorizes publishing.

<a id="3-a-token-saving-layer"></a>
<a id="5-quality-gates-as-a-tracked-migration"></a>

## Explicit checks

[ESLint and quality gates](tools/06-eslint-biome-quality-gates.md) check relevant code and contracts. The starter uses the full ESLint profile: official presets, a 350-line limit, logging, data boundaries, and Drizzle guards. The lightweight profile remains available for partial adoption.

Lint, types, rules, and builds run through canonical commands. Tests cover relevant behavior and regressions. The toolkit does not install push blockers on `main`, require a branch/worktree, or add commit/push hooks. Client hooks, such as [RTK](tools/03-rtk-token-proxy.md), use supported integrations without duplication.

## Global tools do not need copying

Reuse existing binaries, plugins, and authentication. Product, instructions, Vercel skills, lint, and graph exclusions belong in the project. Add a local MCP connection only when no active integration exists.

The [global manifest](../templates/environment-manifest.json.example) records the machine environment. The project's `docs/setup.md` records the toolkit revision, versions, scopes, validations, and pending work. An installed file and a tested integration are different states.

<a id="official-further-reading"></a>

## Next step

Use the [short project prompt](prompts/11-next-project-bootstrap.md) to start Next.js, the [existing-project setup](prompts/12-existing-project-setup.md) to adopt/update the toolkit, or the [environment prompt](prompts/10-development-environment-setup.md) to prepare the machine. The [Claude playbook](02-playbook-onboarding.md) and [Codex guide](tools/15-codex-workflow.md) explain each client.
