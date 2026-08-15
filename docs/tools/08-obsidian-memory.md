# Obsidian como Memória

## O que é

Um cofre do Obsidian ("vault", no termo que o próprio aplicativo usa) — arquivos Markdown simples, guardados em disco, organizados por uma convenção de pastas — usado como memória de longo prazo de um projeto. A peça central desse padrão: **nenhuma leitura ou escrita toca esses arquivos diretamente.** Tudo passa por um servidor MCP (*Model Context Protocol*, um protocolo que expõe operações como ferramentas estruturadas — com nome, parâmetros e validação — pra um agente de IA chamar, em vez de deixar o agente mexer em arquivos crus do sistema de arquivos).

É esse detalhe que evita que o cofre vire só mais uma pilha de notas que vai saindo do padrão com o tempo. Toda escrita passa por validação:

- **frontmatter obrigatório** — os metadados no topo de um arquivo Markdown, entre duas linhas `---`, tipo título e descrição;
- **um modelo (*template*) por pasta**, que define quais seções a nota precisa ter e em que ordem;
- **checagem de links** — um `[[wikilink]]` (o estilo de link com colchetes duplos que o Obsidian usa pra conectar notas) pra uma nota que não existe é rejeitado, não silenciosamente aceito quebrado;
- **um estilo consistente de slug** (a versão "achatada" do nome do arquivo — minúscula, sem acento, com hífen no lugar de espaço) **e de tag.**

Uma edição manual, direto no arquivo, ignora tudo isso — e só quebra a convenção visivelmente bem mais tarde, numa escrita não relacionada.

## Por que usar

Um índice sempre carregado (veja [Sistema de memória do Claude](09-claude-memory-system.md)) precisa ficar pequeno pra continuar sendo útil — se ele cresce demais, vira algo que se passa os olhos por cima em vez de ler de verdade. A maior parte do que vale a pena lembrar sobre um projeto não cabe ali: é específica demais, é raramente necessária, ou simplesmente empurraria o índice pra além do tamanho que ainda compensa carregar em toda sessão.

O cofre é pra onde vai essa cauda longa — a parte grande, mas individualmente pouco acessada, do que um projeto "sabe": buscável sob demanda, sem limite de tamanho, estruturado o suficiente pra uma busca realmente achar o que precisa, em vez de virar um amontoado de arquivos soltos.

## Como instalar

Existem vários servidores MCP de código aberto que expõem um cofre do Obsidian (ou qualquer pasta de Markdown) como um conjunto de ferramentas. Não existe um pacote único "oficial" recomendado aqui de propósito — procure "obsidian" num registro de MCP (um catálogo de servidores MCP disponíveis pra instalar) e escolha um que suporte modelo e frontmatter obrigatórios, se você quiser esse padrão exato de validação. Um servidor desse tipo costuma expor ferramentas parecidas com estas (os nomes exatos variam de servidor pra servidor):

- busca (por texto, por tag, por propriedade de frontmatter, por data)
- leitura de nota (conteúdo completo, ou só metadados/tamanho)
- criação e edição (nota inteira, ou só uma seção por título)
- links (quem aponta pra essa nota, pra onde essa nota aponta, links quebrados)
- estrutura (renomear, mover, criar pasta)

Passos gerais de instalação:

