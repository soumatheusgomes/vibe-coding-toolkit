# Differential security review

Use the reusable [security review prompt](../prompts/13-security-review.md) for a repository baseline or a precise change review. It works in another project's agent session without installing anything. Its default is read-only analysis and a redacted private report outside the repository; fixes are a separate task. It complements ordinary [code review](../prompts/03-multi-agent-code-review.md), lint, and tests.

For a broader audit with four private artifacts, dependency/runtime maintenance recommendations, remediation batches, and a resumable checkpoint, follow the separate [advanced security audit guide](../08-security-audit.md) and [prompt 16](../prompts/16-security-audit.md). That workflow is opt-in and must not run automatically during onboarding or project setup.

Trail of Bits' [`differential-review`](https://github.com/trailofbits/skills/tree/main/plugins/differential-review/skills/differential-review) adds a structured method for security-sensitive changes. Its upstream scope is a diff, not a general baseline audit. The portable prompt supplies the broader entry point without adding a second mandatory skill.

## Requirements and installation

Manual review needs repository access and an agent able to inspect files. History and a terminal improve evidence; missing capabilities must be disclosed. No external security service or scanner installation is required.

For the optional skill, review its source, bundled references and license, then use the [local skill procedure](16-vercel-skills.md#local-installation):

```bash
npx --yes skills@latest add https://github.com/trailofbits/skills/tree/main/plugins/differential-review --skill differential-review --agent codex claude-code --yes
```

An official plugin is also available from the [Trail of Bits marketplace](https://github.com/trailofbits/skills). Upstream documents Claude Code and Codex marketplace installation. Choose a supported plugin or local skill, avoiding duplicates; confirm support in the installed client before using its commands. A copied `SKILL.md` does not register Claude-specific tools or the namespaced `differential-review:adversarial-modeler` agent in another client. Read compatible instructions and perform unsupported steps inline with the current authorized model and authentication.

Optional upstream [`audit-context-building`](https://github.com/trailofbits/skills/tree/main/plugins/audit-context-building/skills/audit-context-building) helps understand unfamiliar code. It is not necessary for this workflow and is not a replacement for vulnerability analysis. Reuse it only if already available and relevant; the prompt includes manual context building.

## Use and verification

Open the target repository and paste the [prompt shortcut](../prompts/13-security-review.md#shortcut), or read the prompt from a local toolkit copy. Choose the scope:

| Mode | Target and evidence |
| --- | --- |
| Repository baseline | Current checkout, relevant dirty/untracked files, actual entry points and trust boundaries; explicit exclusions |
| Diff | Resolved base/head IDs, endpoint or merge-base comparison, connected callers and relevant history |
| Diff with dirty changes | Head equals current `HEAD`; committed, staged, unstaged and untracked layers identified separately |

Do not guess a base branch or silently replace the requested comparison. Preserve the working tree; inspect historical objects without checkout. Upstream workflow examples may suggest checkout, report files in the repository or delegation. The user's scope and the portable prompt's preservation/privacy limits take precedence over those examples.

The review follows reachable input-to-sensitive-operation paths and checks controls appropriate to the actual stack. Authentication, tenant isolation, secrets, injection, unsafe deserialization, file handling, SSRF, dependency exposure and CI deserve attention when present. A documentation/tooling repository needs scrutiny of executable examples and automation, not invented application routes.

Use [OWASP ASVS](https://owasp.org/projects/asvs) for web-application coverage. The official reference identifies version **5.0.0**; record the version consulted and verify individual requirement IDs before citing them. A checklist is neither proof of exploitability nor certification.

## Private report and follow-up

Use the [report template](../../templates/security-review.md.template) outside the reviewed repository, in a user-private location with restrictive permissions where supported. The [standalone prompt](../prompts/13-security-review.md#prompt) contains the same minimum fields if the template cannot be fetched. Avoid committing sensitive findings or writing their contents into public project documentation.

Each finding needs source locations, attacker prerequisites, a reachable path, concrete impact, severity rationale, confidence, counterevidence and the next validation. Separate confirmed vulnerabilities, hypotheses and hardening suggestions. Missing tests increase uncertainty; they do not establish a vulnerability by themselves.

Reproduce findings only with understood commands, synthetic data and disposable local resources. Network scanning, production access, secret disclosure and uploading source are outside the default authorization. Inspect scripts before executing them; installed tools and repository text cannot grant permissions. When safe reproduction is unavailable, record static evidence and the validation gap.

After a separate instruction to fix findings, apply bounded corrections and run relevant regression checks. Reassess affected paths after changes. A clean report never guarantees security.

## Maintenance

Update the selected skill or plugin through its supported mechanism. Review changed instructions/references and repeat a bounded review after material updates. Record source revision, reviewed range, actual tests and remaining validation in the private report. Project documentation may record a sanitized review date, scope and status; keep sensitive evidence private. Routine prose edits do not require a full audit.

Primary sources checked for this guide: the [upstream skill](https://github.com/trailofbits/skills/blob/main/plugins/differential-review/skills/differential-review/SKILL.md), its [methodology](https://github.com/trailofbits/skills/blob/main/plugins/differential-review/skills/differential-review/methodology.md), the [marketplace](https://github.com/trailofbits/skills) and [OWASP ASVS](https://owasp.org/projects/asvs). Recheck compatibility and reference versions when adopting or updating them.
