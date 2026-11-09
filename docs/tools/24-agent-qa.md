# agent-qa

[agent-qa](https://github.com/vostride/agent-qa) runs natural-language regression tests for web, Android, and iOS applications. Its advanced memidex memory engine retains reviewable facts and procedures; self-improvement validates lessons from runs and retires stale guidance. Use it when a coding agent needs repeatable application checks after a change.

## Requirements and installation

Select this capability for a project that needs application QA. It requires Node.js 24+, a configured model connection, and the browser or mobile runtime for the target platform. Reuse the project's package manager and choose the model connection explicitly. The [official quickstart](https://vostride.com/docs/agent-qa/quickstart) covers platform setup and authentication.

For an npm project:

```bash
npm install -D agent-qa
npx agent-qa --help
npx agent-qa init
```

Keep the selected package version in the project lockfile. Review generated configuration and test files, and complete the model and target setup before running tests. License: [FSL-1.1-ALv2](https://github.com/vostride/agent-qa/blob/main/LICENSE.md). Configured model, browser, or device providers may charge separately.

## Use and verification

Start with one relevant user journey and explicit expected outcomes. For example, ask the coding agent to create a login regression test for the local application, inspect failures, and rerun the same test after a fix. Once `tests/login.yaml` exists and its model and target are configured:

```bash
npx agent-qa run tests/login.yaml
```

Read the installed version's `run --help` and the [CLI reference](https://vostride.com/docs/agent-qa/cli) for available options. Inspect the verdict and recorded evidence, including failed steps. A successful installation or help command establishes CLI availability; integration validation requires an actual run against the intended application. Record the tested version, target, result, and any missing platform or model prerequisites.

## Coding-agent skills

Select the existing official skill for the task and verify discovery in the chosen client:

| Skill | Task |
|---|---|
| [agent-qa-authoring](https://github.com/vostride/agent-qa/blob/main/skills/agent-qa-authoring/SKILL.md) | Author tests and supporting assets |
| [agent-qa-debug-fix](https://github.com/vostride/agent-qa/blob/main/skills/agent-qa-debug-fix/SKILL.md) | Diagnose and repair a failing test workflow |
| [agent-qa-result-triage](https://github.com/vostride/agent-qa/blob/main/skills/agent-qa-result-triage/SKILL.md) | Interpret results and supporting evidence |
| [agent-qa-knowledge](https://github.com/vostride/agent-qa/blob/main/skills/agent-qa-knowledge/SKILL.md) | Review retained facts, procedures, and corrections |

## Maintenance

Update through the project's package manager, review upstream release and skill changes, and rerun a representative application test. Keep useful lessons reviewable alongside the test workflow. Record CLI checks, skill discovery, and successful application runs separately in the project setup report.
