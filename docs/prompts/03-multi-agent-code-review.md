# Code review multi-agente

## Quando usar

Use este prompt antes de fazer merge de qualquer mudança não-trivial, em
vez de confiar numa única passada de revisão — que inevitavelmente
favorece qualquer que seja a lente que aquele revisor usa por padrão. Um
revisor focado em segurança tende a não pegar uma violação de regra de
hook do React, e vice-versa. Funciona tanto pra um PR (*pull request*, a
mudança proposta pra ser mesclada no projeto) isolado quanto pra revisar
uma branch inteira antes de abrir o PR.

## Por que funciona

Rodar vários especialistas estreitos em paralelo encontra mais problemas
reais do que uma única passada generalista — cada lente (segurança,
qualidade geral, tipagem, framework) enxerga o que as outras não foram
desenhadas pra ver. Mas isso só funciona se a etapa de síntese realmente
descartar ruído em vez de só concatenar a saída de todo mundo: sem
deduplicação e sem filtro por cenário de falha concreto, quatro revisores
só produzem uma lista quatro vezes mais longa e menos confiável — não
quatro vezes mais sinal.

## Como adaptar os placeholders

- **`[DIFF/PR/BRANCH]`** — o alvo da revisão: um diff (a comparação linha
  a linha entre duas versões do código) literal, o número/link de um PR,
  ou o nome de uma branch comparada com a base.
- **`[LANGUAGE]`** — a linguagem principal do código alterado. Define
  quais preocupações de tipagem específicas da linguagem entram na
  revisão (ex.: TypeScript, Python, Go, Rust).
- **`[FRAMEWORK]`** — o framework usado no código alterado, quando o diff
  toca código voltado a framework (ex.: React, Next.js, Django). O
  próprio prompt já orienta a descartar essa lente quando a mudança é
  puramente backend/CLI, sem superfície de framework nenhuma.

## O prompt

```
Review [DIFF/PR/BRANCH] using a panel of independent specialist reviewers,
then synthesize their findings into one ranked report. Do not review it
yourself first — dispatch the panel.

## 1. Dispatch the panel — in parallel, one batch
Send the same diff to each of these reviewer lenses at once, dropping any
that don't apply to this change:
- **General code quality** — readability, structure, error handling, dead
  code, missing test coverage.
- **Security** — OWASP Top 10, hardcoded secrets, injection, broken auth,
  unsafe deserialization, dependency CVEs.
- **[LANGUAGE] type-safety** — unsafe type assertions/casts, escape hatches
  around the type system, async/concurrency correctness, injection risk
  from unchecked input.
- **[FRAMEWORK]-specific** — e.g. component/hook rules, render performance,
  accessibility, framework-specific footguns. Only if this diff touches
  framework-facing code.

Each reviewer works independently — no reviewer sees another's findings —
and reports every finding as: `file:line — severity — one-sentence claim —
concrete failure scenario (the input or state that actually makes this
break)`. A finding with no failure scenario isn't a finding, it's a hunch;
reviewers should drop those themselves instead of padding the list.

## 2. Synthesize
Once every reviewer has reported:
1. **Dedupe** — the same underlying issue flagged by more than one reviewer
   collapses into a single entry; keep the sharpest description and note
   which reviewers agreed.
2. **Filter** — drop anything without a concrete failure scenario, or
   anything already handled elsewhere in the code. Verify against the
   actual diff before dropping a finding — don't take a reviewer's claim
   on faith in either direction.
3. **Rank** — CRITICAL (security/data-loss, must fix before merge) → HIGH
   (real bug or significant quality issue) → MEDIUM (maintainability) →
   LOW (style/optional).

## 3. Present
One report, most severe first. Each entry: file:line, one-sentence
summary, failure scenario, severity, which reviewer(s) raised it. State
plainly if nothing survived synthesis — an empty CRITICAL/HIGH list is a
valid, useful result, not a failure to find something.

Target: [DIFF/PR/BRANCH]. Stack: [LANGUAGE] / [FRAMEWORK].
```

## Exemplo de uso

Imagine que você acabou de terminar um PR que adiciona um novo endpoint
numa API (backend) e o formulário em React que consome esse endpoint. Você
preencheria:

- `[DIFF/PR/BRANCH]` → `PR #482` (ou `git diff main...feature/formulario-cadastro`)
- `[LANGUAGE]` → "TypeScript"
- `[FRAMEWORK]` → "React + Next.js"

O agente despacha as quatro lentes em paralelo — qualidade geral,
segurança (OWASP, sigla de "Open Web Application Security Project", a
referência das vulnerabilidades web mais comuns), tipagem TypeScript e a
lente específica de React/Next.js — cada uma revisando o diff
isoladamente, sem ver o que as outras encontraram. Cada revisor reporta
achados como `arquivo:linha — severidade — frase — cenário de falha
concreto`. Na síntese, dois revisores diferentes apontam o mesmo problema
(o endpoint não valida um campo no servidor, mesmo o formulário validando
no cliente) — isso vira uma única entrada, marcada como confirmada por
dois revisores. Um comentário vago do tipo "esse componente poderia estar
mais limpo", sem cenário de falha, é descartado. O relatório final sai
ordenado por severidade — por exemplo: CRÍTICO (validação ausente no
servidor, contornável chamando a API direto), ALTO (uma dependência nova
com uma vulnerabilidade conhecida — CVE, na sigla em inglês), MÉDIO (um
componente sem tratamento de estado de erro), e assim por diante.

## Dicas

- Descarte as lentes de revisor que não se aplicam — sem lente de
  framework numa mudança pura de backend/CLI — em vez de forçar as
  quatro toda vez.
- A etapa de deduplicação e filtro da parte 2 importa tanto quanto o
  painel em si; quatro revisores enchendo a lista com achados de baixa
  confiança só produzem um relatório mais longo e menos confiável.
- Veja [orquestração de subagentes](../tools/02-subagent-orchestration.md)
  pra disparar isso de fato como subagentes paralelos, em vez de turnos
  sequenciais.
