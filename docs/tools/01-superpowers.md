# Superpowers

## What it is

`superpowers` is a Claude Code plugin that bundles a library of **process
skills** — reusable, named workflows for the stages of building software:
exploring intent, planning, implementing, debugging, reviewing, finishing a
branch. That's distinct from an *implementation* skill, which teaches a
specific technology or API. Process skills sit **above** implementation
skills: they decide when and how you approach a task, before any
domain-specific skill decides what to write.

## Why use it

Left to improvise, an agent's process is whatever feels natural in the
moment — usually jumping straight to code, skipping the question that should
have been asked first, and skipping the verification that should have run
before calling the task done. Superpowers turns each stage of a real
development process into a named, invokable skill with its own explicit
checklist, so the process is consistent across sessions instead of
reinvented — or silently skipped — every time.

## Install

Source: [`anthropics/claude-plugins-official`](https://github.com/anthropics/claude-plugins-official).
Inside a Claude Code session:

```text
/plugin marketplace add anthropics/claude-plugins-official
/plugin install superpowers@claude-plugins-official
```

## The core rule

> If a skill might apply, even a little, invoke it **before responding at
> all** — including before asking a clarifying question.

This is the part that's easy to miss, because it inverts the usual instinct.
The natural order feels like: understand the task, ask a clarifying question
if needed, *then* reach for tooling. Superpowers runs the relevant process
skill first — usually `brainstorming` for anything creative — and the
clarifying questions happen *inside* it. Answering, or even just asking,
before invoking the skill is the failure mode this rule exists to prevent.

## The skill set

| Skill | What it does / when it runs |
|---|---|
| `brainstorming` | Socratic exploration of intent, requirements, and design for anything creative — a new feature, a new component, new behavior. Runs before planning starts, never after. |
| `writing-plans` | Turns a spec or requirement into a concrete, step-by-step implementation plan. Used before touching code on any multi-step piece of work. |
| `subagent-driven-development` | Executes an implementation plan by dispatching one specialist implementer at a time, per task, under a strict contract: ask questions first if the task is ambiguous, TDD, self-review before reporting, and report back one of a small set of explicit status codes. Serial by default — the default that [subagent orchestration](02-subagent-orchestration.md) later overrides for genuinely independent work. |
| `dispatching-parallel-agents` | For two or more independent tasks with no shared state and no sequencing needs, fan them out together instead of working through them serially. |
| `systematic-debugging` | Evidence-based root-cause investigation. Runs before proposing a fix for any bug, test failure, or unexpected behavior — never patch first and investigate after. |
| `test-driven-development` | Write the test first (red), the minimal implementation to pass it (green), then refactor (improve). Used for any feature or bugfix. |

A further set of skills covers the later stages of the same lifecycle:
`executing-plans` runs a written plan in a fresh session with review
checkpoints; `finishing-a-development-branch` decides how finished work gets
integrated; `requesting-code-review` and `receiving-code-review` give and
take review feedback with technical rigor instead of reflexive agreement;
`using-git-worktrees` isolates parallel work in git worktrees;
`verification-before-completion` proves a task is actually done by running
it, not just inspecting it; and `writing-skills` writes new skills in the
same format as all of the above.

## Gotcha

The ordering is the discipline — no single skill in the list matters on its
own. It's tempting to treat `test-driven-development` as the "real" one and
jump straight to red-green-refactor on a feature nobody has scoped yet. The
rule that actually makes this work is sequential: **process skills —
brainstorm, then plan, then debug-first the moment something breaks —
always come before implementation and domain-specific skills.** Every skill
above only does its job if it runs at its stage of the pipeline, not
whichever stage feels closest to the code.
