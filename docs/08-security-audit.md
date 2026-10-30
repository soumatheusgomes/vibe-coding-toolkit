# Advanced security audit and remediation

Use this workflow when you need a broad security audit with evidence, dependency/runtime maintenance recommendations, and small remediation batches. It adapts to the actual project; it does not require a web application, Node.js, GitHub, or a particular agent.

**This is a separate, opt-in task.** Machine preparation, project onboarding, new-project bootstrap, and existing-project setup do not run it automatically. Its scope and context requirements need a dedicated session or explicit follow-up request. No extra tool installation is required to begin manual review.

## Choose the review you need

| Need | Entry point |
|---|---|
| Repository baseline or an exact diff, with one private report | [Security review — prompt 13](prompts/13-security-review.md) |
| Broader audit, structured findings, update/enforcement recommendations, remediation batches, and a resumable checkpoint | [Universal security audit — prompt 16](prompts/16-security-audit.md) |

Prompt 16 complements the [existing security review workflow](tools/20-security-review.md). It does not replace ordinary code review, tests, or specialist testing. An audit may span multiple sessions; the checkpoint records unfinished coverage.

## Start an audit

1. Open the **target project's repository** in an agent that can read its files. Run it in that project, not in the toolkit unless the toolkit itself is your target.
2. Provide any scope exclusions and relevant authorization constraints the repository cannot answer. Use a private output location outside the repository by default. Keep the current client, model, provider, and authentication.
3. Paste the shortcut below into the **agent conversation**, not a terminal. Alternatively, copy the entire `Prompt` block from [prompt 16](prompts/16-security-audit.md#prompt). No toolkit installation is necessary.
4. Let the agent inventory the system and review the highest-risk paths. It should ask only for missing information that affects authorization or correctness and continue independent safe work.
5. Read the findings, coverage, and limitations before selecting any fixes. `AUDIT` never grants permission to modify the project or test a deployed service.

```text
Read https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/docs/prompts/16-security-audit.md and execute the entire “Prompt” block in this repository. Use AUDIT mode, preserve my current client/model/provider/authentication, keep active testing disabled, and save the four audit artifacts in a private directory outside the repository. Do not edit project files or publish reports.
```

The shortcut requires network access and this file on `main`. If remote reading is unavailable, paste the full block or ask the agent to read a local toolkit copy by its absolute path. A shortcut alone does not include the audit instructions. For reproducible use, record the toolkit revision and use that commit's file instead of the moving `main` reference.

Optional settings can precede the full prompt. Replace the scope and language with your actual choices:

```text
Mode: AUDIT
Scope: the current repository, including all applications and shared components
Report language: English
Active testing: disabled
Output: a new private directory outside the repository; report its actual path
```

Reports use the user's language by default. Public documentation and advisory queries may contain public identifiers only. Dependency scanners may upload manifests or dependency metadata; repository access does not authorize that disclosure. If current sources or safe execution are unavailable, the audit must record the gap and distinguish static review from runtime testing.

## Modes and authorization

| Mode | Result | Project changes |
|---|---|---|
| `AUDIT` (default) | Evidence, findings, coverage, and first-batch remediation prompt | None |
| `PLAN` | Self-contained remediation prompts for selected findings | None |
| `FIX` | Smallest complete correction for explicitly selected findings or an authorized batch | Only the authorized scope |
| `VERIFY` | Recheck selected findings and update verification evidence | No source/configuration changes |

Reviewing code and testing a running system are different evidence. Repository configuration does not prove deployed behavior. Before executing project scripts, the agent must inspect them and establish suitable isolation; a Git worktree alone is not a sandbox.

Active testing remains disabled until exact targets and boundaries are authorized: environment, target allowlist, techniques, test accounts/data, request/concurrency limits, and stop conditions. Production and third-party services require explicit inclusion. This general prompt excludes denial-of-service, brute-force, persistence, and destructive testing.

## Read the four private deliverables

| File | What to inspect |
|---|---|
| `SECURITY-AUDIT.md` | Summary, scope, threat model, prioritized findings, dependency/runtime inventory, enforcement/update plan, coverage, and limitations |
| `SECURITY-FINDINGS.json` | Structured findings with stable IDs, schema version, run metadata, coverage gaps, and remediation batches; unknown values use `null` |
| `REMEDIATION-PROMPTS.md` | Ordered batch index and a detailed prompt for the first recommended batch; remaining prompts are generated on request |
| `AUDIT-HANDOFF.md` | Revision, reviewed areas, finding IDs, pending work, permissions, blockers, and artifact paths for continuation |

Use a new private directory per audit with restrictive permissions where supported. An ignored directory is acceptable only after verifying it is untracked and excluded from publication; a dot-prefix alone provides no protection. Do not commit, upload, or publish these artifacts automatically. Redacted findings can still expose vulnerabilities or private architecture. If file output is unavailable, expect clearly labeled chat sections and a handoff, not a claim that files were saved.

Check that every finding identifies the affected revision and code, concrete scenario, impact, counterevidence, minimal correction, affected callers, and verification criteria. Counts must separate confirmed vulnerabilities, candidates needing validation, and informational observations. Coverage states are `Reviewed`, `Partially reviewed`, `Not reviewed`, and `N/A`; sampling and unfinished work must be explicit.

The vulnerability labels are `Low`, `Medium`, `High`, and `Critical`, using names from [FIRST CVSS](https://www.first.org/cvss/v4.0/specification-document). The prompt's impact descriptions are qualitative audit guidance, not a computed CVSS assessment. `Informational` is outside vulnerability totals. `Emergency` is a custom response priority, separate from severity and confidence (`Confirmed`, `Likely`, or `Needs validation`). Numeric scores require a justified vector and specification version.

## Continue, plan, fix, and verify

Use these in the same audit conversation, or provide the new session with the private handoff and relevant artifacts through authorized local access. Replace example IDs and batch numbers with actual findings. Do not paste private reports into public issues or search services.

To resume a partial audit, point the agent to the actual `AUDIT-HANDOFF.md` path and send:

```text
Continue the audit from the handoff in AUDIT mode. Verify the current revision, revalidate changed files, preserve finding IDs, and complete the next risk-ordered batch. Keep active testing disabled. Update the four private artifacts with actual coverage and remaining limitations.
```

To generate a correction prompt without editing code:

```text
Use PLAN mode. Generate the remediation prompt for SEC-001 only.
Include the evidence, minimal fix, affected callers,
regression tests, and acceptance criteria. Do not edit code.
```

To plan dependency and runtime maintenance:

```text
Use PLAN mode. Generate the dependency and runtime maintenance prompt, including update automation and CI enforcement. Separate known vulnerabilities, unsupported components, supported but outdated components, and unverified versions. Do not install tools, update dependencies, or change configuration.
```

Review the selected batch and its compatibility, rollback, and test requirements. Then explicitly authorize implementation:

```text
Use FIX mode. Implement batch 1 only from the reviewed remediation plan. Revalidate its findings against the current code, preserve unrelated changes, and verify the security regression and legitimate-use behavior. Do not publish, merge, change production, rotate credentials, or run destructive migrations.
```

To recheck completed fixes:

```text
Use VERIFY mode. Verify the fixes for SEC-001 and SEC-002. Run only checks whose isolation and authorization are established. Update their status and evidence in the private artifacts. Report residual risk and untested deployment behavior. Do not edit source or configuration.
```

A source change remains `Fixed, verification pending` until the agreed checks pass. Passing local tests does not demonstrate production effectiveness. Updates should arrive as reviewable changes with relevant tests; local hooks provide feedback, while CI and applicable server-side merge controls enforce required checks. Neither automatic merging nor new controls are enabled by this audit.

## Standards and limits

The prompt uses [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) for applicable web security requirements, [WSTG](https://owasp.org/www-project-web-security-testing-guide/) for testing guidance, and system-specific sources from its [authoritative starting points](prompts/16-security-audit.md#authoritative-starting-points). Each run must verify current stable/final guidance, advisory applicability, support policies, and exact requirement identifiers. Versions are deliberately resolved at audit time.

This workflow is published guidance, not evidence of a completed security audit. It has not been validated end to end on other projects, and publication does not execute a pentest. No prompt alone certifies security or compliance. A clean result means only “no confirmed findings in the reviewed scope,” with the reported coverage and limitations.
