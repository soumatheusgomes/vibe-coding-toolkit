# Skills oficiais da Anthropic

## O que é

Uma **Agent Skill** ("skill" — habilidade: uma capacidade nova que o agente ganha) é uma pasta com um arquivo de instruções — `SKILL.md` — e, opcionalmente, scripts e outros recursos (modelos, exemplos, referências) que ensinam um agente de IA a fazer bem uma tarefa específica e repetível: gerar um documento seguindo um padrão visual, seguir um fluxo de análise de dados específico do seu time, ou automatizar uma tarefa pessoal recorrente. A diferença central pra uma instrução qualquer colada no meio de uma conversa é que uma skill fica **carregada sob demanda**: só entra na janela de contexto (o quanto de texto o modelo consegue "ver" de uma vez, que você paga a cada mensagem) quando o pedido do usuário realmente bate com ela — nunca fica sempre ativa ocupando espaço à toa, mesmo quando ninguém está usando aquela capacidade naquele momento.

[`anthropics/skills`](https://github.com/anthropics/skills) é o repositório público e oficial da Anthropic com esse tipo de pacote — mantido pela própria empresa por trás do Claude, não por terceiros. No momento em que este documento foi escrito, o repositório tinha **169.519 estrelas e 20.179 forks** no GitHub — [confira o número atual](https://github.com/anthropics/skills) — um dos totais mais altos entre repositórios de IA, sinal de quanta gente já usa ou pelo menos acompanha esse projeto de perto.

### Skill, plugin e servidor MCP não são a mesma coisa

Os três aparecem juntos com frequência no vocabulário do Claude Code, mas resolvem problemas diferentes:

| Conceito | O que é | Onde roda |
|---|---|---|
| **Skill** | Uma pasta de instruções (+ scripts/recursos opcionais), carregada só quando o pedido do usuário bate com ela | Dentro do próprio agente — usa as ferramentas que ele já tem (terminal, leitura/escrita de arquivo...), sem processo externo nenhum |
| **Plugin** | Um pacote instalável que pode empacotar **várias** skills, comandos de barra ("/") e hooks (scripts que rodam automaticamente antes/depois de uma ação do agente) juntos, numa instalação só | Registrado uma vez no Claude Code; ativa tudo que ele empacota de uma vez |
| **Servidor MCP** (*Model Context Protocol* — um protocolo padronizado que expõe ferramentas e dados de fora pra um agente de IA) | Um programa **externo e separado**, que dá acesso a uma ferramenta ou fonte de dados de fora — um servidor do GitHub, de documentação de biblioteca, de um banco de dados | Fora do agente, como um processo à parte — o agente se conecta a ele pelo protocolo, nunca roda o código dele diretamente |

Na prática, este próprio repositório mistura os dois primeiros conceitos: cada skill individual (`docx`, `skill-creator`, e por aí vai) é só uma pasta com um `SKILL.md`, mas pra instalar no Claude Code elas vêm agrupadas dentro de **plugins** — cada plugin empacotando várias skills relacionadas de uma vez (detalhes na seção "Como instalar/ativar" abaixo).

### O repositório que documenta o próprio formato

Além de trazer skills prontas, `anthropics/skills` é a referência do formato **`SKILL.md`** em si — a mesma estrutura de arquivo que já sustenta outras skills vendorizadas (copiadas pra dentro do próprio projeto) documentadas neste toolkit: o [Graphify](07-graphify.md) traz uma em `.claude/skills/graphify/SKILL.md`, o [agent-browser](11-agent-browser.md) traz outra em `.claude/skills/agent-browser/SKILL.md`. `SKILL.md` segue um **padrão aberto** (*open standard* — uma especificação pública, não amarrada a uma ferramenta só), documentado em [agentskills.io](https://agentskills.io) e usável por qualquer agente de IA compatível, não só o Claude Code — confirmado na [documentação oficial do Claude Code](https://code.claude.com/docs/en/skills), que usa exatamente esse padrão como base e adiciona recursos próprios em cima dele.

O formato mínimo de um `SKILL.md` tem só dois campos de fato relevantes num bloco de metadados (*frontmatter*) em YAML — um formato de dados legível, comum em arquivo de configuração — entre `---`: `name` (identificador da skill) e `description` (o que ela faz e quando usar — o texto que o agente lê pra decidir se aquela skill bate com o pedido atual). Depois do frontmatter vem o corpo em Markdown, com as instruções de verdade:

```yaml
---
name: nome-da-skill
description: O que essa skill faz e quando o agente deve usá-la.
---

Instruções, exemplos e boas práticas que o agente segue quando a skill está ativa.
```

## Por que usar

Instalar esse repositório especificamente — em vez de uma skill qualquer encontrada solta por aí — resolve três coisas de uma vez:

1. **Fonte oficial, mantida pela própria Anthropic.** Não é uma coleção de terceiros tentando adivinhar o formato certo — é quem define o padrão, então serve como referência confiável de "como fazer direito" antes de escrever suas próprias skills.
2. **As skills de documento Office cobrem um buraco real do dia a dia.** `docx`, `pdf`, `pptx` e `xlsx` geram e editam esses formatos de verdade — não um substituto simplificado em texto puro — então servem pra quem usa um agente de IA pra montar relatório, apresentação ou planilha e hoje precisa converter manualmente o que a IA devolve em texto solto.
3. **Duas skills "meta" ensinam a estender o próprio ecossistema.** `skill-creator` guia a criação das suas próprias skills; `mcp-builder` guia a construção do seu próprio servidor MCP (a peça externa da tabela acima). Isso fecha o ciclo: em vez de só consumir skills prontas, o repositório também ensina a fazer as suas.

Uma ressalva antes de instalar: **não existe uma licença única cobrindo o repositório inteiro** — mais detalhe em "Dicas e pegadinhas", mais abaixo.

## O que tem dentro do repositório

No total são 17 skills, divididas em três pacotes instaláveis (a divisão exata vem do [`.claude-plugin/marketplace.json`](https://github.com/anthropics/skills/blob/main/.claude-plugin/marketplace.json) do próprio repositório):

| Plugin (dentro do marketplace `anthropic-agent-skills`) | O que empacota | Skills incluídas |
|---|---|---|
| `document-skills` | As quatro skills de documento Office | `xlsx`, `docx`, `pptx`, `pdf` |
| `example-skills` | Skills de exemplo — criativas, técnicas e corporativas | `algorithmic-art`, `brand-guidelines`, `canvas-design`, `doc-coauthoring`, `frontend-design`, `internal-comms`, `mcp-builder`, `skill-creator`, `slack-gif-creator`, `theme-factory`, `web-artifacts-builder`, `webapp-testing` |
| `claude-api` | Documentação da API/SDK da Claude, pra construir aplicações com LLM (*Large Language Model*, modelo de linguagem grande — o tipo de IA por trás do Claude) | `claude-api` |

Dentro de `example-skills`, vale destacar por nome as mais citadas fora do contexto de documento:

- **`skill-creator`** — cria, edita e otimiza suas próprias skills (ver Exemplo 2 mais abaixo).
- **`mcp-builder`** — guia a construção de um servidor MCP do zero, em TypeScript ou Python (ver Exemplo 3 mais abaixo).
- **`web-artifacts-builder`** — monta Artifacts (páginas HTML renderizadas dentro do Claude/Claude.ai) mais elaborados, com React, TypeScript, Tailwind e shadcn/ui (uma coleção de componentes de interface prontos, usada em cima do Tailwind) — incluindo orientação de design pra fugir do visual genérico de IA (layout sempre centralizado, gradiente roxo, cantos todos arredondados igual).
- **`webapp-testing`** — testa aplicação web local com Playwright (framework de automação de navegador): funcionalidade de frontend, captura de tela, log do navegador.
- **`frontend-design`, `canvas-design`, `algorithmic-art`, `theme-factory`** — skills criativas e de design visual.
- **`brand-guidelines`, `internal-comms`, `doc-coauthoring`, `slack-gif-creator`** — skills voltadas a fluxo corporativo e comunicação.

Repare que o nome real é **`web-artifacts-builder`**, com o prefixo `web-` — não `artifacts-builder` sozinho.

## Como instalar/ativar

Dentro de uma sessão do Claude Code, registre o repositório como marketplace (a fonte de onde plugins podem ser instalados) e depois instale o pacote que interessa:

```bash
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
```

O primeiro comando registra o repositório do GitHub como marketplace instalável; o segundo instala o pacote `document-skills` — as quatro skills de documento Office de uma vez. Repita o `/plugin install` pra qualquer um dos outros dois pacotes, se quiser:

```bash
/plugin install example-skills@anthropic-agent-skills
/plugin install claude-api@anthropic-agent-skills
```

Também dá pra instalar pela interface, sem digitar o nome do pacote de cabeça: depois do `/plugin marketplace add`, escolha **Browse and install plugins** → **anthropic-agent-skills** → o pacote desejado → **Install now**.

Confirme o que ficou disponível na sessão atual:

```bash
/skills
```

Depois de instalado, não existe um comando específico pra "ativar" uma skill — é só pedir a tarefa normalmente, descrevendo o que você quer. O próprio Claude Code decide, pela `description` de cada skill, qual delas bate com o pedido:

```
Use a skill de PDF pra extrair os campos de formulário de relatorio.pdf.
```

Também dá pra chamar uma skill específica direto pelo nome, no formato `/nome-do-plugin:nome-da-skill` — por exemplo, `/document-skills:docx` —, em vez de descrever a tarefa e deixar o Claude Code escolher sozinho. Esse formato com dois-pontos (plugin:skill) é como o Claude Code evita que skills de plugins diferentes colidam pelo mesmo nome.

### Instalar só uma skill específica, sem o pacote inteiro

`example-skills` traz 12 skills de uma vez — se você só quer `skill-creator`, por exemplo, sem as outras 11, dá pra vendorizar (copiar pra dentro do seu próprio projeto) só a pasta daquela skill, em vez de instalar o plugin inteiro. É o mesmo padrão já usado neste toolkit pro [Graphify](07-graphify.md) e pro [agent-browser](11-agent-browser.md), só que copiando a pasta em vez de rodar um instalador:

> 💬 **Peça pro seu agente instalar:**
>
> ```
> Baixe a skill skill-creator do repositório anthropics/skills e instale no
> meu projeto: clone https://github.com/anthropics/skills.git de forma rasa
> (--depth 1) numa pasta temporária, copie só a subpasta skills/skill-creator
> para .claude/skills/skill-creator/, e apague a pasta temporária depois.
> ```
>
> O Claude Code tem acesso a terminal (Bash) e a escrita de arquivo — ele roda o clone, copia só a pasta que interessa, e confirma que funcionou. Prefere fazer você mesmo? É exatamente isto:

```bash
git clone --depth 1 https://github.com/anthropics/skills.git /tmp/anthropics-skills
mkdir -p .claude/skills
cp -r /tmp/anthropics-skills/skills/skill-creator .claude/skills/skill-creator
rm -rf /tmp/anthropics-skills
```

Uma skill de projeto (`.claude/skills/<nome>/`) é versionada com o resto do repositório — todo mundo no time que usa Claude Code nesse projeto ganha ela automaticamente. Uma ressalva: se `.claude/skills/` não existia na sua pasta antes dessa sessão do Claude Code começar, reinicie a sessão depois de criá-la — só uma pasta de skills que já existia no início da sessão é observada em tempo real; uma pasta nova, só depois de reiniciar ([fonte](https://code.claude.com/docs/en/skills)).

## Tutorial passo a passo

Vamos instalar o pacote de documentos e gerar um relatório de verdade em `.docx`, do zero. O cenário aqui é genérico — um relatório trimestral qualquer — mas o fluxo vale pra qualquer conteúdo.

### 1. Instale o pacote de documentos

```bash
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
```

### 2. Peça o relatório, descrevendo o que ele precisa ter

Dentro de um projeto qualquer, com dados à mão (uma tabela colada na conversa, uma planilha, um CSV):

```
Cria um relatório em Word (relatorio.docx) com: um sumário (TOC — table
of contents, o índice clicável no início de um documento longo) logo no
início, três seções com título de nível 1, uma tabela mostrando vendas
por trimestre, e número de página no rodapé.
```

### 3. O que acontece por trás dos panos

A `description` da skill `docx` cobre exatamente esse tipo de pedido — criar, ler, editar ou manipular documentos do Word — então o Claude Code carrega ela automaticamente, sem precisar chamar por nome. A partir daí, ela:

1. Monta o `.docx` do zero usando a biblioteca `docx` (um pacote de código já pronto, do ecossistema `npm`/Node.js, que sabe montar a estrutura interna de um arquivo Word);
2. Se o pedido fosse editar um documento já existente em vez de criar um novo, ela abriria o arquivo, mexeria direto no XML interno (`word/document.xml` — um `.docx`, por baixo dos panos, é só uma pasta de arquivos XML compactada em zip) e recompactaria;
3. Renderiza o resultado em imagem (via `pdftoppm`) só pra conferir visualmente que ficou como o pedido descreveu, antes de devolver o arquivo final.

Fonte: [`skills/docx/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/docx/SKILL.md).

### 4. Confira o arquivo gerado

Abra `relatorio.docx` num editor de verdade (Word, LibreOffice, Google Docs) e confira: sumário clicável, três seções, tabela com os números certos, número de página no rodapé. Se algo ficou errado, descreva o problema e peça o ajuste — isso vira uma edição sobre o mesmo arquivo, não uma regeneração do zero.

## Exemplos

### Exemplo 1 — planilha `.xlsx` com fórmulas, a partir de uma lista solta de dados

Cenário: você tem uma lista crua de vendas por produto, colada de algum lugar, e quer uma planilha de verdade — com fórmula, não só número já calculado por fora.

```
Instalei o pacote document-skills. Aqui está uma lista de vendas por
produto (colada abaixo). Monta uma planilha vendas.xlsx com uma aba de
detalhe (uma linha por produto) e uma aba de resumo, com fórmulas de
verdade (=SOMA, =MÉDIA) somando por categoria — não valores já
calculados na mão.
```

A skill `xlsx` monta o arquivo com fórmulas nativas do Excel — abrindo depois no Excel ou no Google Sheets, clicar numa célula de total mostra a fórmula `=SOMA(...)`, não um número estático já resolvido.

### Exemplo 2 — criar sua própria skill com `skill-creator`

Cenário: toda vez que você termina uma tarefa no seu projeto, você segue os mesmos passos manuais pra escrever a entrada de changelog (o arquivo que lista o que mudou em cada versão) — e quer transformar isso numa skill reutilizável, sua.

```
Instalei o pacote example-skills. Usa a skill skill-creator pra criar
uma skill nova: toda vez que eu terminar uma tarefa, ela deve ler o
`git diff` das mudanças e escrever uma entrada de changelog seguindo o
formato "### <data> — <resumo em uma linha>" + bullets do que mudou, no
arquivo CHANGELOG.md.
```

Em vez de escrever o `SKILL.md` na mão, `skill-creator` conduz uma espécie de entrevista antes de gerar qualquer coisa: o que a skill deve fazer, quando ela deve disparar, qual é o formato de saída esperado. Só depois disso ela escreve a estrutura de pastas (`SKILL.md` e, se precisar de código auxiliar, uma pasta `scripts/`) e sugere alguns pedidos de teste pra validar se a skill dispara e se comporta como esperado antes de considerar pronta.

### Exemplo 3 — construir um servidor MCP com `mcp-builder`

Cenário: você já tem uma API interna (de tarefas, de clientes, do que for) e quer expor as operações dela como ferramentas que qualquer agente de IA compatível com MCP consegue chamar — não só o Claude Code.

```
Instalei o pacote example-skills. Usa a skill mcp-builder pra me ajudar
a criar um servidor MCP em TypeScript que expõe minha API interna de
tarefas (listar, criar, marcar como concluída) como ferramentas.
```

`mcp-builder` guia isso em quatro fases: pesquisar e planejar o desenho da API antes de escrever qualquer código, implementar a infraestrutura e as ferramentas com formato de entrada/saída bem definido, revisar a qualidade e testar, e por fim criar *evals* (testes automatizados que checam se um LLM consegue usar aquela ferramenta corretamente) que comprovam que um agente de IA de fato consegue operar o servidor gerado.

## Dicas e pegadinhas

**Não existe uma licença única cobrindo o repositório inteiro.** Na raiz de `anthropics/skills` só existem um `README.md` e um `THIRD_PARTY_NOTICES.md` — nenhum arquivo `LICENSE` geral. Cada skill pode trazer a sua própria: as quatro skills de documento Office (`docx`, `pdf`, `pptx`, `xlsx`), por exemplo, vêm com um `LICENSE.txt` próprio, vinculado aos Termos de Serviço da Anthropic, que proíbe explicitamente extrair esses materiais pra fora dos serviços da Anthropic, copiá-los (fora de cópias temporárias geradas automaticamente durante o uso), ou criar obra derivada a partir deles. Antes de vendorizar qualquer skill deste repositório pro seu próprio projeto — principalmente as quatro de documento — vale abrir o `LICENSE.txt` daquela pasta específica primeiro. Isso não é parecer jurídico, só o que o próprio arquivo diz.

**Nem todo campo do `SKILL.md` funciona fora do Claude Code.** O padrão aberto (`agentskills.io`) e o Claude.ai/API aceitam só seis campos no frontmatter: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. O Claude Code aceita bem mais — `disable-model-invocation` (impede o agente de carregar a skill sozinho, só você chama por nome), `context: fork` (roda a skill num subagente isolado), `hooks`, `paths`, entre outros — como extensão própria dele em cima do padrão. Uma skill que só usa os seis campos do padrão funciona em qualquer lugar; uma que usa os campos extras do Claude Code é específica dele.

**Uma vez carregada, a skill fica ocupando espaço até o fim da sessão.** O conteúdo inteiro do `SKILL.md` entra na conversa como uma mensagem só e não é descartado sozinho — ele só sai de circulação se a sessão passar por uma compactação de contexto (quando o histórico fica grande demais e é resumido). Isso reforça por que manter um `SKILL.md` enxuto — e mover referência grande pra arquivos separados, carregados só quando citados — importa: é o mesmo princípio do "esboço mínimo" que o [agent-browser](11-agent-browser.md) já usa neste toolkit.

**Uma pasta `.claude/skills/` nova só é observada depois de reiniciar.** Se a pasta já existia quando a sessão do Claude Code começou, uma skill adicionada, editada ou removida ali dentro é detectada na hora, sem reiniciar nada. Se a pasta em si não existia — por exemplo, seu projeto nunca teve skill de projeto antes —, é preciso reiniciar a sessão depois de criá-la.

**As skills de documento verificam o próprio trabalho antes de devolver o arquivo.** A skill `docx`, por exemplo, renderiza o resultado em imagem antes de considerar a tarefa concluída — então não assuma que "terminou sem erro" quer dizer "ficou visualmente certo"; vale sempre abrir o arquivo final você mesmo, como no passo 4 do tutorial acima.

## Perguntas frequentes

**Isso substitui os plugins que eu já uso, tipo Superpowers ou Ponytail?**
Não — são conceitos diferentes que coexistem sem conflito. Um plugin como o [Superpowers](01-superpowers.md) pode empacotar skills, comandos e hooks juntos; as skills deste repositório são só a parte "skill" desse tipo de pacote, sem comando de barra fixo nem hook. Instalar `document-skills` não desliga nem substitui nenhum plugin que você já tenha.

**Preciso instalar as 17 de uma vez, ou dá pra escolher só o que eu quero?**
Dá pra escolher. Os três pacotes (`document-skills`, `example-skills`, `claude-api`) podem ser instalados um de cada vez — e se você quiser só uma skill específica dentro de um pacote maior, sem as outras, dá pra vendorizar só aquela pasta manualmente, como mostrado em "Como instalar/ativar" mais acima.

**Funciona só no Claude Code?**
Não. O formato `SKILL.md` segue um padrão aberto usável por qualquer agente compatível. As skills deste repositório especificamente também já estão disponíveis nos planos pagos do Claude.ai, e dá pra usá-las — ou subir skills próprias — via API, com o Skills API Quickstart da própria Anthropic.

**As skills de documento (docx/pdf/pptx/xlsx) editam um arquivo já existente, ou só criam do zero?**
Fazem as duas coisas. A skill `docx`, por exemplo, cobre tanto gerar um `.docx` novo do zero quanto editar um já existente — incluindo alterações rastreadas (*track changes*) e comentários, não só texto corrido.
