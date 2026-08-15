# Sanitização de projeto

## Quando usar

Use este prompt para uma passada geral de "limpar esse código": código
morto, comentários `TODO`/`FIXME` esquecidos, dependências que ninguém mais
importa. O ponto central é ter um agente que **mede antes de agir**, em vez
de chutar a gravidade de cada problema ou assumir riscos silenciosamente por
conta própria. Em bases de código grandes, combine com o [despacho paralelo
de subagentes especialistas](../tools/02-subagent-orchestration.md) em vez
de rodar o prompt inteiro através de um agente só.

## Por que funciona

A lógica é separar **medir** de **agir**. Toda alegação sobre o estado do
código — quantos warnings existem, se o build passa, quantas dependências
estão sem uso — precisa vir de um comando real, executado agora, nunca de
uma estimativa ou de um número lembrado de uma execução anterior. Em cima
dessa base factual, o prompt separa correções mecânicas e seguras (que
podem acontecer sem perguntar nada) de decisões que exigem julgamento
humano — por exemplo, "essa exportação realmente não é usada, ou só parece
assim porque é consumida via reflection ou import dinâmico?" — com a opção
conservadora como padrão se ninguém responder. Por fim, ele força execução
em passos pequenos e verificáveis, cada um comprovado por uma checagem
real, em vez de um diff (a comparação entre duas versões do código) gigante
que mistura dez correções não relacionadas e fica impossível revisar com
confiança.

## Como adaptar os placeholders

- **`[LINT_COMMAND]`** — o comando que roda o linter do projeto (ex.:
  `npm run lint`, `ruff check .`, `golangci-lint run`).
- **`[TYPECHECK_COMMAND]`** — o comando que roda a checagem de tipos (ex.:
  `npm run typecheck`, `tsc --noEmit`, `mypy .`).
- **`[TEST_COMMAND]`** — o comando que roda a suíte de testes (ex.:
  `npm test`, `pytest`, `go test ./...`).
- **`[BUILD_COMMAND]`** — o comando que compila/builda o projeto (ex.:
  `npm run build`, `make build`).
- **`[DEPENDENCY_AUDIT_COMMAND]`** — o comando que audita dependências em
  busca de pacotes sem uso ou com vulnerabilidades (ex.: `npm audit`,
  `npx depcheck`, `pip-audit`).
- **`[PACKAGE_MANIFEST]`** — o arquivo que declara as dependências do
  projeto (ex.: `package.json`, `requirements.txt`, `go.mod`).
- **`[STACK/FRAMEWORK]`** — descrição curta da stack (ex.: "Next.js +
  TypeScript", "Django + Python 3.12").
- **`[ROOT_PATH]`** — o caminho raiz onde o agente deve operar. Útil pra
  restringir a passada a um pacote específico dentro de um monorepo.

## O prompt

```
You are doing a codebase sanitation pass. Goal: leave the repo measurably
cleaner without changing behavior, and without guessing at the current state.

## 0. Ground truth — run these now, don't estimate
- Lint: `[LINT_COMMAND]`
- Typecheck: `[TYPECHECK_COMMAND]`
- Tests: `[TEST_COMMAND]`
- Build: `[BUILD_COMMAND]`
- Dependency audit: `[DEPENDENCY_AUDIT_COMMAND]`

Report the literal output of each — pass/fail counts, warning counts,
vulnerability counts. This is the baseline everything below is measured
against. If any of these are already failing, say so before doing anything
else; don't layer cleanup on top of a broken baseline.

## 1. Inventory — find, don't fix yet
- Dead code: unused exports, unreachable branches, orphaned files.
- `TODO` / `FIXME` / `XXX` markers, with file:line and enough context to
  judge whether they're stale or still real.
- Unused dependencies declared in [PACKAGE_MANIFEST] but never imported.
- Anything the Step 0 commands already flagged before you touched a thing.

## 2. Prioritized plan — safe default vs. needs sign-off
Split findings into:
1. **Safe / conservative (default if I don't respond).** Mechanical and
   behavior-preserving only: unused imports, files with zero references,
   TODOs that reference already-resolved work.
2. **Needs my sign-off before you touch it.** Anything where "unused" is
   ambiguous (reflection, dynamic imports, public API surface), any
   dependency removal that might be a transitive/peer requirement, and any
   TODO documenting a real known gap.
3. **Out of scope — note only.** Architectural debt, anything not already
   surfaced by Step 0.

Present the plan and wait for a decision on group 2. If I don't respond,
proceed with group 1 only.

## 3. Execute in small, verifiable steps
One item at a time — never a bundle of unrelated cleanups in one diff.
After each change, re-run the specific check that proves it, the actual
command, not the full suite from memory. Move to the next item only once
the current one is verified.

## 4. Final report
Re-run every Step 0 command once more and show before/after numbers side
by side. Never write "fixed" or "cleaned up" without the command output
that proves it.

Codebase: [STACK/FRAMEWORK], root at [ROOT_PATH].
```

## Exemplo de uso

Imagine que você herdou o backend de um app de gestão de tarefas — uma API
em Node.js/Express com TypeScript que cresceu por dois anos sem nunca
passar por uma limpeza sistemática. Você preencheria os placeholders
assim:

- `[LINT_COMMAND]` → `npm run lint`
- `[TYPECHECK_COMMAND]` → `npm run typecheck`
- `[TEST_COMMAND]` → `npm test`
- `[BUILD_COMMAND]` → `npm run build`
- `[DEPENDENCY_AUDIT_COMMAND]` → `npx depcheck`
- `[PACKAGE_MANIFEST]` → `package.json`
- `[STACK/FRAMEWORK]` → "Node.js + Express + TypeScript"
- `[ROOT_PATH]` → `/apps/api` (se for um monorepo com vários pacotes)

Ao rodar, o agente primeiro executa os cinco comandos do passo 0 e reporta
os números reais — por exemplo, "14 warnings de lint, build passando, 3
dependências sem uso, 0 vulnerabilidades". Em seguida lista o inventário:
alguns exports nunca importados, um punhado de `TODO`s de dois anos atrás,
e as 3 dependências sem uso. O plano priorizado separa isso em grupo 1
(remover imports não usados, apagar um arquivo utilitário órfão) e grupo 2
— por exemplo, uma dependência que parece sem uso mas na verdade é exigida
como peer dependency (um pacote que a própria dependência espera que o
projeto host já forneça) por outro pacote, ou um `TODO` que documenta uma
limitação real e ainda vale a pena manter. Você aprova ou corrige o grupo
2, o agente executa item por item confirmando cada checagem antes de
seguir pro próximo, e o relatório final mostra o antes/depois lado a lado
(ex.: "14 → 2 warnings", "3 → 0 dependências sem uso").

## Dicas

- Em uma base grande, divida o inventário do passo 1 e a execução do passo
  3 entre subagentes especialistas por diretório ou domínio, em vez de um
  agente só passando por tudo em série.
- Rode o passo 0 de novo, do zero, toda vez que for reportar um número —
  um valor lembrado de mais cedo na sessão é a forma mais comum desse
  número se afastar da realidade.
- O grupo 2 é o ponto central do exercício; resista à tentação de encaixar
  um item "provavelmente seguro" no grupo 1 só porque deletar parece
  fácil.
