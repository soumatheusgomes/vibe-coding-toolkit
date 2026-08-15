# Parallel wave dispatch

## Quando usar

Use este prompt quando você já tiver uma lista de tarefas — saída de um
plano, de uma epic (conjunto maior de tarefas relacionadas), ou só um
lote de correções independentes — e quiser transformar isso em ondas de
execução paralela seguras (grupos de tarefas que rodam ao mesmo tempo) em
vez de um agente único mastigando tarefa por tarefa em série. É a versão
"preencha os espaços" do mesmo padrão descrito em [orquestração de
subagentes](../tools/02-subagent-orchestration.md) e no [template de
regra de dispatch
paralelo](../../templates/rules/parallel-subagent-driven-development.md).

## Por que funciona

As duas regras da Etapa 2 — nenhuma dependência entre as tarefas e
nenhuma sobreposição de arquivo — são o que torna seguro rodar vários
agentes ao mesmo tempo; quebrar qualquer uma das duas gera conflito
silencioso (dois agentes escrevendo por cima um do outro no mesmo
arquivo) ou uma **onda** que na verdade não era independente. Quando fica
incerto se essas condições valem pra uma tarefa, o prompt manda tratar
essa tarefa como dependente de tudo que já foi listado — ou seja, o
padrão seguro é degradar pra execução em série, nunca arriscar um falso
paralelismo. Do lado dos commits, cada implementador só edita e reporta o
que mudou; quem orquestra é o único que faz commit, um de cada vez, em
ordem fixa, sempre capturando o HEAD (a referência pro commit mais
recente do branch) na hora, nunca reaproveitando um HEAD capturado antes
— isso elimina qualquer corrida entre agentes tentando commitar ao mesmo
tempo.

## Como adaptar os placeholders

- **`[FEATURE/PLAN/TASK LIST]`** — aparece duas vezes: na primeira linha
  (o que você quer quebrar em ondas) e na última ("Plan/task list:").
  Cole ali a lista de tarefas, o plano ou a epic que você já tem em mãos;
  se for longo, pode repetir só um nome ou resumo curto na segunda
  ocorrência em vez do texto inteiro de novo.
- **`[BACKEND_ROLE]`, `[FRONTEND_ROLE]`, `[DB_ROLE]`, `[TEST_ROLE]`** —
  são só exemplos de papel/especialista pro campo `Owner:` de cada
  tarefa. Troque pelos nomes reais dos agentes especialistas do seu
  projeto (se você usa Claude Code com uma tabela de agentes no
  `CLAUDE.md`, use exatamente os nomes de lá, pra que o campo `Owner:` já
  aponte pro agente certo pra disparar). Pode adicionar ou remover
  papéis à vontade — o próprio prompt avisa pra usar "whatever roles
  this project defines".

## O prompt

```
Break [FEATURE/PLAN/TASK LIST] into parallel execution waves. Follow this
exactly — the safety of running multiple agents at once depends on the
rules below, not on judgment calls made in the moment.

## 1. List every task
For each unit of work, write:
- **ID** — short and stable (T01, T02, ...).
- **Description** — one line.
- **Files:** — every path/glob this task will create or modify. Be exact;
  when in doubt, list more rather than fewer.
- **Depends-on:** — task IDs whose output this task needs, or `none`.
- **Owner:** — the specialist role responsible (e.g. [BACKEND_ROLE],
  [FRONTEND_ROLE], [DB_ROLE], [TEST_ROLE] — use whatever roles this
  project defines).

Any task where `Files:` or `Depends-on:` is uncertain gets `Depends-on:
everything already listed` — that's the safe default, not a shortcut to
skip filling it in.

## 2. Group into waves
Two tasks go in the **same wave** only if BOTH hold:
1. Neither depends on the other, directly or transitively.
2. Their `Files:` sets are completely disjoint — zero overlap.

If either fails, put the dependent (or file-colliding) task in a later
wave. A task with no valid same-wave partner is simply a wave of one —
that's correct, not a failure of the grouping.

Show the result as a table: wave number, task IDs in it, owner per task.

## 3. Execute each wave, in order
For every wave:
1. **Dispatch every implementer in the wave in a single batch** — this is
   what makes it parallel instead of a string of sequential turns.
2. **Implementers do not commit.** They implement, verify their own work,
   and report exactly which files changed — and stop there.
3. **The orchestrator commits**, one task at a time, in a fixed order:
   right before each commit, capture the current HEAD fresh (never reuse a
   HEAD captured earlier, never assume `HEAD~1`), stage that task's files,
   commit.
4. **That wave's reviewers run together, after all its commits exist** —
   dispatch them in one batch too, each reviewing their task's own
   before/after range.
5. Only once every task in the wave is committed and reviewed, move to
   the next wave.

Plan/task list: [FEATURE/PLAN/TASK LIST].
```

