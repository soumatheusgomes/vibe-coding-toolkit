# Graphify

Graphify é uma CLI (interface de linha de comando — um programa que você controla digitando comandos no terminal, sem tela gráfica) standalone escrita em Python. O pacote no PyPI (o repositório oficial de pacotes Python — de lá vem o `pip install`) se chama `graphifyy`, com dois "y" mesmo — não é erro de digitação neste documento. O comando que fica disponível no seu terminal depois de instalado, porém, tem só um "y": `graphify`.

**Graphify não é um plugin do Claude Code.** É uma ferramenta separada e funciona do mesmo jeito não importa qual agente de IA (Claude Code, Cursor, Codex CLI, Gemini CLI, ou nenhum agente — só você, no terminal) está por trás do comando.

## O que é

Graphify pega uma pasta — código-fonte, documentação, artigos, imagens ou até vídeo — e transforma tudo isso num grafo de conhecimento persistente (persistente = fica salvo em disco entre uma sessão e outra, não precisa ser refeito do zero toda vez). Um grafo de conhecimento é uma coleção de nós (arquivos, funções, conceitos) ligados por relações nomeadas ("importa", "usa", "chama", "referencia"). Três coisas tornam isso mais útil do que um diagrama estático:

1. **Detecção de comunidades** — agrupa automaticamente arquivos e conceitos relacionados, revelando a arquitetura real do projeto (que nem sempre bate com a estrutura de pastas).
2. **Trilha de auditoria** — cada relação do grafo vem marcada como diretamente extraída ou inferida/ambígua, então você sabe o quanto confiar em cada resposta antes de agir em cima dela.
3. **Três formatos de saída** — um grafo HTML interativo pra explorar visualmente, um grafo em JSON pronto pra GraphRAG (uma variação de RAG — *Retrieval-Augmented Generation*, a técnica de buscar contexto relevante antes de gerar uma resposta — que busca esse contexto navegando relações num grafo em vez de só comparar similaridade de texto), e um relatório em linguagem simples, legível por qualquer pessoa do time.

## Por que usar

Sem um grafo, todo agente de IA precisa redescobrir a estrutura de um projeto do zero em cada sessão nova — grep atrás de grep, leitura ampla atrás de leitura ampla — só pra responder perguntas básicas como "o que chama essa função" ou "o que quebra se eu mudar esse arquivo". Isso é lento e caro em tokens (as unidades de texto que um modelo de IA processa — e que você paga a cada mensagem), e o pior: se repete inteiro a cada sessão, porque nada do que foi descoberto antes fica guardado em lugar nenhum.

Um grafo persistente responde esse tipo de pergunta numa consulta só, em vez de dezenas de leituras exploratórias — e continua atualizado com uma atualização incremental (reprocessa só o que mudou) em vez de uma reconstrução completa a cada vez.

## Como instalar

```bash
pip install graphifyy
# ou, com uv (gerenciador de pacotes Python mais rápido que o pip):
uv tool install graphifyy
```

Confirme que instalou certo:

```bash
graphify --version
```

Não precisa de nenhuma chave de API pra indexar um corpus (o conjunto de arquivos analisados) que seja só código — a extração aí é baseada em AST (*Abstract Syntax Tree*, "árvore de sintaxe abstrata": a representação estruturada que um compilador ou parser gera a partir do código-fonte) e roda 100% local, sem chamar nenhuma IA. Uma LLM (*Large Language Model*, modelo de linguagem grande — o tipo de IA por trás do Claude, GPT e afins) só entra em cena pra extração semântica de material que **não** é código — documentação, artigos, imagens. E mesmo aí, o Graphify pode usar o próprio agente de IA que está chamando ele (o Claude Code, por exemplo) em vez de exigir que você configure uma chave de API separada só pra isso.

## Comandos principais

| Comando | O que faz |
|---|---|
| `graphify extract <caminho>` | Roda o pipeline completo numa pasta: extração, agrupamento em comunidades, relatório e grafo. |
| `graphify update <caminho>` | Incremental — re-extrai só os arquivos que mudaram desde a última rodada. |
| `graphify cluster-only <caminho>` | Refaz só o agrupamento em comunidades, sem re-extrair nada — mais barato quando só a organização mudou. |
| `graphify query "<pergunta>"` | Travessia do grafo com orçamento limitado (não varre tudo) que responde a uma pergunta em linguagem natural. |
| `graphify path "<A>" "<B>"` | Caminho mais curto de relação entre dois conceitos nomeados. |
| `graphify explain "<conceito>"` | Explicação focada, em linguagem simples, de um nó específico do grafo. |
| `graphify export <formato>` | Exporta o grafo — formatos aceitos: `html`, `obsidian`, `wiki`, `svg`, `graphml`. |
| `graphify export neo4j` / `graphify export falkordb` | Envia o grafo direto pra um banco de grafos Neo4j ou FalkorDB. |
| `graphify --mcp` | Roda o Graphify como servidor MCP (*Model Context Protocol* — um protocolo que expõe operações como ferramentas estruturadas pra um agente chamar, em vez de comandos de shell soltos). |
| `graphify watch <caminho>` | Reconstrói automaticamente sempre que um arquivo muda. |
| `graphify add <url>` | Ingere o conteúdo de uma URL no corpus, somando aos arquivos locais já indexados. |