1. Crie a pasta do cofre no seu projeto (ex.: `vault/`) e as subpastas da estrutura PARA (próxima seção).
2. Escreva um modelo por pasta — o frontmatter e as seções obrigatórias que uma nota daquela pasta precisa ter.
3. Instale o servidor MCP escolhido e configure-o no seu agente, apontando pra pasta do cofre. A configuração geralmente é um arquivo tipo `.mcp.json`:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "<pacote-do-servidor-escolhido>"],
      "env": {
        "VAULT_PATH": "${CLAUDE_PROJECT_DIR}/vault"
      }
    }
  }
}
```

   Os nomes exatos de comando e variável de ambiente mudam de servidor pra servidor — confira o README de qual você escolher antes de copiar isso ao pé da letra.

4. Reinicie a sessão do agente e confirme que as ferramentas do cofre aparecem na lista de ferramentas disponíveis.
5. Escreva o hook (um script que roda automaticamente em certos pontos do ciclo de vida da sessão — antes de uma ferramenta ser chamada, por exemplo) que bloqueia acesso direto ao cofre (seção "Reforçando 'só MCP' com um hook", abaixo) — sem isso, os passos 1 a 4 são só uma convenção de boa vontade, fácil de esquecer sob pressão.

## Estrutura de pastas

Uma estrutura genérica no estilo PARA (o método de organização criado por Tiago Forte, sigla pra **P**rojects, **A**reas, **R**esources, **A**rchives) funciona bem, com dois acréscimos práticos:

| Pasta | Guarda |
|---|---|
| **projetos ativos** | Trabalho com um estado final definido — termina quando o projeto termina. |
| **áreas contínuas** | Responsabilidades sem data de término — ex.: "manutenção do módulo de pagamentos". |
| **conhecimento consolidado** | Lições atemporais e reutilizáveis — o equivalente ao "Archives" do PARA original, mas tratado como destino ativo, não como arquivo morto. |
| **referência** | Material de consulta — documentação externa, decisões de terceiros, links úteis. |
| **registro diário/de sessão** | Um rascunho rotativo, um arquivo por dia — nunca a morada final de nada. |
| **modelos (*templates*)** | Define o formato exigido de cada uma das pastas acima. |

## Tutorial passo a passo

Montando essa estrutura num projeto novo, do zero:

### 1. Crie as pastas

```bash
mkdir -p vault/{01-projetos,02-areas,03-conhecimento,04-referencia,daily,templates}
```

### 2. Escreva um modelo por pasta

Por exemplo, `vault/templates/03-conhecimento.md`:

```markdown
---
name:
description:
metadata:
  type:
---

## Contexto

## Regra ou fato

## Por que importa

## Related
```

O servidor MCP usa esse modelo pra validar toda nota nova ou editada dentro de `03-conhecimento/` — mesmas seções, mesma ordem (é permitido ter seções extras, mas não pode faltar nenhuma das exigidas).

### 3. Instale e configure o servidor MCP

Aponte-o pra pasta `vault/` (veja "Como instalar" acima).

### 4. Escreva o hook de proteção

Veja a seção "Reforçando 'só MCP' com um hook" abaixo — copie o hook, ajuste o caminho (`vault/`) pro nome real da sua pasta, e registre-o no seu agente pra rodar em `PreToolUse` (antes de qualquer chamada de `Read`, `Grep`, `Glob`, `Write` ou `Edit`).

### 5. Teste os dois caminhos

Peça ao agente pra criar, através do MCP, uma nota bem formada numa das pastas — deve funcionar. Depois peça uma leitura direta do arquivo (`Read` no caminho do cofre) — o hook deve bloquear e explicar por quê. Os dois exemplos completos estão na próxima seção.

## Exemplos

### Exemplo 1 — nota bem formada, aceita

Arquivo: `vault/03-conhecimento/regra-aprovacao-pedidos-grandes.md`

```markdown
---
name: regra-aprovacao-pedidos-grandes
description: Pedidos com 10 itens ou mais exigem aprovação manual de um supervisor antes de seguir pro processamento.
metadata:
  type: business-rule
---

## Contexto

Descoberto ao investigar por que alguns pedidos ficavam parados em
"pendente" sem nenhum erro correspondente no log.

## Regra ou fato

Pedidos com 10 itens ou mais entram automaticamente numa fila de
aprovação manual — não é bug, é uma validação de negócio intencional.

## Por que importa

Um agente investigando "por que esse pedido não processou sozinho" sem
saber dessa regra vai procurar um bug onde não tem nenhum.

## Related

- [[fluxo-de-processamento-de-pedidos]]
```

Por que passa na validação: `name` bate com o nome do arquivo (sem a extensão `.md`) e está em kebab-case (minúsculo, com hífen); `description` está preenchida; `metadata.type` é um dos tipos aceitos; as seções batem com o modelo da pasta, na mesma ordem, com `Related` por último; e o wikilink `[[fluxo-de-processamento-de-pedidos]]` aponta pra uma nota que realmente existe no cofre.

### Exemplo 2 — nota malformada, rejeitada

Tentativa de criar `vault/03-conhecimento/RegraDeAprovação.md`:

```markdown
---
name: RegraDeAprovação
metadata:
  type: nota
