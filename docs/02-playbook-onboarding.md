# Playbook de Onboarding

> Se o [README](../README.md) é o cardápio e a [Visão geral](00-overview.md)
> é o porquê, este é o passo a passo: pegue qualquer projeto, do zero, e
> monte esse fluxo de trabalho inteiro — na ordem certa, ficando fluente em
> cada ferramenta pelo caminho.

## Para quem é este playbook

Serve tanto pra quem já desenvolve há anos e quer um jeito estruturado de
usar IA em produção sem perder controle da qualidade, quanto pra quem está
começando agora e só quer copiar um caminho que já funciona. Este playbook
não assume que você já usou o Claude Code antes — a Parte 1 começa na
instalação — mas também não obriga ninguém a andar pra trás: se parte
disso já está rodando no seu ambiente, pule direto pra parte que falta.

## Como usar este playbook

Duas formas, as duas válidas:

- **Do início ao fim, na primeira vez.** Cada parte assume que a anterior
  já rodou — a Parte 4 (o fluxo de trabalho completo) só faz sentido de
  verdade depois que os pilares da Parte 2 estão instalados e o `CLAUDE.md`
  da Parte 3 está preenchido.
- **Como referência, depois.** Uma vez que o setup já está de pé, volte
  direto pra parte que precisar — "como era o prompt de revisão
  multi-agente mesmo?" é uma pergunta da Parte 4, não do playbook inteiro
  de novo.

## Pré-requisitos

Antes de abrir o terminal, confira se você tem:

- **Node.js instalado.** É o único requisito real pra instalar o Claude
  Code — o instalador via `npm` cuida do resto. Confira com
  `node --version`; qualquer versão LTS recente serve.
- **Um terminal.** macOS, Linux ou Windows (nativo ou WSL) — tudo neste
  playbook roda em linha de comando.