## Exemplo de uso

Imagine um projeto pequeno com quatro tarefas na fila. O placeholder
`[FEATURE/PLAN/TASK LIST]` vira essa lista, e os papéis genéricos
(`[BACKEND_ROLE]`, `[FRONTEND_ROLE]`, `[DB_ROLE]`) viram os agentes reais
do projeto:

- **T01** — criar a tabela `relatorios` no banco (migração). `Files:`
  `src/db/schema/relatorios.ts`, `drizzle/*`. `Depends-on:` none.
  `Owner:` database-architect.
- **T02** — endpoint que exporta relatórios em CSV, lendo da tabela
  `relatorios`. `Files:` `src/app/api/relatorios/export/route.ts`.
  `Depends-on:` T01. `Owner:` backend-specialist.
- **T03** — botão "Exportar CSV" na tela de relatórios, chamando o
  endpoint novo. `Files:` `src/components/relatorios/BotaoExportar.tsx`.
  `Depends-on:` T02. `Owner:` frontend-specialist.
- **T04** — corrigir um typo no texto da tela de login, sem relação
  nenhuma com as outras três. `Files:`
  `src/components/auth/FormLogin.tsx`. `Depends-on:` none. `Owner:`
  frontend-specialist.

Na Etapa 2, o agente monta a tabela de ondas: T01 e T04 caem na **mesma
onda**, porque nenhuma depende da outra e os arquivos não se cruzam — a
regra olha só pra dependência e arquivo, não pra quem é o owner. T02 só
pode entrar numa onda depois que T01 for commitado (onda 2), e T03 só
depois de T02 (onda 3) — mesmo T03 e T04 não tendo nenhum arquivo em
comum, T03 não entra na onda 1 porque depende de T02, que ainda nem
existe.

Na Etapa 3: a onda 1 dispara os implementadores de T01 e T04 juntos, num
único lote; nenhum dos dois faz commit sozinho, eles só reportam o que
mudou. Quem orquestra commita T01 e depois T04 (ordem fixa), capturando o
HEAD de novo antes de cada commit. Os revisores de T01 e T04 rodam juntos
em seguida. Só então a onda 2 (só T02) começa — e por fim a onda 3 (só
T03).

## Dicas

- Na dúvida, use `Depends-on: everything already listed` ("depende de
  tudo que já foi listado") — na pior das hipóteses você perde um pouco
  de paralelismo, nunca ganha uma condição de corrida.
- Ordem de commit fixa por onda (não "quem terminar primeiro") mantém o
  HEAD fácil de acompanhar — capture-o bem antes do commit daquela
  tarefa específica, nunca antes disso.
- Quando duas tarefas genuinamente não conseguem evitar tocar nos mesmos
  arquivos, trate isso como sinal pra juntar as duas numa tarefa só ou
  isolar cada uma num worktree separado (uma cópia paralela do
  repositório, em outra pasta, isolada da principal) — não force as duas
  pra mesma onda.