---

# Aprovação de pedidos grandes

Pedidos grandes precisam de aprovação. Ver [[Fluxo Que Não Existe]].
```

O servidor rejeita a escrita, com uma mensagem parecida com esta (a redação exata varia de servidor pra servidor):

```
ToolError: escrita rejeitada —
  • frontmatter: campo obrigatório "description" ausente
  • frontmatter: "name" (RegraDeAprovação) não está em kebab-case; use regra-de-aprovacao
  • metadata.type: "nota" não é um tipo aceito (use feedback | architecture | business-rule | reference)
  • estrutura: faltam as seções obrigatórias do modelo desta pasta ("Por que importa", "Related")
  • wikilink: [[Fluxo Que Não Existe]] não existe — nenhuma nota corresponde a esse título
```

Cinco problemas de uma vez, todos coisas que uma edição manual direto no arquivo deixaria passar batido:

1. `description` ausente.
2. `name` fora do padrão kebab-case e com acento.
3. `metadata.type` fora do vocabulário aceito — esse cofre usa o mesmo vocabulário do índice sempre carregado (`feedback | architecture | business-rule | reference`, veja [Sistema de memória do Claude](09-claude-memory-system.md)), justamente pra migração entre os dois ser mecânica, sem precisar reclassificar nada.
4. Faltam seções que o modelo da pasta exige.
5. Um wikilink pra uma nota que não existe — rejeitado de cara, em vez de virar um link quebrado silencioso.

## Reforçando "só MCP" com um hook

Uma regra escrita — "sempre use as ferramentas MCP" — é fácil de esquecer no meio de uma sessão, sob pressão de contexto. Em vez de confiar só na convenção, reforce mecanicamente com um hook: um `PreToolUse` (roda antes de a ferramenta ser executada) que nega qualquer chamada direta de `Read`, `Grep`, `Glob`, `Write` ou `Edit` cujo caminho toque a pasta do cofre. Uma exceção estreita, só leitura, pra pasta do registro diário é aceitável se for útil — o resto do cofre continua exclusivamente MCP.

Mesmo leitor de stdin (entrada padrão) JSON do hook do proxy de tokens: [`hook-io.mjs.example`](../../templates/hooks/hook-io.mjs.example), que expõe `readStdinRaw()` (lê o stdin sem nunca lançar exceção) e `parseHookEvent()` (tenta fazer o parse, devolvendo `null` tanto pra JSON inválido quanto pro valor literal `null` — os dois casos que costumam derrubar um hook escrito às pressas):

```js
#!/usr/bin/env node
// Hook PreToolUse — matcher: Read|Grep|Glob|Write|Edit
(async () => {
  const { readStdinRaw, parseHookEvent } = await import("./hook-io.mjs");
  const event = parseHookEvent(readStdinRaw());
  if (event === null) process.exit(0); // nada pra analisar — falha aberta

  const path =
    event?.tool_input?.file_path ??
    event?.tool_input?.path ??
    event?.tool_input?.pattern ??
    "";

  if (!path.includes("vault/")) process.exit(0); // não é o cofre — permite

  const isDailyRead =
    path.includes("vault/daily/") && ["Read", "Grep", "Glob"].includes(event.tool_name);
  if (isDailyRead) process.exit(0); // exceção estreita: só leitura da pasta diária

  console.error("vault/ é MCP-only — use as ferramentas MCP do cofre, não acesso direto a arquivo.");
  process.exit(2); // bloqueia; a mensagem acima é mostrada ao agente
})();
```

Veja [Boas práticas de hooks](10-hooks-best-practices.md) pro raciocínio geral por trás de "falhar aberto" e do cuidado específico com `JSON.parse("null")` que o trecho acima já evita.

## Automatizando captura e consolidação

Automatizar o ciclo de "capturar, depois consolidar" em vez de depender de o agente lembrar de fazer isso sozinho — dois hooks fecham o loop:

- Um hook de **fim de sessão** (roda quando a sessão termina) registra um resumo curto na nota do dia — o que foi feito, decisões tomadas, problemas encontrados.
- Um hook de **início de sessão** (roda quando uma sessão começa, num dia posterior) promove os registros diários de ontem pra notas de conhecimento permanentes, e só então apaga o registro diário bruto já compilado.

Esse "só então apaga" importa: é o que mantém a pasta diária um rascunho rotativo, em vez de virar um segundo armazenamento permanente competindo com a pasta de conhecimento. Uma nota diária nunca compilada continua lá, disponível, até algum início de sessão futuro processá-la.

## Migrando pro índice sempre carregado

O índice sempre carregado (veja [Sistema de memória do Claude](09-claude-memory-system.md)) e o cofre não são dois armazenamentos concorrentes — existe um caminho de migração explícito de um pro outro, pra quando uma entrada do índice para de merecer seu lugar em algo lido em toda sessão:

1. **Dedup** — busque no cofre primeiro; estenda uma nota existente em vez de criar quase-duplicata.
2. **Bata com o modelo** — puxe o modelo obrigatório da pasta de destino e siga exatamente.
3. **Crie** a nota.
4. **Confirme lendo de volta** — nenhuma leitura bem-sucedida depois da escrita significa que a migração não aconteceu de verdade.
5. **Só então** apague a cópia curta do índice sempre carregado.

Nunca pule direto pro passo 5. Uma migração não confirmada é perda de dado, não uma mudança de lugar — a entrada não existiu em lugar nenhum durante o tempo que levou pra alguém notar o erro.

## Dicas e pegadinhas

**Ler o cofre direto "só dessa vez" é exatamente o hábito que o hook existe pra quebrar.** Se você se pegar querendo contornar o bloqueio, isso é sinal de que falta uma ferramenta MCP (tipo uma listagem em lote), não motivo pra ignorar a regra.

**A exceção da pasta diária, no hook acima, é só leitura.** Um hook que também libera escrita direta em `daily/` derruba a validação de frontmatter e modelo pra esses arquivos também — mantenha escrita sempre via MCP, mesmo na pasta diária.

**Busque antes de criar.** Um wikilink pra uma nota que ainda não existe falha na hora, sob política estrita de links — crie a nota de destino primeiro, ou use texto simples até ela existir.

**Mantenha "Related" como a última seção**, mesmo que o modelo tecnicamente permita em outra posição — é onde ferramentas de compilação e deduplicação esperam encontrá-la.

**Uma escrita que "deu certo" mas não foi confirmada por leitura não está confirmada de verdade.** Trate como possivelmente perdida até o passo 4 da migração (ler de volta) realmente acontecer.

## Perguntas frequentes

**Por que não deixar o agente editar os arquivos `.md` direto?**
Porque sem validação centralizada, o cofre degrada com o tempo: frontmatter inconsistente, links quebrados, nomes de arquivo sem padrão — cada edição manual é uma chance de fugir da convenção, e ninguém percebe até muito depois.

**Isso substitui o índice sempre carregado (`MEMORY.md`)?**
Não, complementa. O índice é pequeno e lido em toda sessão; o cofre é grande, buscado sob demanda. Veja [Sistema de memória do Claude](09-claude-memory-system.md) pro outro lado dessa mesma moeda.

**Preciso ter o aplicativo Obsidian instalado de verdade?**
Não necessariamente. O "cofre" é só uma pasta de Markdown com uma convenção — o aplicativo Obsidian é uma forma agradável de navegar isso visualmente, mas o mecanismo de acesso que importa aqui é o servidor MCP, não o app.

**Qual servidor MCP eu uso?**
Não recomendamos um específico de propósito — procure "obsidian" num registro de MCP e confirme que o servidor escolhido suporta frontmatter e modelos obrigatórios, se você quiser esse padrão exato.

**O que acontece com o registro diário depois de compilado?**
É apagado, pra pasta diária continuar sendo um rascunho rotativo, em vez de virar um segundo armazenamento permanente competindo com a pasta de conhecimento.
