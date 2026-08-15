# Memory bootstrap

## Quando usar

Use este prompt ao começar um projeto do zero — ou ao adotar memória
persistente num projeto que já existe — que ainda não tem nenhum sistema
de memória entre sessões de agente. Sem isso, cada sessão nova reaprende
do zero a mesma lição cara que uma sessão anterior já tinha pago o preço
de descobrir: um bug sutil, uma decisão de arquitetura que só faz sentido
sabendo o que já foi tentado e descartado, uma regra de negócio que o
código não deixa óbvia. É a versão em prompt do padrão descrito em
[sistema de memória do Claude](../tools/09-claude-memory-system.md) (a
camada rápida) e [Obsidian como memória](../tools/08-obsidian-memory.md)
(a camada de longo prazo).

## Por que funciona

O prompt monta duas camadas com propósitos diferentes. A primeira é um
índice pequeno, carregado automaticamente em toda sessão — por isso
precisa ficar enxuto: se crescer demais, para de ser lido de verdade e
vira só mais um arquivo grande que ninguém abre. A segunda é um
repositório de longo prazo sem limite de tamanho, consultado sob demanda
em vez de carregado sempre. O critério de "vale salvar" (Etapa 2) é
deliberadamente restritivo — a pergunta não é "isso é verdade sobre o
projeto?", é "uma sessão futura ficaria surpresa e grata de saber disso
antes de começar, em vez de descobrir do jeito difícil?" —, porque a
maior ameaça a um sistema de memória não é esquecer algo importante, é
acumular tanta coisa irrelevante que ninguém lê mais o índice. E a
política de crescimento (Etapa 3) nunca deixa uma entrada sumir sem
confirmação: ela só é apagada do índice depois de criada **e** lida de
volta com sucesso no repositório de longo prazo — apagar antes dessa
confirmação é perda de dado, não faxina.

## Como adaptar os placeholders

- **`[MEMORY_DIR]`** — aparece três vezes; é a pasta onde a camada rápida
  (sempre carregada) vai morar. Em Claude Code, a convenção comum é
  `.claude/memory/` — adapte pro equivalente da sua ferramenta.
- **`[CONFIG_FILE]`** — o arquivo que seu agente já carrega sozinho no
  começo de toda sessão, onde o `INSTRUCTIONS.md` da memória precisa
  estar referenciado pra ser lido sem você pedir. Em Claude Code isso
  normalmente é o `CLAUDE.md` do projeto.
- **`[LINE_CAP]`** — o teto de linhas (não em branco) que o índice pode
  ter antes de disparar a rotina de saneamento da Etapa 3. O prompt já
  sugere 130 como ponto de partida — ajuste pro que fizer sentido no seu
  caso.
