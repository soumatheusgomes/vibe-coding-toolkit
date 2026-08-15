# agent-browser

## O que é

agent-browser é uma CLI (interface de linha de comando) standalone, instalada via npm (o gerenciador de pacotes padrão do Node.js/JavaScript) — não é um plugin do Claude Code, é uma ferramenta separada que funciona com qualquer agente de IA capaz de rodar comandos de terminal. É um agente de automação de navegador no estilo dos projetos da Vercel, e controla um navegador Chrome/Chromium de verdade através do DevTools Protocol (o protocolo de depuração remota que o próprio Chrome expõe — o mesmo que as ferramentas de desenvolvedor do navegador usam por trás dos panos).

Importante: **não é um wrapper** (uma camada fina por cima) de bibliotecas como Playwright ou Puppeteer. Foi escrita do zero como CLI nativa, pensada especificamente pra ser controlada por um agente de IA — não adaptada de uma ferramenta feita originalmente pra humanos escreverem testes automatizados.

A diferença prática que isso traz: em vez de seletores CSS (os "endereços" que identificam um elemento numa página, tipo `#botao-login`) ou interação só por captura de tela (a IA "olhando" pixels e adivinhando onde clicar), o agent-browser trabalha com fotografias — *snapshots* — da árvore de acessibilidade (*accessibility tree*: a estrutura que leitores de tela usam pra navegar uma página sem enxergar — títulos, botões, campos, links, e como eles se relacionam) e devolve referências compactas de elemento, tipo `@e1`, `@e2`, `@e3`.

## Por que usar

Um seletor CSS quebra assim que o layout de uma página muda. Uma abordagem só de captura de tela obriga o agente a raciocinar em cima de pixels, o que é caro e impreciso. Uma referência de acessibilidade curta e estável (`@e1`, `@e2`, ...) dá pro agente algo que ele consegue acionar diretamente e pedir de novo, barato, depois que a página muda — mais parecido com a forma como um leitor de tela "vê" uma página do que com a forma como um raspador (*scraper*) tradicional faz.

## Como instalar

> 💬 **Peça pro seu agente instalar:**
>
> ```
> Instale o agent-browser pra mim: rode `npm i -g agent-browser` e depois `agent-browser install`.
> ```
>
> O Claude Code tem acesso a terminal (Bash) — ele roda os comandos e confirma que funcionou. Você não precisa abrir um terminal separado nem saber a diferença entre `pip`/`uv`/`npm`. Prefere fazer você mesmo? Os comandos são exatamente os mesmos, é só rodar direto no seu terminal.

O primeiro comando instala a CLI globalmente; o segundo baixa e prepara o navegador Chrome/Chromium que ela vai controlar (parecido com o que `playwright install` faz, pra quem já usou Playwright).

Confirme:

```bash
agent-browser --version
```

## Fluxo básico

| Comando | O que faz |
|---|---|
| `agent-browser open <url>` | Abre uma página. |
| `agent-browser snapshot` | Tira uma fotografia da árvore de acessibilidade da página atual, com referências (`@e1`, `@e2`, ...). |
| `agent-browser click @eN` | Clica no elemento referenciado por `@eN` no último snapshot. |
| `agent-browser fill @eN "texto"` | Preenche um campo referenciado por `@eN` com o texto dado. |
| `agent-browser screenshot arquivo.png` | Salva uma captura de tela em PNG. |

Regra de ouro: **tire um snapshot novo depois de qualquer ação que muda a página de forma relevante.** As referências só são válidas contra o snapshot de onde vieram — usar uma referência de um snapshot antigo, depois que a página mudou, aponta pro elemento errado ou pra nada.

## O padrão de esboço de descoberta

