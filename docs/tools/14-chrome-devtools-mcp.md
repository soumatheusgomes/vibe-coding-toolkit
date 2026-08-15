# Chrome DevTools MCP

## O que é

Chrome DevTools MCP é um servidor MCP (*Model Context Protocol* — o protocolo que conecta um agente de IA a ferramentas externas, expondo cada uma como uma operação com nome e parâmetros bem definidos) mantido oficialmente pelo próprio time do Chrome DevTools, dentro do Google. O repositório é [`ChromeDevTools/chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp) — por volta de **49 mil estrelas e 3.400 forks** no GitHub (o número sobe rápido: segundo levantamentos de terceiros, estava por volta de 31 mil no início de 2026 e já tinha passado de 43 mil em meados do mesmo ano — vale conferir o repositório direto pra um número atualizado). O anúncio saiu no blog oficial do [Chrome for Developers](https://developer.chrome.com/blog/chrome-devtools-mcp), com preview público lançado em 23 de setembro de 2025, sob licença Apache 2.0.

Ele dá ao agente acesso direto a uma sessão real e viva do Chrome — não uma simulação, não um navegador headless (sem interface gráfica) fingindo ser outra coisa: um Chrome de verdade, rodando, que o agente controla e inspeciona. As ferramentas cobrem console, inspeção de rede, performance trace (uma gravação detalhada do que o navegador fez durante um carregamento ou uma interação — onde o tempo foi gasto, o que bloqueou o quê), captura de tela, e depuração (*debugging*) de forma geral — pensadas pra responder "por que essa página está lenta" ou "por que esse request falhou" com dado real, não suposição.

O post oficial do blog do Chrome for Developers resume bem o problema que a ferramenta resolve: agentes de codificação não conseguem ver o que o código gerado por eles realmente faz depois de rodar no navegador — programam, nas palavras do próprio post, "com uma venda nos olhos" (*with a blindfold on*). Chrome DevTools MCP tira essa venda: o agente passa a enxergar o resultado de verdade, não só o código-fonte que escreveu.

## Por que usar

**Diferença importante em relação ao [agent-browser](11-agent-browser.md) (já documentado neste toolkit): as duas ferramentas resolvem problemas diferentes, e não competem entre si.**

- **agent-browser é automação** — faz o agente clicar, preencher formulário, navegar por um fluxo de usuário inteiro, do início ao fim. A pergunta que ele responde é "o que acontece se um usuário fizer X, Y, Z nessa página".
- **Chrome DevTools MCP é diagnóstico** — inspeciona uma página que já está rodando, pra entender por que algo específico está errado ali: por que está lenta, por que um request de rede falhou, o que apareceu no console. A pergunta que ele responde é "o que está acontecendo, de verdade, nessa página agora".

Uma forma direta de pensar nisso, que aparece com frequência em comparações da comunidade contra ferramentas parecidas: uma ferramenta de automação existe pra **dirigir** o navegador (ação); o Chrome DevTools MCP existe pra **depurar** um navegador que já está rodando (observação). São complementares, não concorrentes — dá pra usar as duas juntas na mesma sessão: o agent-browser navega até o estado exato que você quer investigar (login feito, formulário preenchido, ação disparada), e o Chrome DevTools MCP entra depois, nesse mesmo Chrome, pra investigar o que está acontecendo ali.

Sem essa ferramenta, o agente depurando um problema de frontend fica na mesma posição de um desenvolvedor sem as ferramentas de desenvolvedor do navegador abertas: só pode olhar o código-fonte e adivinhar. Com ela, o agente roda exatamente os mesmos tipos de investigação que uma pessoa rodaria manualmente — só que sem trocar de janela, copiar e colar valores, ou descrever pra você o que está vendo.

## Como instalar

> 💬 **Peça pro seu agente instalar:**
>
> ```
> Instale o Chrome DevTools MCP pra mim: rode `claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest`.
> ```
>
> O Claude Code tem acesso a terminal (Bash) — ele roda o comando e confirma que funcionou. Prefere fazer você mesmo? É o mesmo comando, direto no seu terminal.

Requisitos, direto da documentação oficial: Node.js na versão LTS (*Long Term Support* — a versão de suporte de longo prazo, mais estável), npm, e o Chrome na versão estável atual ou mais nova. Sem Chrome instalado, não tem o que o servidor controlar.

Existe também um caminho por plugin, que soma as mesmas ferramentas MCP a skills prontas (arquivos de instrução carregados sob demanda, ensinando o agente a usar a ferramenta bem):

```bash
/plugin marketplace add ChromeDevTools/chrome-devtools-mcp
/plugin install chrome-devtools-mcp@chrome-devtools-plugins
```

(Fonte de ambos os comandos acima: [README oficial do projeto](https://github.com/ChromeDevTools/chrome-devtools-mcp).) Se você já tinha uma instalação antiga desse mesmo MCP configurada de outro jeito, o próprio README recomenda remover a configuração antiga antes de instalar de novo, pra não deixar duas entradas conflitando.

Por padrão, o servidor sobe sua própria instância nova do Chrome. Pra conectar numa janela do Chrome que você já tem aberta — com login e sessão preservados, por exemplo — existe a flag `--browser-url` (também aceita como `--browserUrl`), apontando pra porta de depuração remota do Chrome. Configuração manual, direto no arquivo de MCP servers (fonte: README oficial):

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--browser-url=http://127.0.0.1:9222"
      ]
    }
  }
}
```

## Tutorial passo a passo

### 1. Instale

> 💬 **Peça pro seu agente instalar:**
>
> ```
> Instale o Chrome DevTools MCP pra mim: rode `claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest`.
> ```
>
> O Claude Code tem acesso a terminal (Bash) — ele roda o comando e confirma que funcionou. Prefere fazer você mesmo? É o mesmo comando, direto no seu terminal.

### 2. Descreva o sintoma, não a causa

Peça o diagnóstico do jeito que você pediria pra um colega — pelo sintoma que você vê, não pela causa (que você ainda não sabe):

```
Essa página local (localhost:3000/painel) está demorando muito
pra ficar interativa. Descobre o que está segurando o carregamento.
```

### 3. O agente abre a página e roda um trace de performance

```
navigate_page({ url: "http://localhost:3000/painel" })
performance_start_trace({ reload: true })
```

Formato típico de saída (resumo):

```
Trace concluído — 4.2s até interativo.
Maior contribuinte: LCP (Largest Contentful Paint, a métrica de
  quando o maior elemento visível termina de carregar) em 3.8s,
  causado por uma imagem de 2.4MB carregada sem otimização
  (banner-hero.png, 3840x2160).
Script bloqueante identificado: analytics.js (612ms, render-blocking).
```

### 4. O agente lê o resultado e aponta a causa raiz

A resposta final cita o dado real da gravação — tamanho de arquivo, tempo exato, qual recurso especificamente segurou o carregamento — em vez de uma lista genérica de "boas práticas de performance" que talvez nem se apliquem a essa página.

## Exemplos concretos

### Exemplo 1 — performance trace

**Pedido:** "Por que essa página está lenta pra carregar?"

O agente navega até a página, dispara uma gravação de performance, e lê o resultado:

```
performance_start_trace({ url: "https://exemplo.com/produtos", reload: true })
```

Formato típico de saída:

```
LCP: 4.1s (ruim — ideal é abaixo de 2.5s)
  Elemento: <img class="produto-destaque">
  Causa: imagem servida em tamanho original (1920x1080),
         exibida em 400x225 — sem redimensionamento nem lazy-load.

Recomendação: servir a imagem já no tamanho de exibição, ou usar
  `loading="lazy"` pra imagens fora da primeira tela.
```

A resposta do agente aponta o elemento exato, a métrica exata, e a causa exata — porque veio de uma gravação real da página, não de uma suposição genérica sobre "imagem grande deixa página lenta".

### Exemplo 2 — erro de console e de rede

**Pedido:** "Tem um botão que não funciona nessa página, o clique não faz nada. Descobre por quê."

```
navigate_page({ url: "http://localhost:3000/checkout" })
click(seletor_do_botao)
list_console_messages()
list_network_requests()
```

Formato típico de saída:

```
Console:
  [error] Uncaught TypeError: Cannot read properties of undefined
    (reading 'total') at checkout.js:142

Rede:
  POST /api/carrinho/finalizar → 404 Not Found
    (endpoint chamado não existe nessa versão da API)
```

Duas pistas concretas de uma vez: o erro de JavaScript que trava o clique, e a chamada de rede que devolve 404 — provavelmente a causa raiz por trás do erro no console. Sem essas duas informações, o diagnóstico seria só "o botão não funciona", sem nenhuma pista de por quê.

## Dicas e pegadinhas

**Precisa de um Chrome de verdade rodando.** Não é uma simulação leve — o servidor sobe (ou se conecta a) uma instância real do navegador, com o consumo de memória e CPU que isso implica. Em ambientes sem interface gráfica (alguns containers, por exemplo), pode ser necessário configurar um modo headless explicitamente.

**`--browser-url` reaproveita sua sessão já logada.** Em vez de o agente precisar fazer login de novo numa página protegida por autenticação, você abre o Chrome manualmente, loga, e aponta o servidor pra essa mesma janela via porta de depuração remota — útil justamente pra páginas que exigem sessão.

**Uma instalação antiga pode conflitar com a nova.** O próprio README avisa: se você já tinha o Chrome DevTools MCP configurado antes, remova a configuração antiga primeiro. Duas entradas apontando pro mesmo servidor, de jeitos diferentes, tende a confundir mais do que ajudar.

**A superfície de ferramentas é grande.** São dezenas de ferramentas, divididas em categorias como automação de input, navegação, emulação, performance, rede, debugging, memória, extensões e PWA (aplicativos web progressivos). Pedir um diagnóstico amplo demais ("revisa a página inteira") tende a fazer o agente chamar ferramenta demais, gastando mais contexto do que pedir por um sintoma específico.

**É sobre uma página por vez, não um fluxo inteiro.** Pra diagnosticar depois de navegar por várias telas — login, carrinho, checkout — combine com o [agent-browser](11-agent-browser.md): ele leva a página até o estado certo, o Chrome DevTools MCP investiga o que está acontecendo naquele estado.

## Perguntas frequentes

**Precisa do Chrome instalado?**
Sim — a documentação oficial pede a versão estável atual do Chrome ou mais nova. O servidor controla um Chrome de verdade, seja subindo uma instância nova, seja conectando numa que você já tem aberta via `--browser-url`.

**Funciona em produção ou só em localhost?**
Funciona com qualquer URL que o navegador conseguir abrir — local, de homologação, ou de produção — porque, no fim, é só um navegador de verdade sendo controlado; ele não faz ideia se a página é local ou pública. Os próprios exemplos da documentação oficial usam uma URL de produção real. A única parte tipicamente local é o endereço da porta de depuração remota (`--browser-url`, geralmente `127.0.0.1`) quando você conecta numa janela do Chrome que já está aberta na sua máquina — mas a página carregada *dentro* dessa janela pode ser qualquer URL.

**É a mesma coisa que o Playwright MCP?**
Não. São MCPs de propósitos diferentes, e a diferença é bem definida na comunidade: Playwright MCP existe pra **dirigir** o navegador — automação repetível, multi-navegador (Chrome, Firefox, WebKit), pensada pra fluxos de teste. Chrome DevTools MCP existe pra **depurar** um Chrome específico que já está rodando — performance trace, console, rede, só nesse navegador. Se o problema é "esse fluxo de usuário funciona de ponta a ponta", Playwright MCP (ou o [agent-browser](11-agent-browser.md) deste toolkit) é a ferramenta certa. Se o problema é "por que essa página específica está lenta ou quebrada", Chrome DevTools MCP tem a resposta mais direta.

**Dá pra usar junto com o agent-browser deste toolkit?**
Dá, e é exatamente o uso combinado que faz mais sentido: o agent-browser navega até o estado que você quer investigar, o Chrome DevTools MCP investiga o que está acontecendo ali — descrito em detalhe na seção "Por que usar", acima.
