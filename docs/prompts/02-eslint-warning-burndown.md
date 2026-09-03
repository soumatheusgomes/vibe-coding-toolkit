# ESLint warning burndown

## Quando usar

Se o projeto ainda não tem uma configuração de ESLint decente pra começar,
use antes um dos dois que montam a configuração: o
[`08-eslint-quality-gates-install.md`](08-eslint-quality-gates-install.md)
(o atalho — copia três regras prontas e mede) ou o
[`07-eslint-complete-setup.md`](07-eslint-complete-setup.md) (o completo — o
agente monta a config raciocinando sobre a sua stack). Este prompt aqui serve
pra depois, quando os avisos de uma configuração já existente acumularam e é
hora de zerá-los.

Se os avisos que você quer zerar são especificamente de **tamanho de
arquivo**, vá direto pro
[`09-file-size-refactor.md`](09-file-size-refactor.md): quebrar um arquivo de
800 linhas é um tipo de trabalho diferente de corrigir 240 avisos de
`complexity`, e aquele prompt é feito só pra isso.

Use este prompt quando você tem uma pilha grande de warnings de lint pra
zerar — ou quer revisar e reapertar deliberadamente uma regra específica —
sem que "só corrigir os warnings" vire, silenciosamente, um refactor
grande. Ele foi generalizado a partir de uma queima de warnings real, na
qual a decisão mais cara (até onde vale a pena perseguir uma regra em
arquivos que não foram escritos pensando nela) precisava de uma resposta
humana explícita antes de qualquer código mudar — não de uma suposição
enterrada no meio de um plano de implementação.

## Por que funciona

A lógica é transformar decisão implícita em decisão explícita, e alegação
em comando. Primeiro, o prompt exige a contagem real de warnings agora —
nunca um número antigo, porque contagens lembradas divergem da realidade
rápido demais pra confiar nelas. Depois, ele isola a decisão mais
arriscada (até onde vale perseguir a regra, ou se faz mais sentido só
afrouxar o escopo dela) num **portão de decisão** numerado, com opções e
trade-offs explícitos — deixando claro que "afrouxar a regra" é uma
mudança de configuração, não uma limpeza de código, pra nunca ser
apresentada como se fosse a mesma coisa. Os critérios de sucesso viram
comandos literais em vez de frases vagas do tipo "deveria funcionar". O
trabalho é dividido em **ondas** — grupos de tarefas com arquivos
disjuntos, despachadas em paralelo — porque um subagente só enxerga o
próprio briefing, nunca a conversa de planejamento inteira; por isso a
lista de pegadinhas precisa ser copiada literalmente em cada uma. E o
checklist final só é riscado rodando o comando de novo, nunca por
suposição.

## Como adaptar os placeholders

- **`[RULE_NAME]`** — a regra específica do ESLint (ou de outro linter)
  que está sendo zerada ou reavaliada — ex.: `no-unused-vars`,
  `complexity`, `max-lines`. Se a queima cobre o conjunto inteiro de
  warnings em vez de uma regra só, diga isso explicitamente — o próprio
  prompt já prevê essa opção ("or the full warning set").
- **`[LINT_COMMAND]`** — o comando que roda o linter mostrando a saída
  completa por arquivo e por regra. Atenção: alguns wrappers/proxies de CI
  resumem a saída em vez de mostrar cada linha — o prompt já orienta a
  rodar com a flag ou invocação direta que devolve a saída completa
  quando isso acontecer.
- **`[TYPECHECK_COMMAND]`** — o comando de checagem de tipos.
- **`[TEST_COMMAND]`** — o comando que roda a suíte de testes.
- **`[BUILD_COMMAND]`** — o comando de build.
- **`[STACK/FRAMEWORK]`** — descrição curta da stack, pra dar contexto ao
  agente.

## O prompt