## Tutorial passo a passo

Vamos indexar um projeto de exemplo do zero, rodar duas consultas, e ver o formato da saída. O projeto de exemplo aqui é genérico — um catálogo de livros — mas os passos valem pra qualquer pasta de código.

### 1. Instale

```bash
pip install graphifyy
```

### 2. Rode o pipeline completo

Na raiz do projeto que você quer indexar:

```bash
cd catalogo-livros
graphify extract .
```

Isso varre os arquivos, extrai entidades e relações, detecta comunidades, e escreve os três formatos de saída numa pasta `graphify-out/`. Você deve ver algo parecido com isto no terminal:

```
Scanning catalogo-livros/ ...
  187 files found, 142 eligible for extraction
Extracting entities (AST)...
Detecting communities...
  6 communities found
Writing graphify-out/ ...
Done in 8.4s.
```

Em projetos pequenos/médios isso leva de segundos a poucos minutos, dependendo do tamanho.

### 3. Veja o que foi gerado

```bash
ls graphify-out/
```

```
graphify-out/
├── graph.html         # grafo interativo — abra num navegador
├── graph.json         # grafo em JSON, pronto pra GraphRAG
└── GRAPH_REPORT.md     # relatório em linguagem simples
```

### 4. Faça uma pergunta ao grafo

```bash
graphify query "o que depende do serviço de pedidos?"
```

O Graphify devolve uma resposta direta, citando os nós envolvidos — bem mais barato do que pedir pro agente ler vários arquivos inteiros só pra montar a mesma resposta na mão.

### 5. Explore um conceito específico

```bash
graphify explain "OrderService"
```

Devolve uma explicação focada só naquele nó: o que ele é, onde está definido no código, e com o que se conecta. O formato exato está na próxima seção.

## Exemplos

### Exemplo 1 — `graphify explain`, olhando um nó específico

```bash
graphify explain "OrderService"
```

Formato típico de saída:

```
Node: OrderService
  Source:    services/orders.py L84
  Community: 3
  Degree:    12

Connections (12):
  --> PaymentGateway [uses] [EXTRACTED]
  --> InventoryRepository [uses] [EXTRACTED]
  --> OrderValidationError [raises] [INFERRED]
  <-- api/routes.py [imports] [EXTRACTED]
  ...
```

As tags `[EXTRACTED]` e `[INFERRED]` no fim de cada linha são a trilha de auditoria mencionada lá em cima: `[EXTRACTED]` veio direto da árvore de sintaxe do código (alta confiança); `[INFERRED]` foi deduzido — vale conferir antes de confiar cegamente numa resposta que dependa dela.

### Exemplo 2 — `graphify path`, a relação entre dois conceitos

```bash
graphify path "OrderService" "NotificationQueue"
```

Formato típico de saída:

```
Shortest path (3 hops):
  OrderService --uses--> EventBus --publishes--> OrderCreatedEvent
  --consumed by--> NotificationQueue
```

Útil pra responder "como essas duas partes do sistema se conectam" sem precisar abrir os arquivos dos dois lados e montar a ligação manualmente.

### Exemplo 3 — atualização incremental depois de editar código

```bash
graphify update .
```

Formato típico de saída:

```
Re-extracting 3 changed files...
  services/orders.py
  services/notifications.py
  tests/test_orders.py
Clustering unchanged — no new communities detected.
Done in 2.1s.
```

Só os arquivos que mudaram desde a última extração são reprocessados. É isso que torna viável rodar isso automaticamente depois de cada commit — o que nos leva à próxima seção.

## Automação com hooks de git

Depois que um grafo já existe, hooks (scripts que o Git roda sozinho em certos pontos do fluxo, sem você precisar disparar nada manualmente) de `post-commit` e `post-checkout` conseguem disparar uma atualização incremental automaticamente, em segundo plano, depois de cada commit ou troca de branch — sem bloquear, então isso nunca adiciona demora ao commit ou ao checkout em si.

Escreva o arquivo do hook sem extensão, usando só `import()` dinâmico (nunca um `import`/`export`/`require` no topo do arquivo) — é isso que permite que o mesmo arquivo funcione tanto se o repositório de destino resolver como CommonJS quanto como ESM (os dois formatos de módulo do JavaScript):

```js
#!/usr/bin/env node
// .git/hooks/post-commit e .git/hooks/post-checkout — o mesmo arquivo.
(async () => {
  const { existsSync } = await import("node:fs");
  const { execFile } = await import("node:child_process");

  // Pula enquanto um rebase/merge/cherry-pick estiver em andamento.
  const midOperation = [
    ".git/rebase-merge",
    ".git/rebase-apply",
    ".git/MERGE_HEAD",
    ".git/CHERRY_PICK_HEAD",
  ].some(existsSync);
  if (midOperation) process.exit(0);

  const child = execFile("graphify", ["update", "."], {
    detached: true,
    stdio: "ignore",
  });
  child.unref(); // commit/checkout retorna imediatamente
})();
```

