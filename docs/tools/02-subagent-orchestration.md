# Subagent Orchestration

## What it is

Not a plugin, not something you install — a **pattern** you build into your
own project instructions (a `CLAUDE.md`, or equivalent). Instead of one
generalist agent that implements everything and reviews everything, you
define a roster of narrowly-scoped **specialist** agents, each with a crisp
one-line "when to use" description, and route every task to the specialist
that matches it.

## Why use it

A generalist agent re-derives the right checklist for a domain every time it
touches it — what to check in a database migration, which vulnerability
classes matter in an auth change, which hook rules a React component can
violate. A specialist agent already knows the checklist for its domain,
because that's all it does. The payoff isn't more agents for their own
sake — it's that every dispatch gets a reviewer or implementer that starts
from the right checklist instead of reinventing one under time pressure.

## Part A — specialist roster and routing

Give each specialist a name and a one-line "when to use." That line does
double duty as the routing rule — there's no separate task-type-to-specialist
table to keep in sync with this one, because they'd just be the same mapping
read in two directions. A representative roster looks like this:

| Specialist | When to use |
|---|---|
| `orchestrator` | Coordinates multi-domain work by delegating to other specialists — reach for this first when a task spans layers. |
| `code-reviewer` | General review of any code change — bugs, error handling, test coverage. |
| `security-reviewer` | OWASP-class vulnerabilities, hardcoded secrets, broken auth, dependency CVEs. |
| `typescript-reviewer` | Type safety, async correctness, injection risk, prototype pollution in TS/JS. |
| `react-reviewer` | Hooks rules, server/client component boundaries, accessibility, render performance. |
| `react-build-resolver` | A failing build or dev server — bundler config, compile errors, missing types. |
| `test-engineer` | Unit and integration tests, written test-first, with edge-case coverage. |
| `qa-automation-engineer` | End-to-end tests and CI/CD quality gates for a critical user flow. |
| `database-architect` | Schema design, migrations, indexes, query strategy. |
| `devops-engineer` | Deployment, CI/CD pipelines, infrastructure, production operations. |
| `backend-specialist` | API endpoints, server-side business logic, persistence. |
| `frontend-specialist` | UI components, layout, styling, frontend architecture. |
| `seo-specialist` | Metadata, structured data, crawlability, AI-search visibility. |
| `performance-optimizer` | A profiled bottleneck — slow endpoint, high memory, poor Core Web Vitals. |
| `product-manager` | Undefined or ambiguous requirements, before a story exists. |
| `product-owner` | Turning a business objective into acceptance criteria for a story. |
| `project-planner` | Breaking a feature or epic into ordered, executable tasks. |
| `code-archaeologist` | Understanding undocumented or legacy code before changing it. |
| `debugger` | Root-causing a bug, crash, or flaky test — before any fix is proposed. |
| `explorer-agent` | Mapping an unfamiliar or complex codebase before planning a change. |
| `documentation-writer` | READMEs, API docs, runbooks — written or refreshed on request. |
| `penetration-tester` | Simulated attacker techniques against a real auth flow or release. |
| `security-auditor` | Defense-in-depth review and threat modeling before a major release. |

The names are illustrative — call them what makes sense in your project.
What matters is the shape: narrow scope, one clear trigger condition, no
overlap with its neighbors.

## Part B — model dispatch discipline

State this as a rule of thumb, not a hard law: **explicitly set which model
tier a subagent dispatch runs on, every time — never let it silently inherit
the parent session's model.** An inherited-by-default dispatch tends to run
everything at the parent's tier, which is usually far more model than a
mechanical task needs, and occasionally far less than a genuinely hard one
does.

Cheapest tier that still fits the task:

- **Fast/cheap tier** (e.g. a Haiku-class model) — mechanical work: a
  single-file edit with a fully specified change, or pure search/grep-style
  exploration.
- **Mid tier** (e.g. a Sonnet-class model) — the default for most
  implementation, integration, debugging, and review work.
- **Top-reasoning tier** (e.g. an Opus-class model) — reserved for genuine
  architectural judgment calls, not for volume.

## Part C — parallel wave execution

This is the part worth taking slowly, because getting it wrong is exactly
how you get the bug this pattern exists to avoid.

### The problem

The safe default for executing a plan is **serial**: one implementer, one
task, one commit, then the next. It's correct, and it's slow for work that's
genuinely independent — three unrelated bug fixes in three unrelated files
don't need to wait on each other. The naive fix — dispatch every task's
implementer at once — is fast and risky: two agents can edit the same file
concurrently and clobber each other, or race each other to `git commit`.

### The fix

Three parts close both holes without giving up the speed:

1. **Tag every planned task** with the exact file paths/globs it touches and
   which other tasks' output it depends on. A task with a missing tag, or
   any real uncertainty about its scope, is conservatively treated as
   depending on *everything*. This is the fail-safe: an under-specified task
   doesn't risk a false-parallel bug — it just degrades to normal serial
   execution.

2. **Two tasks share a wave only if** neither depends — even transitively —
   on the other, *and* their file sets are fully disjoint. Both conditions,
   every pair, or the tasks go to separate waves.

3. **Implementers inside a wave never self-commit.** They edit files and
   report back which files changed; the orchestrator does all the
   committing afterward, one commit per task, in wave order, capturing the
   current `HEAD` fresh immediately before each commit — never a stale or
   hardcoded ref. This is what removes the race-to-commit risk entirely:
   there's only ever one committer, and it commits serially even though the
   editing happened in parallel.

### Execution loop, per wave

1. Write one task brief per task in the wave.
2. Dispatch every implementer for that wave **in a single batch** — this is
   the only point where real concurrency happens.
3. Wait for all of them to finish.
4. Commit each task's changes in order, `HEAD` captured fresh immediately
   before each one.
5. Dispatch that wave's reviewers together, each over its own task's commit
   range — safe to parallelize, because review is read-only.
6. Make exactly **one** orchestrator-owned log or ledger write for the whole
   wave, not one per task — two agents racing to append to the same
   tracking file is the same class of bug as two agents racing to commit.

### Escape hatch: worktree isolation

Sometimes two tasks genuinely can't avoid touching the same file, and
splitting them further would defeat the point of parallelizing at all. For
that case — and only that case — isolate each implementer in its own git
worktree and branch, so self-committing becomes safe again because there's
no shared index left to race on. Call this out for what it is: expensive
(real disk and setup cost per agent), and a last resort rather than a
default.

### What this does and doesn't change

This pattern changes **orchestration only**. The implementer/reviewer
contract underneath — ask first if the task is ambiguous, TDD, self-review
before reporting, one of a small set of explicit status codes — is exactly
the same skill discipline described in [01-superpowers.md](01-superpowers.md),
specifically `subagent-driven-development`. Waves don't relax that
contract; they just let you run several instances of it at once, when it's
provably safe to.

See [`templates/rules/parallel-subagent-driven-development.md`](../../templates/rules/parallel-subagent-driven-development.md)
for a literal rule-doc version of this same logic, written to be dropped
into a project's own instructions.