- **`gh` CLI (opcional).** Só necessário se você for usar os fluxos de
  GitHub (pull requests, issues) mencionados ao longo do caminho. Instale
  pelo [site oficial](https://cli.github.com) se ainda não tiver.
- **Uma conta que autentique o Claude Code** — plano Pro, Max, ou acesso
  via API/console da Anthropic. Sem isso o `claude` CLI instala, mas não
  loga.

## Parte 1 — Fundação: instale o Claude Code e entenda a filosofia

### Instale o Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Confirme que a instalação funcionou e está no seu `PATH`:

```bash
claude --version
```

Se o comando não for encontrado, feche e reabra o terminal (o `npm` às
vezes precisa disso pra atualizar o `PATH`), ou confira a documentação
oficial de instalação e autenticação em
[docs.claude.com/en/docs/claude-code](https://docs.claude.com/en/docs/claude-code).

### A filosofia em um parágrafo

Isso não é uma lista de ferramentas soltas — é um fluxo de trabalho. A
sessão principal do Claude Code não implementa nada sozinha: ela planeja,
decide e delega pra **subagentes** especialistas (sessões separadas do
Claude Code, cada uma disparada pra executar uma tarefa específica com seu
próprio contexto — um agente de backend, um de banco de dados, um revisor
de segurança, e por aí vai), acionados em paralelo quando não há conflito
entre eles. Código é o último passo de um processo — brainstorm pra
explorar a intenção, plano pra resolver ambiguidade antes de escrever
qualquer linha, implementação, revisão — nunca o primeiro. Em cima disso,
uma camada de economia de tokens mantém sessões longas baratas, dois
"modos de comportamento" compostos controlam o que é construído e como o
agente fala sobre isso, portões de qualidade sobem de aviso pra erro como
uma migração rastreada em vez de uma trava súbita, e um sistema de memória
em duas camadas garante que uma lição cara não se perca entre sessões.
Nenhuma peça é impressionante sozinha — a força está em rodar todas
juntas. Pra a versão completa e sem pressa desse raciocínio antes de
seguir, leia [Visão geral](00-overview.md) — o resto deste playbook
assume que você já entendeu o porquê.

## Parte 2 — Os pilares essenciais, em ordem de importância

Três plugins formam a espinha dorsal deste fluxo. A ordem abaixo não é
alfabética — é de importância real: **Superpowers vem primeiro porque tudo
mais neste playbook gira em torno dele.** Sem ele, os outros dois ainda
funcionam sozinhos, mas você perde a disciplina de processo (brainstorm →
plano → implementação → revisão) que faz o resto do fluxo — inclusive a
Parte 4 inteira — fazer sentido.

### Superpowers — o pilar mais importante

Superpowers é um plugin do Claude Code que empacota uma biblioteca de
**skills de processo** — fluxos nomeados e reutilizáveis pras etapas de
construir software: explorar a intenção, planejar, implementar, debugar,
revisar, finalizar um branch. É diferente de uma skill de *implementação*
(que ensina uma tecnologia específica) — skills de processo ficam **acima**
delas: decidem quando e como você aborda uma tarefa, antes de qualquer
skill de domínio decidir o que escrever.

**Instale:**

```bash
/plugin marketplace add anthropics/claude-plugins-official
/plugin install superpowers@claude-plugins-official
```

**Veja funcionando:** peça algo propositalmente aberto — não um "conserte
esse typo", mas algo com mais de uma interpretação razoável. Por exemplo:

```
Adiciona um jeito de exportar relatórios na nossa API.
```

Sem Superpowers, um agente decidiria sozinho o formato, o filtro e a
autenticação — e provavelmente escolheria errado pelo menos um desses. Com
Superpowers ativo, a regra central do plugin entra em ação:

> Se uma skill pode se aplicar, mesmo que um pouco, invoque-a **antes de
> responder qualquer coisa** — inclusive antes de fazer uma pergunta de
> esclarecimento.

Na prática: em vez de já sair escrevendo código (ou até de só perguntar
"qual formato?"), o Claude Code aciona a skill `brainstorming` primeiro, e
as perguntas de esclarecimento acontecem *dentro* dela — coisas como quais
campos entram no relatório, quem pode exportar, se existe limite de
período. Se isso não acontecer — se o agente for direto pro código num
pedido claramente ambíguo — o plugin não está ativo; rode `/plugin list`
pra confirmar a instalação.

Saiba mais: [Superpowers](tools/01-superpowers.md).

### Ponytail — o que é construído

Ponytail é uma persona de disciplina de engenharia: um "engenheiro sênior
preguiçoso" — preguiçoso no sentido de eficiente, não de relapso.
Instalado como plugin, ele roda uma escada de decisão fixa antes de
qualquer código ser escrito e para no primeiro degrau que já resolve o
problema. A raiz do problema que ele contém: o modo padrão de um agente de
código é construir mais do que a tarefa pede.

A escada, do topo pro fim: isso precisa existir? já existe algo parecido
no código do projeto? a biblioteca padrão da linguagem (stdlib) já
resolve? uma feature nativa da plataforma resolve? uma dependência já
instalada resolve? cabe numa linha? só então — o mínimo de código novo que
funciona.

**Instale:**

```bash
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

**Veja funcionando:** peça algo que convida a over-engineering. Por
exemplo:

```
Adiciona um cache pras respostas dessa API externa.
```

Sem Ponytail, é fácil o agente propor uma classe de cache com TTL
configurável, invalidação manual e uma interface pra trocar de storage no
futuro — nada disso pedido, tudo especulativo. Com Ponytail ativo, a
resposta tende a vir como o cache em memória já embutido na
linguagem/framework (`@lru_cache`, ou equivalente) e uma linha só, nomeando
explicitamente o que ficou de fora: *"cache com `@lru_cache(maxsize=1000)`
na função — pulei uma classe de cache customizada, adiciono quando
`lru_cache` não bastar de verdade."* Código primeiro, no máximo três
linhas dizendo o que foi pulado e quando adicionar — esse formato é a
marca registrada do plugin ativo.

Saiba mais: [Ponytail](tools/04-ponytail.md).

### Caveman — como o agente fala sobre isso

Independente do Ponytail (que governa o que é construído), Caveman é uma
camada de compressão de comunicação: remove o enchimento de linguiça da
prosa do agente — "vou seguir em frente e...", "ótima pergunta!", "isso
pode potencialmente..." — sem remover informação. Números, unidades,
código e texto exato de erro passam intactos; palavras de negação (não,
nunca, exceto) nunca são cortadas, porque cortar uma delas muda o sentido
da frase.

**Instale:**

```bash
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
```

**Veja funcionando:** faça uma pergunta comum de desenvolvimento e compare
o tom da resposta antes/depois de instalar — ou simplesmente rode:

```
/caveman-stats
```

pra ver a economia de tokens acumulada na sessão. Se as respostas do
agente continuam cheias de "Vou verificar isso pra você!" e parágrafos de
introdução antes de qualquer fato, o plugin não pegou — confira a
instalação com `/plugin list`.

Saiba mais: [Caveman](tools/05-caveman.md).

---

O [Guia de instalação](01-installation.md) completo lista outros plugins
opcionais que valem a pena — `aia-harness`, `ui-ux-pro-max`, `hookify`,
`pr-review-toolkit`, `commit-commands`, `claude-code-setup`, `feature-dev`,
`code-review`, `claude-md-management` — mas os três acima são a base. Não
siga adiante sem eles.

## Parte 3 — Configurando seu projeto do zero

Com os três pilares instalados, é hora de sair do "Claude Code genérico"
pro "Claude Code que conhece o seu projeto". Isso significa dois arquivos:
`CLAUDE.md` na raiz do projeto, e `.claude/settings.json`.

### 1. Copie e preencha o `CLAUDE.md`

```bash
cp templates/CLAUDE.md.template CLAUDE.md
```

Abra o arquivo e substitua cada placeholder — `[PROJECT NAME]`, a seção de
Stack, os seis comandos canônicos (install, lint, typecheck, test, build,
run/dev) e a seção de Conventions — pelo que é real no seu projeto. As
"Behavioral guidelines" no topo (pensar antes de codar, simplicidade
primeiro, mudanças cirúrgicas, execução orientada a objetivo, orquestrador
em vez de implementador) já vêm prontas e genéricas o bastante pra
qualquer stack — normalmente não precisam de edição.

**A tabela de agentes especialistas.** O template já vem com um roster de
mais de vinte especialistas prontos — de `backend-specialist` a
`security-auditor`, passando por `code-reviewer`, `database-architect`,
`test-engineer` e outros — cada um com uma linha de "quando usar" que
funciona ao mesmo tempo como descrição do agente e como regra de
roteamento: quando uma tarefa bate com a descrição, é aquele especialista
que você despacha, nunca um agente genérico. É o mecanismo por trás da
Parte 4 inteira. Você não precisa manter os nomes exatamente como estão —
edite, renomeie, remova o que não se aplica ao seu domínio e adicione
qualquer especialista que seu projeto precise e que o roster genérico não
cubra. O raciocínio completo por trás disso está em [Orquestração de
subagentes](tools/02-subagent-orchestration.md).

### 2. Copie e ajuste o `.claude/settings.json`

```bash
mkdir -p .claude
cp templates/settings.json.example .claude/settings.json
```

O exemplo já vem com dois **hooks** — scripts que rodam automaticamente em
pontos específicos da sessão (antes de uma ferramenta executar, depois
dela, no início ou fim da sessão) — registrados: um `PreToolUse` no `Bash`
e um `SessionStart`, além de um bloco `env` pra variáveis como chaves de
API. Os nomes `example-command-proxy.mjs` e `example-session-banner.mjs`
são propositalmente placeholders — você escreve os `.mjs` de verdade,
seguindo a disciplina de "falhar aberto" (nunca travar a sessão inteira
por causa de um bug num hook) descrita em [Hooks — boas
práticas](tools/10-hooks-best-practices.md).

Se o hook do `PreToolUse` for um proxy de comandos — reescrever
`git status`/`git diff`/etc. pra uma versão mais barata em tokens antes de
rodar, o padrão que este toolkit chama de RTK — a explicação completa,
incluindo o leitor de stdin JSON que evita o bug clássico do
`JSON.parse("null")`, está em [Token proxy
pattern](tools/03-rtk-token-proxy.md), com o helper pronto pra copiar em
[`templates/hooks/hook-io.mjs.example`](../templates/hooks/hook-io.mjs.example).

Nunca hardcode uma chave de API dentro do `settings.json` — use a
substituição de variável de ambiente (`${EXEMPLO_API_KEY}`) e mantenha o
valor real num arquivo `.env`/`.env.local` fora do controle de versão.

### 3. (Recomendado) copie a regra de ondas paralelas

Se você pretende usar o padrão de execução em ondas paralelas da Parte
4 — e a recomendação é que use, é a parte que faz o fluxo ser rápido sem
ficar arriscado — copie também a regra pronta pro seu diretório de regras:

```bash
cp templates/rules/parallel-subagent-driven-development.md .claude/rules/
```

E referencie esse arquivo a partir do seu `CLAUDE.md` (uma linha basta,
como qualquer outra regra). Ela existe porque a skill padrão do
Superpowers pra esse estágio (`subagent-driven-development`) despacha um
implementador por vez, por segurança — essa regra documenta as condições
exatas em que despachar vários em paralelo continua seguro, com o mesmo
contrato por trás.

### 4. Memória — decida agora ou decida depois

Ainda dentro de `.claude/`, esse também é o momento natural pra decidir se
você já quer o sistema de memória leve (um índice sempre carregado, sem
nenhuma dependência externa) — mas isso pode esperar até você sentir a dor
de repetir a mesma lição pro agente numa sessão nova. A Parte 6 deste
playbook cobre as duas opções (sistema leve e Obsidian) em profundidade; o
doc dedicado do sistema leve é [Sistema de memória do
Claude](tools/09-claude-memory-system.md).

## Parte 4 — Seu primeiro fluxo de trabalho completo, ponta a ponta

Esta é a parte mais importante do playbook — o resto monta o cenário, essa
aqui é o filme inteiro rodando. Vamos usar um cenário fictício, genérico o
bastante pra servir de molde pra qualquer projeto:

> Um SaaS de gestão de pedidos tem uma API REST em produção. O time de
> operações pediu um jeito de baixar um relatório de pedidos em **CSV**
> (um formato de arquivo de texto com valores separados por vírgula,
> universal pra abrir em qualquer planilha) filtrado por período.

O pedido, do jeito que chegou, é propositalmente vago — de propósito, é
assim que pedidos de verdade chegam. O fluxo completo tem cinco etapas:

```
brainstorm  →  plano  →  implementação em ondas paralelas  →  revisão multi-agente  →  commit
```

### 1. Brainstorm — destrinchar o pedido ambíguo

```
Antes de escrever qualquer código pra isso: preciso de um jeito de
exportar um relatório de pedidos em CSV na nossa API.

Não comece a implementar. Primeiro:
- Pergunte o que falta pra fechar o escopo.
- Diga se existe mais de uma interpretação razoável pro pedido, em vez de
  escolher uma calado.
- Levante suposições que eu provavelmente tenho e não deixei explícitas —
  padrões já existentes no projeto, coisas que não devem ser tocadas,
  necessidades de performance.
```

Isso é uma adaptação direta do prompt em [Brainstorm até
plano](prompts/04-brainstorm-to-plan.md) — mas mesmo sem copiar prompt
nenhum, o Superpowers instalado na Parte 2 já empurra o Claude Code nessa
direção sozinho, porque a skill `brainstorming` (ver
[Superpowers](tools/01-superpowers.md)) roda antes de qualquer resposta
pra um pedido criativo ou ambíguo desses.

Numa sessão real, espere uma rodada de perguntas como:

- Quem pode exportar — qualquer usuário autenticado, ou só um papel
  específico?
- Quais campos entram no CSV (ID do pedido, cliente, valor, status, data)?
- O período é obrigatório? Existe um teto (30 dias, 90 dias, sem
  limite — importante pra não travar o servidor gerando um relatório de 5
  anos de uma vez)?
- O arquivo sai na hora (resposta síncrona) ou o projeto já tem um padrão
  de job assíncrono pra relatório grande?
- Formato exato — separador, encoding, primeira linha como cabeçalho?

Responda essas perguntas (ou deixe o agente assumir o caminho mais
conservador quando você não tiver uma resposta forte) antes de seguir pro
próximo passo.

### 2. Plano — virar a intenção clarificada em passos verificáveis

Com o escopo fechado, peça o plano:

```
Escopo fechado: GET /api/reports/orders/export, autenticado, aceita
`from` e `to` como query params obrigatórios, limite de 90 dias por
request, CSV com cabeçalho (id, cliente, valor, status, data), resposta
em streaming.

Agora escreva um plano de implementação passo a passo. Cada passo precisa
de uma verificação explícita — um comando, um teste, um comportamento
observável — nunca "deveria funcionar". Quebre qualquer passo sem
verificação clara em passos menores.
```

Isso aciona a skill `writing-plans` do Superpowers. Um plano razoável sai
parecido com isto — **endpoint** aqui é só o termo pra "uma rota
específica de uma API, identificada por URL e verbo HTTP":

1. Criar o endpoint e validar `from`/`to` (rejeitar período maior que 90
   dias) — verificação: teste unitário cobre período válido, período
   grande demais, e parâmetro faltando.
2. Implementar a consulta no banco com paginação/streaming — verificação:
   teste de integração com um volume grande de linhas não estoura
   memória.
3. Formatar a resposta como CSV com cabeçalho — verificação: teste
   compara cabeçalho + uma linha de exemplo, byte a byte.
4. Autorização — só papéis permitidos exportam — verificação: teste de
   integração confirma 403 pra um usuário sem permissão.
5. Atualizar a documentação da API (ou o teste de contrato, se o projeto
   tiver um) — verificação: doc/contrato reflete o endpoint novo.

Cada passo do plano já sai marcado com `Files:` (quais arquivos aquele
passo toca) e `Depends-on:` (quais outros passos ele precisa que já
existam) — são exatamente os dois campos que a próxima etapa usa pra
decidir o que pode rodar em paralelo.

### 3. Implementação — subagent-driven-development em ondas paralelas

Com os passos do plano marcados, a execução vira uma sequência de
**ondas** — grupos de tasks que rodam ao mesmo tempo porque não têm
arquivo em comum nem dependência entre si. O mecanismo completo está em
[Orquestração de subagentes](tools/02-subagent-orchestration.md); a
versão resumida, aplicada ao nosso cenário:

| Task | Descrição | `Files:` | `Depends-on:` | Especialista |
|---|---|---|---|---|
| T01 | Endpoint + lógica de exportação | `app/api/reports/orders/export/route.ts`, `server/reports/export-orders.ts` | none | `backend-specialist` |
| T02 | Testes de formatação CSV e validação de período | `server/reports/export-orders.test.ts` | none | `test-engineer` |
| T03 | Índice de banco pra consulta por período | `db/schema/orders.ts` + migration | none | `database-architect` |
| T04 | Botão "baixar CSV" no painel | `components/reports-panel.tsx` | **T01** | `frontend-specialist` |
| T05 | Atualizar doc/contrato da API | `docs/api/reports.md` | **T01** | `documentation-writer` |

T01, T02 e T03 não dependem uma da outra e não tocam nenhum arquivo em
comum — vão pra **Onda 1**, disparadas juntas. T04 e T05 dependem do
contrato que T01 define (a URL e os parâmetros reais do endpoint), então
esperam a Onda 1 terminar e formam a **Onda 2** — mesmo sem conflito de
arquivo entre si, a dependência já bastaria pra adiar as duas.

Prompt real pra disparar a Onda 1 (adaptado de [Parallel wave
dispatch](prompts/05-parallel-wave-dispatch.md)):

```
Execute a Onda 1 do plano acima: T01, T02 e T03, despachadas juntas na
mesma mensagem, um especialista por task. Nenhum implementador commita —
cada um só implementa, testa o que é seu, e reporta exatamente quais
arquivos mudou. Eu, como orquestrador, commito depois — uma task por vez,
na ordem T01 → T02 → T03, capturando o HEAD atual bem antes de cada
commit.
```

Depois que a Onda 1 está implementada e commitada, a Onda 2 (T04, T05)
roda do mesmo jeito — só que agora com o contrato real de T01 disponível
pros dois especialistas consumirem.

### 4. Revisão — painel multi-agente antes de fechar

Antes de considerar qualquer onda pronta, ela passa por revisão — nunca
autoavaliada pelo mesmo agente que implementou. Prompt real (adaptado de
[Code review multi-agente](prompts/03-multi-agent-code-review.md)):

```
Revise o diff da Onda 1 (T01, T02, T03) usando um painel de revisores
independentes, em paralelo, num único lote: code-reviewer,
security-reviewer, typescript-reviewer, e database-architect pra revisar
o índice novo. Nenhum revisor vê o achado dos outros. Depois que todos
reportarem, sintetize: junte achados duplicados, descarte qualquer coisa
sem cenário concreto de falha, e ranqueie por severidade — CRITICAL,
HIGH, MEDIUM, LOW.
```

Num endpoint novo de exportação, achados plausíveis desse painel incluem
coisas como: `security-reviewer` pegando uma checagem de autorização que
ficou só no frontend e não no backend; `typescript-reviewer` pegando um
tipo genérico demais escondido no formatador de CSV; `code-reviewer`
notando que o passo 4 do plano (autorização) não tem teste cobrindo o
caso 403. Cada achado sai no formato `arquivo:linha — severidade — a
alegação — o cenário exato que quebra`. Nada sobrevive à síntese sem esse
último campo.

Corrija o que for CRITICAL/HIGH antes de seguir; MEDIUM/LOW ficam a
critério.

### 5. Commit — um por task, em ordem

O orquestrador — você, na sessão principal — faz o commit, nunca o
subagente que implementou. Um commit por task, na ordem da onda, HEAD
capturado na hora:

```
Onda 1 aprovada nas duas revisões. Commite T01, T02 e T03 em ordem — uma
mensagem por task, no padrão conventional commits, capturando o HEAD
atual imediatamente antes de cada commit.
```

O resultado esperado é uma sequência de commits pequenos e rastreáveis,
não um commit gigante misturando três tasks:

```
feat: add CSV export endpoint for order reports
test: cover CSV formatting and date-range validation
perf: add index for order export date-range query
```

Repita esse ciclo de cinco passos pra Onda 2, e o pedido original —
"adiciona um jeito de exportar relatórios" — sai do vago pra produção sem
nenhuma etapa pulada.

## Parte 5 — Qualidade contínua

Depois que o fluxo da Parte 4 vira rotina, a próxima pergunta é: como
travar qualidade sem travar a equipe? A resposta deste toolkit é rodar
dois **linters** — ferramentas que analisam o código em busca de padrões
problemáticos sem executá-lo — cada um cobrindo uma fatia diferente:

```bash
npm install --save-dev eslint
npm install --save-dev --save-exact @biomejs/biome
```

O Biome fica com um conjunto pequeno e escolhido a dedo de regras (não o
preset "recommended" inteiro, que vem com cerca de 200 regras); o ESLint
(com `typescript-eslint` ou o plugin do seu framework) cobre o resto —
regras que precisam de informação de tipo, regras específicas de
framework, tudo que o conjunto curado do Biome deixa de fora de
propósito. Sobreposição entre os dois só significa duas configs pra
manter sincronizadas pela mesma regra — por isso a divisão é deliberada,
não acidental.

### Regra nova nunca nasce bloqueando

Uma regra de lint nova não vira erro no mesmo commit que a introduz — isso
ou trava todo mundo de uma vez, ou alguém desliga a regra por frustração.
Em vez disso, ela nasce em `"warn"` pra base inteira do código, o que
torna toda violação já existente visível sem quebrar o build de ninguém. A
contagem de warnings vira um número real e rastreável — não um comentário
de "depois a gente aperta isso" que ninguém revisita. Só quando essa
contagem chega a zero a regra sobe pra `"error"` e fica lá.

```js
// eslint.config.js (trecho)
export default [
  {
    rules: {
      // Regra nova, lançada em "warn" pra contagem ficar visível sem
      // bloquear ninguém. Sobe pra "error" quando bater zero.
      complexity: ["warn", 10],
    },
  },
];
```

Pra zerar uma contagem de warnings de verdade — sem transformar "só
conserta os avisos" num refactor silencioso enorme — use o prompt em
[ESLint warning burndown](prompts/02-eslint-warning-burndown.md). Ele
força uma decisão explícita antes de tocar em qualquer código: corrigir
tudo, corrigir a maioria e rastrear o resto como dívida visível, ou
reescopar a regra em si — o que é uma mudança de configuração, e precisa
ser tratada como tal, nunca disfarçada de "código mais limpo".

Detalhes completos da divisão ESLint/Biome, o formatter desligado de
propósito, e os gotchas de regras específicas: [Quality gates
ESLint/Biome](tools/06-eslint-biome-quality-gates.md).

## Parte 6 — Memória de longo prazo

Sem memória entre sessões, um agente reaprende do zero a mesma lição cara
toda vez que abre o projeto — o mesmo bug já corrigido antes, a mesma
decisão de arquitetura que só faz sentido depois de ver o que foi tentado
e rejeitado. Duas opções cobrem isso, e elas não competem entre si.

### Opção 1 — sistema leve (sempre comece por aqui)

Um índice pequeno (`MEMORY.md`), sempre carregado no início da sessão, com
uma linha por memória apontando pra um arquivo de tópico com frontmatter
(`type: feedback | architecture | business-rule | reference`). Zero
dependência externa — só arquivos. O teste pra decidir se algo merece
virar memória: *uma sessão futura ficaria surpresa e grata de saber disso
antes de começar a trabalhar?* Se não, não salva. Critério completo e
estrutura: [Sistema de memória do Claude](tools/09-claude-memory-system.md).

### Opção 2 — Obsidian (memória de longo prazo sem limite de tamanho)

Um vault Obsidian — arquivos Markdown organizados numa convenção de
pastas — acessado só através de um **servidor MCP** (um processo que
expõe operações estruturadas do vault como ferramentas, em vez de acesso
direto ao sistema de arquivos), o que garante que toda escrita passa por
validação: frontmatter obrigatório, um template por pasta, links que
precisam apontar pra notas que realmente existem. Detalhes: [Obsidian
como memória](tools/08-obsidian-memory.md).

### Por que as duas camadas juntas são o ideal

O índice leve tem que ficar pequeno pra continuar sendo lido — um teto de
mais ou menos 130 linhas é o ponto onde ele começa a virar ruído em vez de
sinal. A maior parte do que vale a pena lembrar sobre um projeto não cabe
nesse espaço: é específico demais, raro demais, ou grande demais. É pra
isso que serve o vault — buscado sob demanda, sem limite de tamanho.
Existe até um caminho de migração formal de um pro outro (buscar
duplicata → casar o template da pasta de destino → criar → confirmar
lendo de volta → só então apagar do índice leve) — nunca um "apaga e
espera não precisar de novo".

Pra configurar as duas camadas num projeto novo (ou fazer o retrofit num
que já existe), use o prompt pronto em [Memory
bootstrap](prompts/06-memory-bootstrap.md).

## Parte 7 — Extras opcionais

Dois CLIs standalone — não são plugins do Claude Code, instalam com o
gerenciador de pacotes que você já usa — que valem a pena uma vez que o
fluxo básico das Partes 1 a 6 já está rodando.

### Graphify — navegação de código em projetos grandes

Transforma uma pasta de código (ou docs, papers, imagens) num grafo de
conhecimento persistente — detecção de comunidades, nós centrais, relações
entre arquivos — pra responder "o que chama isso", "quais módulos são
centrais", "o que quebra se eu mudar aqui" numa consulta só, em vez de
dezenas de leituras exploratórias repetidas a cada sessão nova.

```bash
pip install graphifyy
# ou
uv tool install graphifyy
```

O pacote no PyPI é `graphifyy`, com dois "y" — o comando que ele instala é
`graphify`, com um só. Nenhuma chave de API é necessária pra um corpus só
de código: a extração é baseada em AST (a árvore sintática do código,
extraída sem executar nada) e roda inteiramente local.

Saiba mais: [Graphify](tools/07-graphify.md).

### agent-browser — automação de navegador pra agentes

Um CLI nativo (não é um wrapper de Playwright/Puppeteer) que controla um
Chrome/Chromium de verdade via protocolo DevTools, construído pra agentes
de IA em vez de adaptado de uma ferramenta de teste feita pra humanos —
trabalha em cima de snapshots de árvore de acessibilidade com referências
curtas e estáveis (`@e1`, `@e2`...), o que aguenta muito melhor mudanças
de layout do que um seletor CSS.

```bash
npm i -g agent-browser
agent-browser install
```

Saiba mais: [agent-browser](tools/11-agent-browser.md).

## Checklist final: setup completo

- [ ] Claude Code instalado e autenticado (`npm install -g @anthropic-ai/claude-code`, `claude --version` funcionando)
- [ ] Superpowers instalado e testado com um pedido ambíguo
- [ ] Ponytail instalado e testado com um pedido que convida over-engineering
- [ ] Caveman instalado e testado (`/caveman-stats` mostrando economia de tokens)
- [ ] `CLAUDE.md` copiado do template e preenchido — stack, comandos canônicos, tabela de agentes ajustada ao seu projeto
- [ ] `.claude/settings.json` copiado do exemplo, hooks reais escritos (ou removidos, se ainda não forem usados)
- [ ] (Se for usar ondas paralelas) `parallel-subagent-driven-development.md` copiado pra `.claude/rules/` e referenciado no `CLAUDE.md`
- [ ] Fluxo completo — brainstorm → plano → implementação em ondas → revisão multi-agente → commit — rodado pelo menos uma vez, ponta a ponta
- [ ] ESLint + Biome configurados, com a divisão curado/bulk decidida
- [ ] Pelo menos uma regra nova rodando em modo warn→error
- [ ] Sistema de memória leve (`MEMORY.md` + pasta de tópicos) configurado
- [ ] (Opcional) Vault Obsidian + servidor MCP configurado
- [ ] (Opcional) Graphify instalado, se o projeto for grande o bastante pra precisar
- [ ] (Opcional) agent-browser instalado, se o projeto envolver automação de navegador

## Perguntas frequentes e troubleshooting

**E se eu já tenho ESLint configurado?**
Não precisa jogar nada fora. O Biome entra do lado, com um conjunto
pequeno e deliberado de regras que não pega o que o seu ESLint já cobre —
a ideia inteira da Parte 5 é dividir trabalho entre os dois, não
substituir um pelo outro. E qualquer regra nova, seja no Biome ou no
ESLint, nasce em `"warn"` independente de o projeto ser novo ou ter dez
anos de histórico — é assim que se evita transformar a adoção num dia de
build quebrado pra todo mundo.

**Preciso usar tudo isso ou posso escolher só uma parte?**
Pode escolher. Cada peça entrega valor sozinha — é modular de propósito.
Mas o ganho real é o composto: sozinho, o sistema de memória é uma
conveniência menor; junto com orquestração de subagentes e os portões de
qualidade, vira outro jeito de trabalhar. Se for adotar uma coisa só,
adote Superpowers — é a que mais muda o resultado, porque é ela que
garante que o resto do fluxo (planejar antes de implementar, revisar antes
de fechar) realmente acontece em vez de ser pulado sob pressão de tempo.

**Funciona com Codex também?**
Boa parte sim. Os prompts em `docs/prompts/` e as regras em
`templates/rules/` não dependem de ferramenta nenhuma — funcionam com
qualquer agente que leia um arquivo de instruções e execute comandos,
Codex incluso. O que não porta direto são os plugins, hooks e skills
específicos do Claude Code (Superpowers, Ponytail, Caveman, os hooks da
Parte 3) — isso é a implementação, não a ideia. Mas a ideia por trás de
cada um — brainstorm antes de codar, uma persona de lazy-engineering, um
`CLAUDE.md` equivalente — dá pra replicar manualmente em qualquer agente
que aceite instruções persistentes.

**Isso deixa o Claude Code mais lento?**
No fluxo do dia a dia, não — o efeito líquido costuma ser o oposto. A
maior parte do que este playbook adiciona ou não tem custo nenhum (hooks
interceptam *antes* de o modelo ver a chamada, então o proxy de tokens é
ganho puro) ou economiza mais tempo do que consome (menos leituras
exploratórias repetidas graças ao Graphify, menos retrabalho porque o
escopo foi fechado antes de implementar). A exceção honesta é despachar
vários subagentes: isso usa mais tokens no total, porque cada especialista
tem seu próprio contexto, em troca de terminar mais rápido no relógio de
parede e com revisão melhor — uma troca deliberada, não um efeito
colateral. Graphify e Obsidian são opt-in — se o seu projeto não é grande
o bastante pra precisar, o custo de não instalar nenhum dos dois é zero.

**O que exatamente é um "subagente"?**
Uma sessão separada do Claude Code, disparada pela sessão principal pra
executar uma tarefa específica, com contexto próprio — ela não vê o
histórico da conversa principal, só o que foi escrito explicitamente no
prompt que a disparou. É por isso que a Parte 3 insiste tanto na tabela de
especialistas do `CLAUDE.md`: cada subagente precisa de instruções
autossuficientes, porque não herda nada por osmose.

**Os plugins não instalam / o marketplace não é encontrado — e agora?**
Confirme a versão do Claude Code primeiro (`claude --version`) — plugins
exigem uma versão relativamente recente do CLI. Depois, confirme que o
marketplace foi realmente adicionado antes do install:

```bash
/plugin marketplace list
```

Se o marketplace não aparecer na lista, repita o `add` com a URL exata da
tabela da Parte 2 — um typo no nome do repositório (`usuário/repo`) é o
erro mais comum.

## Próximos passos

Esse playbook cobre o caminho principal — dá pra rodar um projeto inteiro
só com o que está aqui. Pra ir além:

- **[Token proxy — o padrão do RTK](tools/03-rtk-token-proxy.md)** — não é
  algo que se instala (é um padrão, não um pacote publicado), mas é o
  hook que fecha o assunto "sessões longas ficam caras" mencionado na
  Parte 1. Vale ler antes de escrever seus próprios hooks na Parte 3.
- **[Sanitização de projeto](prompts/01-project-sanitation.md)** — um bom
  segundo prompt pra rodar depois que o fluxo da Parte 4 já é rotina: uma
  passada de limpeza no projeto que mede antes de agir, em vez de assumir
  a gravidade de cada achado.
- Releia [Visão geral](00-overview.md) depois de já ter rodado o fluxo
  completo pelo menos uma vez — faz mais sentido em retrospecto do que na
  primeira leitura.
- Os créditos no [README](../README.md) apontam pros projetos originais
  por trás de cada plugin — Superpowers, Ponytail, Caveman, aia-harness.
  Vale conhecer o trabalho original de cada autor.