O arquivo que um agente de codificação carrega pra saber usar essa ferramenta (o "skill" — no vocabulário do próprio agent-browser, um pacote de instruções carregado sob demanda pra uma capacidade específica) é propositalmente minúsculo. Em vez de duplicar um guia de uso completo em Markdown — que ficaria desatualizado a cada nova versão da CLI — esse arquivo só manda o agente puxar as instruções de verdade, atualizadas, direto da própria CLI:

```bash
agent-browser skills get core          # fluxos de trabalho, padrões, troubleshooting
agent-browser skills get core --full   # referência completa de comandos e templates
agent-browser skills list              # todas as skills disponíveis nesta instalação
```

O esboço nunca fica desatualizado, porque não tem nada nele que possa ficar — o conteúdo de verdade sempre bate com a versão instalada no momento em que é buscado. É um padrão que vale a pena copiar nas suas próprias ferramentas: mantenha o arquivo sempre carregado minúsculo, e busque as instruções de verdade ao vivo, na hora.

Esse mesmo motivo é por que este documento também evita duplicar uma referência exaustiva de comandos: pra qualquer coisa além do fluxo básico acima, `agent-browser skills get core --full`, rodado na sua instalação, é a fonte da verdade — não este texto.

## Tutorial passo a passo

### 1. Instale

> 💬 **Peça pro seu agente instalar:**
>
> ```
> Instale o agent-browser pra mim: rode `npm i -g agent-browser` e depois `agent-browser install`.
> ```
>
> O Claude Code tem acesso a terminal (Bash) — ele roda os comandos e confirma que funcionou. Você não precisa abrir um terminal separado nem saber a diferença entre `pip`/`uv`/`npm`. Prefere fazer você mesmo? Os comandos são exatamente os mesmos, é só rodar direto no seu terminal.

### 2. Primeiro comando: puxe as instruções reais

```bash
agent-browser skills get core
```

Isso devolve um guia em Markdown cobrindo fluxo de trabalho, padrões comuns e troubleshooting pra versão instalada — o conteúdo exato varia de versão pra versão, por isso vale rodar isso você mesmo em vez de confiar só neste documento.

### 3. Abra uma página

```bash
agent-browser open example.com
```

### 4. Tire um snapshot — e leia o texto direto dele

```bash
agent-browser snapshot
```

Formato típico de saída, pra essa página específica (`example.com` é um domínio reservado pra exemplos de documentação — o conteúdo dela é sempre o mesmo):

```
Page: Example Domain
URL: https://example.com/

@e1 [heading] "Example Domain"
@e2 [text] "This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission."
@e3 [link] "More information..."
```

Repare que "extrair um texto" não precisa de um comando separado — o texto visível já vem dentro do próprio snapshot, junto de cada referência. Ler `@e2` no resultado acima **é** a extração.

## Exemplos

### Exemplo 1 — preencher e enviar um formulário

Um formulário de cadastro genérico, rodando localmente:

```bash
agent-browser open localhost:3000/cadastro
agent-browser snapshot
```

Formato típico de saída:

```
Page: Novo cadastro
URL: http://localhost:3000/cadastro

@e1 [heading] "Criar conta"
@e2 [form]
  @e3 [input type="text"] placeholder="Nome completo"
  @e4 [input type="email"] placeholder="E-mail"
  @e5 [input type="password"] placeholder="Senha"
  @e6 [button type="submit"] "Criar conta"
```

Preencha os campos e envie:

```bash
agent-browser fill @e3 "Maria Oliveira"
agent-browser fill @e4 "maria@example.com"
agent-browser fill @e5 "senha-forte-123"
agent-browser click @e6
```

O clique em `@e6` envia o formulário e muda a página — pela regra de ouro lá de cima, o próximo passo é tirar um snapshot novo, não reusar `@e3`-`@e6`:

```bash
agent-browser snapshot
```

```
Page: Cadastro confirmado
URL: http://localhost:3000/bem-vindo

@e1 [heading] "Conta criada com sucesso"
@e2 [text] "Enviamos um e-mail de confirmação pra maria@example.com."
```