```
You are planning and executing a lint warning burn-down for [RULE_NAME] (or
the full warning set) in this repo. Do not start fixing anything until the
plan below is written and the decision gate in step 1 is answered.

## 0. Ground truth
Run `[LINT_COMMAND]` right now and report the actual current count — total
warnings, broken down by rule and by file. Do not reuse a number from an
earlier run, a commit message, or memory. If the output looks filtered or
truncated (some wrappers/proxies summarize instead of showing every line),
re-run with whatever flag or direct invocation gives full per-line output.

## 1. 🔴 Decision gate — answer before any implementation
Find the single riskiest or most expensive part of this burn-down — usually
one rule responsible for a large share of the count, concentrated in files
where "fixing" it is expensive or risky (e.g. a size cap tripped mainly in
generated or test files). State it with real numbers: file count, line
count, estimated new files/functions if applicable. Then present options:

- **(A) Fix every violation fully.** Default if there's no response — the
  fully-correct option is the safe assumption when scope wasn't explicitly
  narrowed.
- **(B) Fix most, track the rest as tracked debt.** Fix the cheap majority;
  leave the expensive tail as an explicit, visible exception (comment +
  issue/ticket reference), not a silent suppression.
- **(C) Re-scope or loosen the rule itself.** ⚠️ **This is a config change,
  not a warning fix — say so explicitly in the plan and in any PR. Never
  present it as if the code got cleaner.**

Wait for a decision before implementing anything in this area. Everything
outside the flagged risk area proceeds regardless of which option is picked.

## 2. Success criteria — commands, not prose
State every criterion as a command and its expected output, e.g.:
- `[LINT_COMMAND] shows 0 warnings for [RULE_NAME]`
- `[TYPECHECK_COMMAND]` clean
- `[TEST_COMMAND]` green
- **Zero behavior change.** Any fix that isn't a pure mechanical
  extraction/rename/move gets pulled out of this burn-down and flagged as
  its own item for separate human review — never folded in silently.

## 3. Break the work into waves
Group the remaining violations into ordered, file-disjoint waves. For each
task in each wave, specify: task ID, exact file scope (`Files:`), what it
depends on (`Depends-on:`, or "none"), and the specialist role that owns
it. Use the parallel wave dispatch worksheet (`05-parallel-wave-dispatch.md`
in this same folder) for the grouping rule and dispatch mechanics.

## 4. Pitfalls — copy verbatim into every task brief
List every concrete gotcha specific to this rule and this codebase — e.g. a
size cap with zero slack left in files already near the limit, a lint
cache that doesn't invalidate on config changes, an extraction that
silently widens an inferred type, a shared test fixture with many callers.
A subagent implementing one task sees only its own brief, never this
planning conversation — a pitfall not copied into the brief does not exist
for it.

## 5. Reviewer sign-off
For each wave, name every specialist reviewer required before that wave
counts as done — a domain-risk reviewer for anything security/money/auth-
adjacent, plus whatever language/framework reviewers match the files
changed. Before calling the whole burn-down complete, require a full-diff
pass by every relevant reviewer type, at the same rigor as a normal review,
not a lighter one just because it's "only" a lint fix.

## 6. Final checklist — mark only by re-running
Every box below is checked by an actually-executed command, never by
assertion:
- [ ] `[LINT_COMMAND]` shows 0 warnings for [RULE_NAME] (or the count
      agreed at the decision gate)
- [ ] `[TYPECHECK_COMMAND]` clean
- [ ] `[TEST_COMMAND]` green
- [ ] `[BUILD_COMMAND]` succeeds
- [ ] Every suppression added (`eslint-disable` or equivalent) is listed
      with its justification — or the list is empty
- [ ] Every non-mechanical fix pulled out under step 2 is listed and
      signed off — or the list is empty
- [ ] All reviewer sign-offs from step 5 are complete

Codebase: [STACK/FRAMEWORK]. Rule(s) in scope: [RULE_NAME].
```

## Exemplo de uso

Imagine um monorepo em TypeScript onde subir o limite da regra
`complexity` do ESLint pra um valor mais rígido revelou 240 warnings no
projeto inteiro — 180 deles concentrados em seis arquivos legados com
condicionais muito aninhadas. Você preencheria assim:

- `[RULE_NAME]` → `complexity`
- `[LINT_COMMAND]` → `npm run lint`
- `[TYPECHECK_COMMAND]` → `npm run typecheck`
- `[TEST_COMMAND]` → `npm run test`
- `[BUILD_COMMAND]` → `npm run build`
- `[STACK/FRAMEWORK]` → "Next.js + TypeScript monorepo"

O agente roda o lint agora e reporta o número real (240, nunca um número de
memória). No portão de decisão, ele aponta os seis arquivos legados como o
ponto caro e arriscado, com contagem real de linhas e arquivos, e
apresenta as três opções — corrigir tudo, corrigir a maioria e rastrear o
resto como dívida técnica, ou afrouxar o limite da regra só pra esses seis
arquivos (deixando explícito que isso é mudança de config, não limpeza de
código). Sem resposta sua, ele assume a opção A como padrão e segue
corrigindo o resto do projeto normalmente enquanto espera. Depois, quebra
o trabalho em ondas de arquivos disjuntos, cada uma com uma pegadinha
conhecida copiada no briefing (ex.: "essa extração não pode mudar o tipo
de retorno inferido da função exportada"), roda revisores especialistas
por onda, e só risca o checklist final depois de rodar `[LINT_COMMAND]`,
`[TYPECHECK_COMMAND]`, `[TEST_COMMAND]` e `[BUILD_COMMAND]` de novo, de
verdade.

## Dicas

- O portão de decisão do passo 1 é a parte mais tentadora de pular,
  porque parece formalidade — na prática, é onde costuma estar a maior
  parte do trabalho ou do risco real.
- Combine o passo 3 com
  [`05-parallel-wave-dispatch.md`](05-parallel-wave-dispatch.md) pra ter
  paralelismo de verdade; sem isso, isso degrada pra uma tarefa por vez.
- Mantenha a lista de pegadinhas do passo 4 crescendo à medida que você
  encontra novas no meio da queima — uma pegadinha descoberta na onda 2
  pertence a toda onda 3 em diante também.
