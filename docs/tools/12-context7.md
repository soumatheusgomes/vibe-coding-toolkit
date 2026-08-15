# Context7

## O que é

Context7 é um servidor MCP (sigla de *Model Context Protocol* — o protocolo que conecta um agente de IA a ferramentas e fontes de dado externas, expondo cada uma como uma operação com nome, parâmetros e validação, em vez de deixar o agente adivinhar como usá-la) mantido pela [Upstash](https://upstash.com). O repositório é [`upstash/context7`](https://github.com/upstash/context7) — **60.791 estrelas e 2.929 forks** no GitHub, um dos números mais altos entre qualquer servidor MCP público hoje. A descrição atual do próprio repositório já fala em "Context7 Platform" — o projeto cresceu de um servidor MCP isolado pra uma plataforma maior, mas "Context7" continua sendo como todo mundo se refere a ele no dia a dia.

Ele resolve um problema bem concreto: um modelo de linguagem tem uma data de corte de conhecimento (o ponto até onde o treinamento dele enxergou informação), mas bibliotecas de código continuam mudando depois disso — uma assinatura de função muda, um hook novo aparece, uma opção de configuração passa a se chamar outra coisa ou muda de lugar. Sem ajuda externa, o agente preenche essa lacuna "alucinando": inventa, com total confiança, uma API que parece plausível mas não existe mais (ou nunca existiu daquele jeito). Context7 fecha essa lacuna injetando documentação real, atual e específica da versão certa, direto no contexto do agente, através de duas ferramentas:

- **`resolve-library-id`** — recebe um nome de biblioteca em linguagem natural (ex.: "react", "next.js") e devolve o identificador exato que o Context7 usa internamente pra ela.
- **`query-docs`** — recebe esse identificador (e, opcionalmente, um tópico específico) e devolve os trechos de documentação relevantes daquela versão.

(Documentação e tutoriais mais antigos às vezes chamam a segunda ferramenta de `get-library-docs` — veja "Dicas e pegadinhas" mais abaixo.)

O projeto está listado no `marketplace.json` oficial do [`anthropics/claude-plugins-official`](https://github.com/anthropics/claude-plugins-official) — o mesmo marketplace que este toolkit usa pra instalar o [Superpowers](01-superpowers.md) — como o plugin `context7`, mantido pela Upstash e marcado como "community-managed" (mantido pela comunidade, não pela própria Anthropic, mas distribuído através do marketplace oficial dela). Essa combinação — chancela de distribuição oficial mais uma tração independente enorme — é rara, e é parte do motivo do Context7 aparecer em praticamente toda conversa sobre ferramentas MCP pra desenvolvimento.

Importante: **Context7 não é exclusivo do Claude Code.** Funciona com qualquer cliente que fale MCP — Cursor, Windsurf, VS Code, Claude Desktop, e outros — cada um com seu próprio guia de conexão.

## Por que usar

Peça pra qualquer agente de IA "como eu configuro X na versão mais nova de uma biblioteca Y" e existe uma chance real de a resposta vir de um período em que a API era diferente. O problema não é o agente "não saber" — é ele saber uma versão que já não é a atual, e responder com a mesma confiança de sempre, sem sinalizar a incerteza. O resultado comum: código que não compila, uma opção de configuração que o linter ou o build rejeita, uma chamada de API que devolve erro de método inexistente.

Sem o Context7, corrigir isso vira um ciclo de tentativa e erro: o agente escreve algo plausível, você roda, quebra, cola o erro de volta, o agente tenta de novo — cada rodada gastando tempo (seu) e tokens (dele) até, por sorte ou pesquisa manual, chegar na sintaxe certa. Com o Context7, o agente busca a documentação real da versão instalada *antes* de escrever a resposta — o ciclo de tentativa e erro não desaparece por completo (documentação também pode estar incompleta ou ambígua num caso de borda), mas encolhe bastante, porque a base da resposta já nasce fato, não memória de treinamento desatualizada.

## Como instalar

> 💬 **Peça pro seu agente instalar:**
>
> ```
> Instale o Context7 pra mim: rode `npx ctx7 setup --claude` no terminal.
> ```
>
> O Claude Code tem acesso a terminal (Bash) — ele roda o comando pra você. Uma ressalva importante, diferente da maioria das outras ferramentas deste toolkit: esse comando abre um fluxo de login OAuth (uma aba do navegador abre sozinha, pedindo pra você confirmar a autenticação) — a instalação não é 100% "peça e esqueça", o agente dispara o comando, mas o clique de confirmação no navegador é seu. Prefere fazer você mesmo? É o mesmo comando, direto no seu terminal.

`npx ctx7 setup --claude` (fonte: [documentação oficial de clientes do Context7](https://context7.com/docs/clients/claude-code)) autentica via OAuth, gera uma API key automaticamente, e deixa você escolher entre modo CLI ou MCP pro Claude Code. Alternativa, pra quem quer os recursos extras — skills que disparam sozinhas ao mencionar uma biblioteca, agentes dedicados, e o comando manual `/context7:docs` — é instalar o plugin completo (fonte: [README oficial do projeto](https://github.com/upstash/context7)):

```bash
/plugin marketplace add upstash/context7
/plugin install context7@context7-marketplace
```

Uma API key é **opcional**, mas recomendada: sem ela, o Context7 conecta de forma anônima e compartilha um limite de taxa (rate limit) coletivo com todo mundo nesse modo; com uma chave gratuita, gerada em [context7.com/dashboard](https://context7.com/dashboard), o limite passa a ser individual e mais alto:

```bash
export CONTEXT7_API_KEY="sua-chave-aqui"
```

Confirme que a conexão funcionou pedindo pro agente listar as ferramentas MCP disponíveis, ou simplesmente fazendo uma pergunta que dependa de doc de biblioteca (próxima seção) e reparando se ele consulta o Context7 antes de responder.

## Tutorial passo a passo

### 1. Instale

> 💬 **Peça pro seu agente instalar:**
>
> ```
> Instale o Context7 pra mim: rode `npx ctx7 setup --claude` no terminal.
> ```
>
> O Claude Code tem acesso a terminal (Bash) — ele roda o comando pra você, mas o clique de confirmação no fluxo de login OAuth (numa aba do navegador) é seu. Prefere fazer você mesmo? É o mesmo comando, direto no seu terminal.

### 2. Faça uma pergunta que dependa de doc atual

Peça algo que só a documentação da versão certa responde direito — não um conceito geral, e sim um detalhe de API que muda de versão pra versão:

```
Como eu uso o hook `use()` do React pra ler uma Promise dentro de
um componente, na versão mais recente?
```

### 3. O agente resolve a biblioteca certa primeiro

Antes de responder, o agente chama `resolve-library-id` pra encontrar o identificador exato:

```
resolve-library-id({ libraryName: "react" })
```

Formato típico de saída:

```
/reactjs/react.dev  — React — a documentação oficial
/facebook/react      — React — código-fonte no GitHub
...
```

### 4. O agente busca a doc real daquela versão

Com o identificador em mãos, ele chama `query-docs`, geralmente com um tópico pra focar a busca:

```
query-docs({
  context7CompatibleLibraryID: "/reactjs/react.dev",
  topic: "use hook promise suspense"
})
```

Formato típico de saída (trecho):

```
## use

`use(promise)` ou `use(context)` — lê o valor de um recurso, como uma
Promise ou um Context, diretamente durante a renderização.

Diferente de outros hooks, `use` pode ser chamado dentro de
condicionais e loops...

Exemplo:
  function Comments({ commentsPromise }) {
    const comments = use(commentsPromise);
    ...
  }
```

### 5. A resposta final já vem apoiada na doc real

O agente responde citando a assinatura e o comportamento exatos que acabou de buscar — não uma lembrança de treinamento, uma consulta feita na hora, contra a documentação de verdade.

## Exemplos concretos

### Exemplo 1 — uma biblioteca que mudou recentemente

**Pergunta:** "Como eu configuro cores customizadas no Tailwind CSS, na versão mais nova?"

O Tailwind CSS passou por uma mudança grande entre a versão 3 e a 4: configuração deixou de ser um arquivo JavaScript (`tailwind.config.js`, com um objeto `theme.extend.colors`) e passou a ser CSS-first, direto no arquivo de estilos, com a diretiva `@theme`. Um agente sem Context7 — ou com Context7 disponível, mas não consultado — tende a responder com o padrão antigo, porque é o que apareceu com muito mais frequência nos dados de treinamento até a data de corte:

```js
// resposta plausível, mas desatualizada pro Tailwind v4
module.exports = {
  theme: {
    extend: {
      colors: { brand: "#F7A072" },
    },
  },
};
```

Com o Context7 consultado, a resposta vem alinhada com a versão instalada no projeto:

```css
/* Tailwind CSS v4 — configuração direto no CSS */
@import "tailwindcss";

@theme {
  --color-brand: #F7A072;
}
```

### Exemplo 2 — um caso em que o agente erraria sem o Context7

**Pergunta:** "Como eu leio um cookie numa Server Action do Next.js?"

A partir do Next.js 15, as funções `cookies()` e `headers()` passaram a ser assíncronas — precisam de `await` — depois de terem sido síncronas por várias versões anteriores. Um agente respondendo de memória, sem checar a versão instalada, tem uma chance real de devolver o padrão síncrono antigo:

```ts
// erra na v15+: cookies() agora retorna uma Promise
import { cookies } from "next/headers";

export async function minhaAction() {
  const cookieStore = cookies(); // falta o await
  return cookieStore.get("sessao");
}
```

Isso não dá erro de digitação — dá erro em tempo de execução (ou de build, dependendo do uso), porque `cookieStore` vira uma `Promise` não resolvida, não o objeto esperado. Com a doc real da versão instalada consultada via Context7, a resposta já vem com o `await` no lugar certo:

```ts
import { cookies } from "next/headers";

export async function minhaAction() {
  const cookieStore = await cookies();
  return cookieStore.get("sessao");
}
```

## Dicas e pegadinhas

**A segunda ferramenta já teve outro nome.** Documentação e tutoriais mais antigos se referem a ela como `get-library-docs`; a versão atual, hospedada pela Upstash, expõe `query-docs`. Se um guia que você está seguindo menciona um nome e a lista de ferramentas do seu agente mostra outro, não é erro de instalação — é só uma diferença de versão/momento da documentação que você está lendo.

**Sem chave de API, o limite de requisições é compartilhado com todo mundo no modo anônimo.** Numa sessão de uso intenso, ou num time inteiro atrás do mesmo IP, isso pode significar respostas mais lentas ou negadas por limite de taxa. A chave é gratuita — vale gerar uma antes de bater nesse limite, não depois.

**O Context7 só sabe o que já indexou.** Uma biblioteca extremamente nova, um pacote interno da sua empresa, ou algo obscuro o suficiente pra nunca ter sido rastreado, simplesmente não resolve — `resolve-library-id` não acha nada, e o agente cai de volta no próprio conhecimento de treinamento (com todos os riscos de alucinação que isso implica).

**O motor por trás da busca é fechado.** O cliente MCP (o que você instala e conecta) é MIT — código aberto. O backend que faz o rastreamento, o parsing e a busca de verdade é da Upstash, hospedado, e não é código aberto. Isso não muda como você usa a ferramenta no dia a dia, mas explica por que não dá pra simplesmente rodar "sua própria instância" do Context7 inteiro.

**Context7 não substitui entender a biblioteca.** Ele é ótimo pra sintaxe de API exata — a assinatura certa, o parâmetro certo, o exemplo de uso atualizado. Pra decisão de design ("por que essa biblioteca escolheu esse padrão", "quando usar X em vez de Y") a documentação em prosa completa, lida por uma pessoa, ainda vale mais.

## Perguntas frequentes

**Preciso pagar?**
Não, pra uso normal. O cliente MCP é gratuito e de código aberto (MIT); o backend hospedado pela Upstash tem um nível gratuito — anônimo, com limite de taxa compartilhado, ou com uma API key gratuita, com limite individual mais alto. Times com uso muito pesado devem conferir os planos atuais direto no site da Upstash.

**Funciona com qualquer linguagem ou framework?**
Na prática, com qualquer biblioteca que já tenha sido indexada pelo Context7 — o que cobre um volume enorme do ecossistema JavaScript/TypeScript, Python, e vários outros. Uma biblioteca nova demais, interna da empresa, ou nunca rastreada não vai resolver.

**Isso substitui ler a documentação oficial?**
Não. É uma camada de busca rápida, pensada pra injetar o trecho certo no contexto do agente na hora que ele precisa — não um substituto pra entender a biblioteca por conta própria quando a dúvida é de design, não de sintaxe.

**Preciso reiniciar a sessão do agente depois de instalar?**
Sim, geralmente — como qualquer servidor MCP novo, o agente só enxerga as ferramentas dele a partir de uma sessão nova, depois da conexão configurada.