### Exemplo 2 — tirar um print da página

```bash
agent-browser open example.com
agent-browser screenshot pagina.png
```

Saída esperada: um arquivo `pagina.png` na pasta atual, e uma confirmação parecida com:

```
Screenshot salvo em pagina.png (1280x800)
```

## Além de páginas web comuns

Capacidades estendidas carregam do mesmo jeito que o `core` acima — sob demanda, cada uma como sua própria skill, em vez de vir tudo empacotado de saída na documentação principal:

| Skill | Cobre |
|---|---|
| `electron` | Apps desktop feitos em Electron (framework que cria aplicativos desktop usando tecnologias web) — editores de código, apps de chat, ferramentas de design. |
| `slack` | Automação de apps de chat corporativo (workspace). |
| `dogfood` | Passadas exploratórias de QA/*dogfooding* (usar a própria aplicação internamente pra achar problemas antes que um usuário real os encontre) sobre uma aplicação web. |
| `derive-client` | Derivar um cliente de API standalone a partir de uma captura de tráfego de rede — um arquivo HAR (*HTTP Archive*, o formato padrão que registra cada requisição e resposta que um navegador fez). |
| `vercel-sandbox` | Rodar dentro de VMs (máquinas virtuais) de sandbox — um ambiente isolado e descartável, pra rodar algo sem risco pro resto do sistema — hospedadas na nuvem. |
| `agentcore` | Sessões de navegador hospedadas na nuvem. |

Puxe qualquer uma delas do mesmo jeito: `agent-browser skills get <nome>`.

## Dicas e pegadinhas

**As referências `@eN` são geradas a cada snapshot e ficam obsoletas assim que a página muda.** Sempre tire um snapshot novo depois de uma ação que altera a página de forma relevante — clique, navegação, envio de formulário. Usar uma referência velha não dá erro sempre; às vezes só aponta pro elemento errado, silenciosamente.

**Esse documento pode ficar desatualizado; a CLI, não.** Pelo próprio padrão de esboço de descoberta descrito acima, a referência de comandos completa e sempre atual é `agent-browser skills get core --full`, rodado na sua instalação — não este texto nem nenhum outro guia estático.

**Um print anotado ajuda a conferir o trabalho do agente.** `agent-browser screenshot --annotate arquivo.png` numera os elementos visíveis batendo com as referências `@eN` do snapshot — útil quando uma pessoa quer checar visualmente o que o agente "viu" antes de agir. `--full` captura a página inteira, com rolagem, em vez de só o que cabe na tela.

**Falha mais por espera ruim do que por seletor ruim.** Se uma ação parece não fazer nada, o mais provável é que a página ainda estava carregando ou fazendo uma transição no momento da interação — não que a referência estivesse errada. Vale tirar um snapshot de checagem antes de repetir a ação.

## Perguntas frequentes

**Preciso saber Playwright ou Puppeteer pra usar isso?**
Não. agent-browser não é um wrapper de nenhum dos dois — os comandos são os dele mesmo, e a lógica de referência por acessibilidade não existe do mesmo jeito nessas outras ferramentas.

**Funciona só com o Claude Code?**
Não, é standalone — funciona com qualquer agente de IA que consiga rodar comandos de terminal.

**Dá pra automatizar um aplicativo desktop, tipo um editor de código?**
Sim, através da skill `electron`, carregada sob demanda com `agent-browser skills get electron`.

**As referências `@eN` mudam entre execuções?**
Sim — são geradas a cada snapshot, do zero, a cada vez. Nunca reuse uma referência de um snapshot anterior.

**Preciso manter algum guia próprio atualizado a cada nova versão da CLI?**
Não pros comandos em si. A fonte de verdade é sempre `agent-browser skills get core`; este documento é só a porta de entrada conceitual — o "porquê" por trás da ferramenta, não o "como" exato de cada comando.