- **O bloco condicional inteiro na Etapa 4** (o parágrafo entre colchetes
  que começa com "If this project has a long-term vault/wiki
  already…") — não é um espaço simples pra preencher, é uma instrução
  condicional pro próprio agente decidir sozinho, olhando o projeto. Se
  já existe um repositório de longo prazo — um vault (cofre de notas de
  longo prazo, tipo Obsidian ou Notion), uma wiki, uma pasta de docs —,
  troque o bloco inteiro por uma frase direta nomeando onde é e como se
  acessa, preenchendo o que o prompt chama de `[VAULT_TOOL/LOCATION]`
  (nome ou local do repositório) e `[HOW — MCP tool, CLI, direct file
  edit]` (o mecanismo de acesso — um servidor MCP, sigla de "Model
  Context Protocol", o jeito padrão de um agente chamar ferramentas
  externas; um CLI; ou edição direta de arquivo). Se nada disso existe
  ainda, deixe o bloco como está — ele já instrui o agente a admitir
  isso e entregar só a camada 1, sem inventar um destino que a política
  de crescimento vai precisar mais cedo ou mais tarde.
- **`[PROJECT NAME/STACK]`** — nome do projeto e stack técnica, só pra
  dar contexto (ex.: "SaaS de gestão de tarefas, Next.js + PostgreSQL").

## O prompt

````
Set up a two-tier memory system for this project: a small always-loaded
index for facts a session needs before it starts working, and a place for
everything else that doesn't need to load every time.

## 1. Tier one — the always-loaded index
Create:
- `[MEMORY_DIR]/INSTRUCTIONS.md` — the rules below, wired into whatever
  this project auto-loads at session start (e.g. [CONFIG_FILE]), so every
  session reads them without being asked.
- `[MEMORY_DIR]/MEMORY.md` — the index itself: one line per saved fact,
  linking to its own topic file.
- `[MEMORY_DIR]/` as a folder for individual topic files, each with
  frontmatter:
  ```
  ---
  name: kebab-case-slug
  description: one-line summary — used to judge relevance in a future session
  metadata:
    type: feedback | architecture | business-rule | reference
  ---
  ```

## 2. What's worth saving — the narrow test
Save a memory only when the answer to this is yes: **would a future
session be surprised and grateful to know this before starting, rather
than discovering it the hard way?**

Concretely:
- Derivable by reading the code or git history → don't save it.
- A deadline, a motivation, or anything temporary to right now → don't
  save it.
- A debugging recipe that belongs in a commit message → don't save it.
- A mistake a session made that had to be corrected, an architecture
  pattern found only after failed attempts, a business rule invisible in
  the code, or where to find something outside the repo (a dashboard, a
  wiki, a channel) → save it.

Err toward not saving. A memory nobody needed is clutter; a lesson
relearned the hard way is expensive — but a small, high-signal index beats
a large, ignored one every time.

## 3. Growth policy — keep the index small forever
Before adding a new entry, count the index's non-blank lines. Past
[LINE_CAP] (e.g. 130), sanitize first:
1. Score every existing entry: recency × specificity × likelihood of
   preventing a real future mistake.
2. For each low-scoring entry, migrate it out — never just delete it —
   in this exact order:
   1. **Dedup** — search the long-term store (below) for the same topic;
      extend an existing note instead of creating a duplicate.
   2. **Match the target's template** — long-term notes may have their
      own required structure; follow it exactly.
   3. **Create** the note in the long-term store.
   4. **Confirm** — read the note back. No successful read, no deletion.
   5. **Only then** delete the entry from the index and its topic file.
3. Rewrite the index with only what's left.
4. Then add the new entry.

Deleting before the read-back confirms is data loss, not cleanup. If
unsure whether an entry still earns its place, leave it — migrating later
costs nothing.

## 4. Tier two — the long-term store
[If this project has a long-term vault/wiki already: name it explicitly —
e.g. "migrate low-value entries to [VAULT_TOOL/LOCATION], accessed via
[HOW — MCP tool, CLI, direct file edit]." If nothing like that exists yet,
say so and stop after tier one; don't invent a destination for entries the
cap will eventually need to shed.]

Project: [PROJECT NAME/STACK].
````

## Exemplo de uso

Imagine que você está começando um SaaS de gestão de tarefas do zero —
Next.js + PostgreSQL — e a equipe já usa uma wiki interna no Notion pra
documentação de mais longo prazo:

- `[MEMORY_DIR]` → `.claude/memory`
- `[CONFIG_FILE]` → `CLAUDE.md`
- `[LINE_CAP]` → `130`
- bloco condicional da Etapa 4 → "migre entradas de baixo valor pra wiki
  interna do Notion, acessada via integração oficial"
- `[PROJECT NAME/STACK]` → "Task Tracker SaaS, Next.js + PostgreSQL"

O agente cria `.claude/memory/INSTRUCTIONS.md` (linkado no `CLAUDE.md` do
projeto), um `.claude/memory/MEMORY.md` vazio, e deixa a pasta
`.claude/memory/` pronta pra receber arquivos de tópico. Duas semanas
depois, numa sessão qualquer, o agente descobre — depois de duas
tentativas erradas — que uma race condition (dois processos disputando o
mesmo dado ao mesmo tempo) só acontece porque duas rotas escrevem na
mesma tabela sem lock; ele salva isso como uma entrada do tipo
`architecture` em `.claude/memory/race-condition-tabela-tarefas.md` e
adiciona uma linha no índice. Meses depois, o índice passa de 130 linhas:
antes de adicionar a próxima entrada, o agente pontua as existentes,
escolhe as de menor valor (por exemplo, um detalhe de configuração que
hoje já dá pra achar direto no código), migra cada uma pra wiki do Notion
seguindo a sequência dedup → template → criar → confirmar lendo de volta,
e só depois apaga a entrada correspondente do índice — nunca ao
contrário.

## Dicas

- O critério de salvamento da Etapa 2 é propositalmente restritivo — a
  maior parte do que um agente aprende numa sessão não merece virar
  memória permanente. Resista à tentação de registrar tudo "só por
  garantia".
- A ordem migrar-antes-de-apagar da Etapa 3 existe porque uma migração
  não confirmada é perda de dado, não uma mudança de lugar — nunca pule
  direto pra apagar a entrada do índice.
- Se ainda não existe um repositório de longo prazo, entregue só a
  camada 1 em vez de inventar um destino — veja [Obsidian como
  memória](../tools/08-obsidian-memory.md) pra saber como montar um do
  zero.