## Hook de orientação

Um padrão complementar aos hooks de git acima, mas independente deles: um hook de `PreToolUse` (roda antes de uma ferramenta do agente ser executada) que nunca bloqueia nada — só orienta.

- Se ainda não existe grafo e esse é o primeiro toque do agente no repositório nessa sessão → dispara sozinho uma build em segundo plano, desacoplada. Usa a criação de uma pasta como trava atômica (uma trava simples e "tudo ou nada": ou você consegue criar a pasta, ou ela já existe e você desiste), pra duas chamadas concorrentes não disputarem uma build duplicada.
- Se o grafo já existe → lembra gentilmente o agente de consultá-lo antes de um grep ou leitura ampla e crua — mais barato e mais preciso do que redescobrir a estrutura do zero.

```js
#!/usr/bin/env node
// Hook PreToolUse — só consultivo (advisory), nunca bloqueia.
(async () => {
  const fs = await import("node:fs");
  const { execFile } = await import("node:child_process");

  const GRAPH = "graphify-out/graph.json";
  const LOCK = "graphify-out/.building";

  if (fs.existsSync(GRAPH)) {
    console.error(
      'graphify-out/graph.json já existe — tente `graphify query "<pergunta>"` ' +
        "antes de um grep/leitura ampla e crua."
    );
    process.exit(0);
  }

  try {
    fs.mkdirSync(LOCK); // atômico: uma segunda chamada concorrente falha aqui
  } catch {
    process.exit(0); // outra chamada já reservou a build
  }

  execFile("graphify", ["extract", "."], { detached: true, stdio: "ignore" }).unref();
  process.exit(0);
})();
```

Veja [Boas práticas de hooks](10-hooks-best-practices.md) pras regras gerais que os dois hooks acima seguem — falhar aberto (nunca travar a sessão do desenvolvedor por causa de um hook quebrado), nunca bloquear esperando uma tarefa lenta em segundo plano, e manter a mensagem consultiva curta.

## Dicas e pegadinhas

**O nome do pacote e o nome do comando são diferentes.** `pip install graphifyy` (dois "y"), mas o comando no terminal é `graphify` (um "y"). Fácil de digitar errado nos dois sentidos.

**Não configure nenhum provedor de LLM à toa.** Você só precisa de uma chave de API (ou de deixar o Graphify usar o agente que está chamando ele) se o seu corpus tiver material fora de código — documentação, artigos, imagens. Um repositório só de código não pede nada disso.

**`cluster-only` é bem mais barato que `extract`/`update`** quando só a organização mudou, não a lógica em si — por exemplo, depois de mover arquivos de lugar sem tocar no conteúdo. Use pra reagrupar sem gastar tempo reprocessando tudo.

**O hook de orientação é consultivo, não é uma trava de verdade.** Ele lembra o agente de consultar o grafo primeiro, mas não impede um grep cru se o agente decidir ignorar a dica. Não trate isso como uma garantia rígida.

**A trava atômica pode ficar órfã.** Se o processo de build crashar no meio do caminho, a pasta `graphify-out/.building` pode continuar existindo mesmo sem nenhuma build rodando de verdade — isso trava atualizações futuras silenciosamente. Se as atualizações automáticas pararem de acontecer sem motivo aparente, confira se essa pasta ficou pra trás e apague-a manualmente.

**`graphify watch` pode pesar em repositórios grandes**, porque reconstrói a cada mudança de arquivo. Em monorepos ou bases de código muito grandes, considere apontar o `watch` pra uma subpasta específica em vez da raiz inteira.

## Perguntas frequentes

**Preciso de chave de API pra usar o Graphify?**
Não, se o seu corpus for só código — a extração aí é local, via AST. Uma chave (ou o próprio agente chamador) só entra em cena pra material fora de código.

**O Graphify funciona só com o Claude Code?**
Não. É uma CLI standalone — funciona com qualquer agente de IA capaz de rodar comandos de terminal, ou até sem nenhum agente, direto por você.

**O grafo fica desatualizado se eu editar código sem rodar nada?**
Sim, até você rodar `graphify update` — manual ou automaticamente, via os hooks de git descritos acima.

**Posso usar isso num monorepo gigante?**
Pode, mas considere indexar subpastas específicas em vez da raiz inteira, principalmente se for usar `watch`, pra manter as reconstruções rápidas.

**O que significa uma relação estar marcada como `INFERRED`?**
Que ela não veio direto da árvore de sintaxe do código — foi deduzida (por exemplo, uma relação semântica entre dois conceitos que nunca se referenciam literalmente no texto). Vale mais cautela antes de tratar isso como fato certo, ao contrário de uma relação `EXTRACTED`.

**Dá pra usar o Graphify como servidor MCP em vez de CLI?**
Dá — `graphify --mcp` roda ele como servidor MCP (stdio), expondo os mesmos comandos como ferramentas estruturadas que um agente pode chamar diretamente, sem passar por shell.
