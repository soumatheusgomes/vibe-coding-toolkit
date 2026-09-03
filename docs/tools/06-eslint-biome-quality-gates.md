# Quality Gates de Lint: ESLint + Biome

Dois linters, dois papéis — de propósito, sem sobreposição. Um roda um
conjunto pequeno e cuidadosamente escolhido de regras, mirando um punhado de
anti-padrões bem específicos. O outro carrega o grosso da cobertura: regras
que precisam da informação completa de tipos do TypeScript, mais as regras
específicas do framework que o projeto usa. Rodar os dois ao mesmo tempo não
é redundância — é deixar cada ferramenta cobrir a parte em que ela é rápida
e precisa, em vez de escolher uma só e pedir pra ela fazer o trabalho
inteiro sozinha.

Esse guia primeiro explica o raciocínio por trás dessa divisão — por que
duas ferramentas, por que um conjunto curado de regras em vez do pacote
"recomendado" inteiro, por que um aviso de lint pode ser uma ferramenta de
migração e não só um estado passageiro. Depois, um tutorial passo a passo
mostra como montar esse esquema do zero, num projeto novo. Por fim, cinco
exemplos de código mostram as pegadinhas mais surpreendentes desse esquema
na prática — o tipo de coisa que só aparece depois que você já bateu de
cara com ela uma vez.

## Antes de começar: o que é linter, o que é formatter

Se você nunca configurou nada disso, comece por aqui — o resto do texto
assume que você conhece a diferença entre as duas coisas.

Um **linter** é um programa que lê seu código sem executá-lo e aponta
problemas: uma variável declarada e nunca usada, um padrão que costuma
esconder bugs, um trecho que quebra uma convenção do time. Cada problema que
ele sabe detectar é uma **regra** (rule), e cada regra tem uma
**severidade**: `"off"` (desligada), `"warn"` (aviso — aparece no terminal
ou no editor, mas não impede nada) ou `"error"` (erro — pode travar o
build, o commit, ou a esteira de CI, dependendo de como você conectar o
linter ao resto do fluxo de trabalho).

Um **formatter** é uma ferramenta diferente, com um trabalho mais estreito:
ele só cuida da aparência do código — indentação, aspas simples ou duplas,
onde quebrar uma linha longa. Ele não tem opinião nenhuma sobre lógica, só
sobre estilo visual, e normalmente reescreve o arquivo sozinho pra aplicar
o padrão escolhido.

ESLint e Biome, cada um, sabem fazer as duas coisas — lintar e formatar.
Este guia é sobre uma decisão específica: usar cada ferramenta só pra parte
do trabalho em que ela compensa mais, em vez de escolher uma delas e pedir
pra ela cuidar de tudo sozinha.

## Por que dois linters, e não um só

O preset "recommended" de qualquer linter é um pacote fechado, pensado pra
agradar o maior número possível de projetos ao mesmo tempo — o que, na
prática, significa que ele erra pros dois lados: traz regras que não fazem
sentido no seu contexto específico, e ainda assim deixa de fora regras que
o seu projeto realmente precisava. Dividir o trabalho entre duas ferramentas
deixa cada uma cobrir o que ela faz de melhor, e transforma "o que está
ligado, e por quê" numa escolha explícita e defensável — registrada como
comentário na própria configuração — em vez de uma lista herdada de um
padrão de mercado que ninguém no time escolheu de fato.

## Regras curadas no Biome, cobertura pesada no ESLint

O Biome é rápido — rápido o bastante (é escrito em Rust, o que explica boa
parte disso) pra rodar um conjunto pequeno de regras escolhidas a dedo, em
vez do preset "recommended" completo que ele traz de fábrica (algo em torno
de 200 regras). Optar por cinco ou seis regras específicas, em vez de
duzentas genéricas, é uma escolha legítima por si só — e o motivo de cada
escolha deveria morar como comentário bem ao lado da configuração que
aplica a regra, não num documento separado que ninguém mais vai lembrar de
manter atualizado junto:

```jsonc
// biome.jsonc
{
  // De propósito, NÃO estamos usando o preset "recommended" do Biome
  // (~200 regras). Aqui o Biome cobre um punhado de anti-padrões
  // específicos; o ESLint (com regras conscientes de tipos e regras
  // específicas do framework) cobre o resto. Ter cobertura sobreposta
  // entre dois linters só significa dois lugares pra manter a mesma
  // regra em dia.
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": false,
      "correctness": {
        // Uma variável declarada e nunca usada quase sempre é import
        // esquecido ou código morto — vale travar isso como erro.
        "noUnusedVariables": "error"
      },
      "suspicious": {
        // "any" explícito não é proibido, mas merece ficar visível:
        // é o ponto exato onde o TypeScript para de checar tipo por
        // você. Fica em "warn", não em "error" — às vezes é a saída
        // certa, mas precisa ser uma escolha visível, não um hábito.
        "noExplicitAny": "warn"
      }
      // ...mais um punhado de regras, cada uma escolhida por um motivo
      // específico — nunca "porque vieram no pacote".
    }
  }
}
```

O ESLint entra pra cobrir o resto: regras conscientes de tipos (voltamos
nisso mais adiante) que precisam da informação completa que só o compilador
do TypeScript tem, regras específicas de framework (hooks do React,
acessibilidade, convenções de rotas), e qualquer anti-padrão que o conjunto
curado do Biome deixa de fora de propósito. Normalmente isso vem do pacote
`typescript-eslint`, que junta o parser de TypeScript com as regras que
sabem usar informação de tipo, mais o plugin do framework que o projeto
usa.

## O formatador desligado, de propósito

Ligar um formatter automático pela primeira vez numa base de código grande,
que nunca passou por um, produz uma parede de diffs — milhares de linhas
mudadas em cada arquivo que ele toca, sem nenhuma relação com um bug real.
Isso enterra qualquer revisão de verdade que devesse estar acontecendo: o
revisor não consegue distinguir "o Biome trocou aspas simples por duplas"
de "essa linha mudou porque corrigiu um bug de verdade". Numa base assim,
deixar o formatter desligado — e documentar o porquê, no próprio arquivo de
configuração — é uma escolha legítima. Não é uma lacuna que precisa de
desculpa.

```jsonc
// biome.jsonc
{
  // Desligado de propósito: essa base de código é anterior à adoção do
  // Biome e nunca passou por um formatter automático. Rodar um
  // formatter pela primeira vez em milhares de arquivos nunca tocados
  // geraria uma parede de diffs só de formatação, sem nenhuma relação
  // com bugs reais — pior do que deixar desligado e explicar o porquê,
  // bem aqui.
  "formatter": {
    "enabled": false
  }
}
```

Repare que esse raciocínio vale especificamente pra base de código **já
existente e grande**. Se você está começando um projeto do zero — o
cenário do tutorial mais adiante — não existe "parede de diffs" pra evitar,
porque não existe histórico de arquivos nunca formatados. Nesse caso, ligar
o formatter desde o primeiro commit é o caminho mais simples: você nunca
paga o custo de formatar tudo de uma vez, porque cada arquivo já nasce
formatado.

```jsonc
// biome.jsonc — projeto novo, sem legado de formatação pra herdar
{
  "formatter": {
    "enabled": true
  }
}
```

## De aviso a erro: a promoção como ferramenta de migração

Uma regra nova não nasce bloqueando ninguém. Ela entra em `"warn"` (aviso)
em toda a base de código primeiro — o que deixa toda violação já existente
visível, sem quebrar o build de ninguém. A partir daí, a contagem de avisos
é um número real e rastreável, não um comentário do tipo "depois a gente
aperta isso" que ninguém nunca mais revisita. Só quando essa contagem chega
a zero é que a regra vira `"error"` — e fica assim.

```js
// eslint.config.js (trecho)
export default [
  {
    rules: {
      // Regra nova, introduzida em "warn" pra deixar a contagem de
      // violações visível sem travar ninguém agora. Vira "error"
      // quando a contagem chegar a zero.
      complexity: ["warn", 10],
    },
  },
];
```

`complexity` é uma regra do próprio ESLint que mede a **complexidade
ciclomática** de uma função: começa em 1 (o corpo da função, sem nenhum
desvio de fluxo) e soma mais um ponto a cada desvio — cada `if`/`else if`,
`case` de um `switch`, `&&`, `||`, `??`, laço (`for`/`while`) e operador
ternário (`? :`). O `10` no exemplo é o teto total, base já incluída: a
partir de 11 pontos, a função dispara a regra. Guarda esse número — ele
volta no Exemplo 2, mais adiante, com uma das pegadinhas mais surpreendentes
desse esquema todo.

Esse fluxo warn → error transforma uma promessa vaga numa migração com
critério de sucesso verificável por comando — exatamente o processo
detalhado em [ESLint warning burndown](../prompts/02-eslint-warning-burndown.md),
que descreve como planejar e executar a zeragem de uma contagem de avisos
sem introduzir mudanças silenciosas de comportamento pelo caminho.

## Fronteiras de arquitetura: barrando importações entre camadas

Regras de restrição de importação impedem que uma camada específica do
código importe outra camada específica diretamente. Dois exemplos comuns:
impedir que código de UI (telas, componentes) acesse um cliente de banco de
dados direto, sem passar pela camada que deveria orquestrar isso; ou
impedir que qualquer camada pule a camada de domínio e vá direto numa
camada de infraestrutura de baixo nível. A ideia central: a dependência
entre camadas só pode andar numa direção combinada — nunca na direção
oposta, mesmo que tecnicamente desse pra escrever o import e ele
funcionasse.

Um truque útil quando parte dessas violações já existe espalhada pela base
de código: registrar a **mesma** regra de restrição duas vezes, sob dois
nomes diferentes, cada um com uma severidade diferente. Uma cópia fica em
`"error"` — fronteiras que o time se comprometeu a nunca mais cruzar. A
outra cópia, apontando pro mesmo tipo de violação, mas num conjunto
diferente e já conhecido de arquivos antigos, fica em `"warn"` — visível,
rastreada como dívida, sem travar a build inteira agora.

Isso funciona porque, no arquivo de configuração do ESLint, o bloco de
regras é só um objeto chave-valor: você não pode escrever a mesma chave
`"local/no-cross-layer-import"` duas vezes no mesmo bloco com severidades
diferentes — a segunda simplesmente sobrescreveria a primeira. A saída é
registrar a mesma função de regra sob dois nomes diferentes dentro do seu
plugin local, e então usar cada nome com sua própria severidade:

```js
// eslint-plugin-local/index.js — uma implementação, dois IDs de regra
import noCrossLayerImport from "./rules/no-cross-layer-import.js";

export default {
  rules: {
    "no-cross-layer-import": noCrossLayerImport, // usada em "error"
    "no-cross-layer-import-legacy": noCrossLayerImport, // usada em "warn"
  },
};
```

```js
// eslint.config.js (trecho)
import local from "./eslint-plugin-local/index.js";

export default [
  {
    plugins: { local },
    rules: {
      // Fronteiras que o time se comprometeu a nunca mais cruzar.
      "local/no-cross-layer-import": ["error", { from: "ui", to: "database" }],
      // Mesma regra, mesma lógica — um conjunto diferente e já
      // conhecido de violações, ainda sendo pago aos poucos. Visível,
      // sem travar a build.
      "local/no-cross-layer-import-legacy": ["warn", { from: "ui", to: "infra-adapters" }],
    },
  },
];
```

`from` e `to` nesse exemplo são opções ilustrativas — uma implementação
real desse tipo de regra normalmente inspeciona cada nó `ImportDeclaration`
da AST (a árvore que representa a estrutura do código; explicamos isso com
mais calma na próxima seção), confere se o arquivo atual bate com o padrão
de `from` e se o caminho importado bate com o padrão de `to`, e só reporta
quando os dois batem ao mesmo tempo.

Antes de escrever essa regra do zero, vale checar se um plugin pronto já
resolve: `eslint-plugin-boundaries` e a regra `import/no-restricted-paths`
do `eslint-plugin-import` cobrem esse mesmo problema pra boa parte dos
casos comuns. Escrever uma regra própria compensa quando o formato de
camadas do seu projeto foge do que esses plugins esperam — o que nos leva
à próxima seção.

## Regras de lint caseiras

Regra da comunidade cobre o caso geral. Cedo ou tarde, toda base de código
de verdade esbarra numa lacuna que nenhum plugin publicado cobre — algo
específico demais pro seu domínio pra alguém já ter escrito uma regra
genérica pra isso. Nesse ponto, escrever uma regra pequena e caseira
compensa mais do que continuar sem nenhuma checagem automática pra aquele
anti-padrão. Categorias comuns de regra caseira — como exemplos
ilustrativos da categoria, não uma lista fechada nem algo tirado de um
projeto real específico:

- um teto de tamanho de linhas por arquivo;
- uma proibição de `console.*` solto em código de produção;
- uma proibição de acessar um cliente ou recurso de baixo nível fora da
  camada que deveria ser a única com acesso a ele;
- uma proibição de aritmética de ponto flutuante pra valores monetários
  (`0.1 + 0.2` não dá exatamente `0.3` em ponto flutuante — valor de
  dinheiro pede um tipo decimal ou centavos como inteiro, não `number`
  direto);
- uma regra exigindo checagem de autenticação antes de qualquer mutação
  numa rota de API;
- uma regra exigindo um limite máximo de caracteres em todo campo de texto
  que o usuário preenche.

A forma mínima de uma delas:

```js
// rules/no-console-in-production.js
module.exports = {
  meta: { type: "problem" },
  create(context) {
    return {
      "CallExpression[callee.object.name='console']"(node) {
        context.report({
          node,
          message: "Use o logger compartilhado, não console.*, em código de produção.",
        });
      },
    };
  },
};
```

Pra quem nunca escreveu uma regra de ESLint, cada parte desse arquivo:

- **`meta.type`** classifica a regra pro ESLint e pras ferramentas que
  geram documentação a partir dela — `"problem"` significa "isso
  provavelmente é um bug", diferente de `"suggestion"` (estilo) ou
  `"layout"` (espaçamento).
- **`create(context)`** é o corpo da regra. Ele devolve um objeto cujas
  chaves são **seletores de AST**. Pense numa AST (*Abstract Syntax Tree*,
  ou árvore de sintaxe abstrata) como o código decomposto numa árvore de
  nós: uma chamada de função é um nó, uma declaração de variável é outro,
  um `if` é outro. Um seletor de AST funciona parecido com um seletor CSS,
  só que em vez de escolher elementos HTML ele escolhe nós dessa árvore.
- **`"CallExpression[callee.object.name='console']"`** lê-se: "qualquer nó
  do tipo *chamada de função*, cujo alvo da chamada é uma propriedade de um
  objeto chamado literalmente `console`" — ou seja, `console.log(...)`,
  `console.error(...)`, `console.warn(...)`, qualquer `console.<o-que-for>(...)`.
- **`context.report({...})`** é o que efetivamente gera o aviso ou erro,
  com a mensagem que o desenvolvedor vai ver no terminal ou no editor.

Isso é o suficiente pra cobrir a maioria das regras caseiras simples —
qualquer coisa mais elaborada, como a regra de fronteira de arquitetura da
seção anterior, segue a mesma forma, só com um seletor mais específico e
um pouco mais de lógica de checagem dentro do `create`.

## Lint consciente de tipos, fora do caminho rápido

Regras "conscientes de tipos" (*type-aware*) são as que precisam da
informação completa que só o compilador do TypeScript enxerga — não
apenas a sintaxe de um arquivo isolado, mas o tipo real de cada valor,
inferido a partir do projeto inteiro. É o tipo de regra capaz de perceber
que uma função `async` está sendo chamada em algum lugar sem `await`, ou
que uma comparação está comparando dois tipos que nunca poderiam ser
iguais. Pra isso, o ESLint precisa montar um programa TypeScript completo
por trás dos panos — o mesmo trabalho pesado que o `tsc` faz — o que é
ordens de grandeza mais lento do que uma regra puramente sintática, que só
olha a árvore de um arquivo por vez.

Numa base de código grande, vale manter esse nível de checagem **fora** do
script de lint padrão e fora do pre-commit hook (o script que roda
automaticamente antes de cada commit ser criado, podendo bloqueá-lo) de
propósito — senão todo commit, até o mais trivial, paga o custo de montar
o programa TypeScript inteiro. Em vez disso, esse nível roda como comando
manual separado, ou só na esteira de CI (integração contínua — o pipeline
que roda automaticamente a cada push ou pull request, numa máquina separada
da sua):

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:types": "eslint . --config eslint.type-aware.config.js"
  }
}
```

`lint` roda rápido e pode travar commit — é o que todo mundo roda o tempo
todo, sem pensar duas vezes. `lint:types` roda na CI (ou por comando manual,
quando alguém realmente precisa), não em todo commit. Essa diferença de
propósito entre os dois scripts é o que faz o esquema funcionar sem virar
atrito: o rápido bloqueia cedo, o lento roda em segundo plano.

## Tutorial: montando esse esquema do zero, no seu projeto

O resto do texto explicou o raciocínio por trás de cada peça. Essa seção
monta as peças, em ordem, num projeto TypeScript novo — ajuste nomes de
pacote e regras pro seu próprio framework onde for o caso.

Se preferir delegar esse tutorial inteiro pra um agente de código,
[`07-eslint-complete-setup.md`](../prompts/07-eslint-complete-setup.md) é
a versão em formato de prompt — cobre a mesma filosofia, mais fronteiras
de arquitetura, regras caseiras e o tier de lint consciente de tipo,
prontos pra colar num agente e adaptar aos placeholders do seu projeto.

### 1. Instalar as duas ferramentas

```bash
npm install --save-dev eslint typescript typescript-eslint
npm install --save-dev --save-exact @biomejs/biome
```

`typescript-eslint` traz, num pacote só, o parser que ensina o ESLint a
entender sintaxe TypeScript e os conjuntos de regras (incluindo as
conscientes de tipo) que vamos usar no passo 4. O `--save-exact` no Biome
fixa a versão exata no `package.json`, em vez de um intervalo — evita que
uma regra mude de comportamento sozinha num `npm install` de outra pessoa,
num dia qualquer, sem ninguém decidir isso de propósito.

### 2. Iniciar e curar a configuração do Biome

```bash
npx @biomejs/biome init
```

Isso cria um `biome.json` (troque a extensão pra `.jsonc` — e ajuste a
referência no `package.json` — se quiser poder escrever comentários) com o
preset `"recommended"` ligado. Troque pra `"recommended": false` e
adicione, um por um, só os grupos e regras que você realmente decidiu
usar — como no exemplo curado da seção "Regras curadas no Biome, cobertura
pesada no ESLint", mais acima. Comece pequeno: duas ou três regras de
correção óbvia (`noUnusedVariables` é um bom primeiro passo) já valem mais
do que duzentas regras que ninguém vai revisar uma por uma.

### 3. Decidir sobre o formatter

Projeto novo, começando do zero agora? Deixe o formatter do Biome ligado
desde o primeiro commit — é a opção padrão depois do `init`, e não custa
nada num projeto que ainda não tem arquivo nenhum fora do padrão. Só
desligue e documente o porquê (seção "O formatador desligado, de
propósito", mais acima) se você estiver **importando** uma base de código
grande e já existente que nunca passou por formatter nenhum.

### 4. Configurar o ESLint com TypeScript e regras conscientes de tipo

```js
// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Regras próprias entram aqui, por cima do que os presets já
      // trazem — os presets são o ponto de partida, não a palavra
      // final.
    },
  },
);
```

`tseslint.configs.recommendedTypeChecked` já traz as regras conscientes de
tipo mais estabelecidas do ecossistema TypeScript. `parserOptions.projectService: true`
é o que liga o motor de checagem de tipo por trás das regras — sem essa
linha, qualquer regra que precise de tipo simplesmente não roda.
`tsconfigRootDir: import.meta.dirname` diz pro ESLint onde fica a raiz do
projeto, pra ele achar o `tsconfig.json` certo. Esse é o nível mais pesado
do lint — o passo 6 mostra como mantê-lo fora do caminho rápido.

### 5. Instalar o plugin do seu framework, se tiver um

Se o projeto usa React, Vue, ou outro framework com convenções próprias
(regras de hooks, acessibilidade, convenções de rotas), instale o plugin
de ESLint dele agora e estenda o mesmo array de configuração do passo 4.
Esse plugin entra por cima dos presets base — mesma lógica de "presets são
ponto de partida, não palavra final".

### 6. Separar o script rápido do script consciente de tipo

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:types": "eslint . --config eslint.type-aware.config.js"
  }
}
```

Se você colocou as regras conscientes de tipo direto no `eslint.config.js`
principal (passo 4), pode manter só um script — mas aí todo
`npm run lint` paga o custo pesado. Pra times que sentem esse custo, o
padrão mais comum é separar num segundo arquivo de configuração
(`eslint.type-aware.config.js`, estendendo o principal) e só rodar
`lint:types` na CI ou por comando manual. Veja "Lint consciente de tipos,
fora do caminho rápido", mais acima, pro raciocínio completo.

### 7. Conectar o lint rápido a um pre-commit hook

Com o script rápido isolado, conectá-lo a um pre-commit hook (com `husky`,
`lefthook`, ou o gerenciador de hooks que seu projeto já usa) fica seguro
— ele roda em menos de um ou dois segundos na maioria dos projetos, porque
só faz checagem sintática. `lint:types` fica de fora do hook e entra só na
esteira de CI, rodando em paralelo com os outros checks, sem atrasar o
commit de ninguém.

### 8. Introduzir a primeira regra nova em modo aviso

```js
// eslint.config.js (trecho)
export default [
  {
    rules: {
      complexity: ["warn", 10],
    },
  },
];
```

Rode `npm run lint` e anote a contagem de avisos atual — esse número é o
ponto de partida da migração, não um detalhe descartável. A partir daqui,
siga o processo de [ESLint warning burndown](../prompts/02-eslint-warning-burndown.md)
pra planejar a zeragem antes de trocar `"warn"` por `"error"`.

### 9. Aplicar fronteiras de arquitetura, se o projeto tiver camadas

Se o seu projeto já separa camadas (UI, domínio, infraestrutura, o que
for) e você quer impedir que uma pule direto pra outra, siga a técnica de
dupla severidade da seção "Fronteiras de arquitetura", mais acima — ou
comece pelos plugins prontos (`eslint-plugin-boundaries`,
`import/no-restricted-paths`) antes de escrever uma regra própria.

### 10. Escrever sua primeira regra caseira, só quando fizer falta de verdade

Não comece por aqui. Regra caseira é o último recurso da lista, depois de
confirmar que nenhuma regra do Biome, do ESLint, ou de um plugin de
comunidade já cobre o anti-padrão que você quer travar. Quando chegar essa
hora, a seção "Regras de lint caseiras", mais acima, tem o formato mínimo
de uma.

## Exemplos concretos: as pegadinhas na prática

As cinco pegadinhas mais surpreendentes desse esquema de dois linters, uma
por uma — o código que dispara o problema, o que está por trás do que o
linter reporta, e como resolver de verdade, não só calar o aviso.

### Exemplo 1 — a regex "seguramente insegura"

Uma regra de segurança comum tenta detectar regex vulnerável a **ReDoS**
(*Regular Expression Denial of Service* — uma expressão regular que, pra
certas entradas, trava exponencialmente mais tempo pra processar quanto
maior a entrada). O jeito mais simples de implementar essa detecção é uma
heurística: procurar por dois ou mais grupos de quantificador (`+`, `*`,
`{n,m}`) na mesma expressão regular. Implementações desse tipo — a regra
`security/detect-unsafe-regex`, do pacote `eslint-plugin-security`, é um
exemplo conhecido — historicamente disparam nesse padrão mesmo quando cada
quantificador já está bem delimitado.

```js
// Pode disparar a regra "regex insegura" mesmo sendo inofensiva: dois
// grupos de quantificador em sequência na mesma expressão, cada um já
// com um teto de repetição.
const CODE_PATTERN = /^[A-Z]{2,4}-[0-9]{1,6}$/;
```

`{2,4}` e `{1,6}` já são limitados — não tem como essa regex reprocessar o
mesmo trecho de string de forma exponencial, porque cada grupo tem um teto
fixo de repetições. Mesmo assim, a heurística olha só pra forma sintática
("quantificador em sequência com outro quantificador"), não pro tamanho
real dos tetos, e marca como suspeita.

O conserto que parece óbvio — apertar ainda mais os limites, trocando
`{1,6}` por `{1,4}`, por exemplo — não resolve nada, porque a heurística
nunca olhou pro tamanho do teto, só pra presença de dois grupos em
sequência. O conserto de verdade é reestruturar em expressões separadas,
cada uma com um único quantificador, e compor o resultado em código comum:

```js
// Resolve de verdade: cada regex tem só um quantificador; a checagem
// composta acontece em código comum, não numa regex só.
const PREFIX_PATTERN = /^[A-Z]{2,4}$/;
const SUFFIX_PATTERN = /^[0-9]{1,6}$/;

function isValidCode(value) {
  const [prefix, suffix] = value.split("-");
  return Boolean(
    prefix && suffix && PREFIX_PATTERN.test(prefix) && SUFFIX_PATTERN.test(suffix),
  );
}
```

### Exemplo 2 — complexidade ciclomática inflada por encadeamento opcional

Regras de complexidade ciclomática, incluindo a `complexity` do ESLint
usada no exemplo do warn → error mais acima, costumam contar encadeamento
opcional (`?.`) como um ponto de ramificação completo — o mesmo peso de um
`&&`, um `||`, ou um ternário. Faz sentido tecnicamente (`a?.b` é, por
baixo dos panos, bem parecido com `a && a.b`), mas na prática pega gente de
surpresa: uma função com vários acessos opcionais encadeados bate no teto
de complexidade bem antes do que qualquer contagem visual de `if`/`else`
sugeriria.

```js
// Só tem UM "if" de verdade — mas, pra maioria dessas regras, cada
// "?." e cada "??" também soma um ponto de ramificação.
function getShippingCity(order) {
  if (!order) return null;

  return (
    order.customer?.address?.city ??
    order.customer?.billingAddress?.city ??
    order.warehouse?.address?.city ??
    "desconhecida"
  );
}
```

Contando do jeito que a maioria dessas regras conta — 1 de base pra função
em si, mais 1 por desvio de fluxo —, essa função soma: 1 (base) + 1 (o
`if`) + 6 (seis `?.`, dois por linha em três linhas) + 3 (três `??`, um por
linha) = **11**. Isso já passa do teto de 10 configurado no exemplo do
warn → error, lá em cima — a regra dispara nessa função, mesmo ela lendo
como um `if` só, seguido de três alternativas de fallback.

A correção não é reescrever a lógica — é reconhecer que o teto de
complexidade da regra precisa ser calibrado sabendo que `?.` e `??` também
contam, e que uma função assim (fallback em cascata sobre campos
opcionais) é candidata a virar uma pequena função utilitária testada à
parte, em vez de uma corrente longa de `?.`/`??` dentro de um único
`return`.

### Exemplo 3 — a extração que corrige um aviso e cria outro

Um teto rígido de linhas por arquivo (por exemplo, 400 linhas) pode deixar
vários arquivos sentados bem em cima do limite, sem nenhuma folga. Nesse
cenário, uma extração de rotina — tirar um trecho de função e botar num
arquivo separado pra resolver UM aviso de tamanho — pode empurrar o
arquivo de destino da extração pra cima do próprio teto, criando uma
violação nova, num arquivo que nem fazia parte do problema original.

- `arquivo-a.ts` — 399 linhas (1 linha de folga até o teto de 400)
- `arquivo-b.ts` — 396 linhas (4 linhas de folga até o teto de 400)

Uma extração ingênua — mover uma função de `arquivo-a.ts` pra
`arquivo-b.ts`, junto com um `import` novo, uma linha de export e uma
linha em branco — pode tirar `arquivo-a.ts` do vermelho e empurrar
`arquivo-b.ts` pra 401, 402 linhas. O aviso original some; um aviso novo
aparece num arquivo que, até ali, nem estava na sua lista. Por isso a
única forma confiável de saber se uma refatoração resolveu (ou criou) um
problema de tamanho é rodar o linter de novo, depois da mudança — nunca
contar linha manualmente, nem confiar numa estimativa de quanto a extração
"deveria" render.

Quando o arquivo já está no teto, a ordem de preferência pra resolver, do
mais barato pro mais caro:

1. **Um closure aninhado sem parâmetros** — uma função interna, declarada
   dentro da que já existe, sem passar nada por parâmetro (ela já enxerga
   tudo do escopo em volta). Custa poucas linhas e não mexe na assinatura
   pública de nada.
2. **Um closure de guarda** — extrair só a checagem de guarda
   (`if (!condição) return`) pra uma função pequena, reduzindo repetição
   sem tocar na lógica principal.
3. **Compactar o código existente** — juntar linhas que só existem por
   formatação (por exemplo, um `return` que podia estar na mesma linha da
   condição), sem mudar nada de comportamento.
4. **Dividir o arquivo em dois** — só como último recurso, porque cria um
   arquivo novo, exige decidir um nome e um limite de responsabilidade
   novos, e é o tipo de mudança que merece revisão própria, não um efeito
   colateral de resolver um aviso de lint.

### Exemplo 4 — o tipo de retorno que muda sozinho ao extrair uma função

```ts
// Escrito assim, inline, o TypeScript costuma inferir um tipo de
// retorno bem preciso: a união discriminada por "status", sem "data"
// nenhuma aparecendo (nem opcional) no branch de erro.
const parseResult = (input: string) => {
  if (input.length === 0) {
    return { status: "error" as const };
  }
  return { status: "ok" as const, data: input.trim() };
};

// Tipo inferido: (input: string) =>
//   { status: "error" } | { status: "ok"; data: string }
```

Quem chama essa função e faz `if (result.status === "ok")` ganha o
estreitamento automático de tipo: dentro do `if`, o TypeScript sabe que
`result.data` existe e é `string`, sem checagem extra nenhuma.

```ts
// A MESMA lógica, extraída pra uma função nomeada separada — parece um
// refactor puramente mecânico, sem risco.
function parseInput(input: string) {
  if (input.length === 0) {
    return { status: "error" as const };
  }
  return { status: "ok" as const, data: input.trim() };
}

// Em algumas situações, o tipo inferido perde a precisão por branch e
// vira algo mais largo:
//   (input: string) => { status: "error" | "ok"; data?: string }
```

O formato mudou de uma união discriminada de dois formatos distintos pra
um formato único com um campo `data` opcional. Pro código que chama a
função, isso é uma mudança silenciosa: `result.data` deixa de ser
garantido dentro do `if (result.status === "ok")`, porque o TypeScript não
tem mais dois formatos pra discriminar — tem um formato só, com um campo
que pode ou não estar lá. Todo lugar que dependia do estreitamento
automático ganha um erro de tipo — não no arquivo que você acabou de
editar, mas em qualquer arquivo distante que chama essa função. Na hora da
extração em si, nada acusa problema: o editor não sublinha nada, a própria
função extraída compila limpo. O erro só aparece nos **call sites**
(pontos de chamada), possivelmente em arquivos que você nem abriu.

Isso não acontece sempre — depende de como cada função específica é
escrita e de qual versão do compilador está em uso —, mas acontece com
frequência suficiente pra virar hábito: antes de extrair uma função onde
cada branch devolve um objeto literal com formato ligeiramente diferente,
faça um grep por toda chamada dela primeiro, e depois da extração rode o
typecheck do projeto inteiro — não só do arquivo que mudou — antes de
considerar a extração pronta.

### Exemplo 5 — a propriedade abreviada que o script de análise não resolve

Ferramentas customizadas que andam pela AST — por exemplo, um script feito
em casa que varre o código procurando por um padrão específico usando a
API do compilador do TypeScript ou o parser do ESLint — costumam tratar
`{ x: valor }` (propriedade explícita) e `{ x }` (propriedade abreviada,
quando o nome da propriedade é igual ao da variável) como se fossem
estruturas diferentes na árvore, mesmo sendo semanticamente idênticas. Um
script que sabe seguir o valor atribuído em `x: valor` mas não sabe que
`{ x }` é exatamente a mesma coisa, só escrita de forma curta, vai deixar
de detectar — ou de resolver o valor — em qualquer lugar que use a forma
abreviada.

```js
const port = 8080;

// Um script de análise que só sabe ler a forma explícita encontra o
// valor aqui sem problema:
const configExplicito = { port: port };

// ...mas não resolve o valor aqui — mesmo sendo o MESMO "port", com o
// MESMO valor, só escrito na forma abreviada:
const configAbreviado = { port };
```

Na AST, `{ port: port }` normalmente aparece como um nó `Property` com
`key` e `value` sendo dois nós distintos (mesmo tendo o mesmo nome).
`{ port }` também é um nó `Property`, mas com uma marcação
`shorthand: true` — e um script escrito assumindo que sempre existe uma
`key` e um `value` claramente separados pode não checar essa marcação, ou
pode assumir, errado, que uma propriedade abreviada não carrega valor
nenhum pra resolver. O resultado é uma ferramenta que passa nos testes que
você escreveu (se todos usarem a forma explícita) e falha silenciosamente
em produção, onde a forma abreviada é comum. Vale a pena escrever, de
propósito, um caso de teste com propriedade abreviada em qualquer
ferramenta de análise via API de compilador que você construir — não é um
caso extremo raro, é a forma que a maioria dos desenvolvedores escreve por
padrão quando o nome já bate.

## Pegadinhas conhecidas (resumo rápido)

Recapitulando os cinco exemplos acima, em formato de referência rápida —
pra quando você já leu o raciocínio completo uma vez e só precisa lembrar
o resumo.

- **Heurística de "regex insegura" pode disparar em qualquer expressão
  regular com dois ou mais quantificadores em sequência**, mesmo quando
  cada um já está bem delimitado. O conserto de verdade é reestruturar em
  expressões separadas de quantificador único — apertar ainda mais os
  limites não resolve nada, porque a heurística nunca olhou pro tamanho do
  teto (Exemplo 1).
- **Regra de complexidade ciclomática pode contar encadeamento opcional
  (`?.`) como ponto de ramificação completo** — o mesmo peso de `&&`,
  `||` ou um ternário. Uma função com vários `?.` encadeados bate no teto
  de complexidade bem antes do que um "olhômetro" de `if`/`else`
  sugeriria (Exemplo 2).
- **Teto rígido de linhas por arquivo pode deixar arquivos exatamente no
  limite, sem folga nenhuma.** Uma extração feita pra resolver um aviso
  pode criar, sem querer, uma violação nova em outro arquivo. Sempre
  reverifique com o linter de verdade depois de qualquer refatoração —
  nunca contando linha manualmente. Ordem de preferência pra resolver:
  closure aninhado sem parâmetro → closure de guarda → compactar código
  existente → dividir o arquivo em dois, só como último recurso
  (Exemplo 3).
- **Função onde toda ramificação devolve um objeto literal pode ter o
  tipo de retorno inferido mudando silenciosamente ao ser extraída pra uma
  função nomeada separada.** Alguns cenários de inferência só preservam a
  precisão por branch quando tudo fica inline, e perdem essa precisão numa
  assinatura de função separada — quebrando o typecheck de quem chama,
  longe do arquivo que você editou, sem nenhum aviso na hora da extração.
  Sempre faça grep de todo ponto de chamada antes de extrair uma função
  nesse formato (Exemplo 4).
- **Script de análise via AST feito à mão pode não resolver valores
  através de propriedades abreviadas de objeto** (`{ x }` vs. `{ x: x }`
  explícito). Vale escrever um caso de teste dedicado pra isso em
  qualquer ferramenta customizada via API de compilador que você
  construir (Exemplo 5).

## Perguntas frequentes

**Preciso usar os dois linters, ou dá pra escolher só um?**

Dá, tecnicamente — ESLint sozinho, com `typescript-eslint` e os plugins
certos, cobre praticamente tudo que o Biome cobriria também. A divisão em
duas ferramentas compensa principalmente pela velocidade: o Biome roda seu
subconjunto pequeno de regras quase instantaneamente, o que faz sentido
usar justamente nas checagens que você quer rodando o tempo inteiro, a
cada salvamento de arquivo. Se seu projeto é pequeno, ou você prefere uma
configuração só, ESLint sozinho funciona — você só abre mão do ganho de
velocidade do Biome nas checagens mais frequentes.

**E se meu projeto for pequeno — vale a pena esse tanto de configuração?**

Pra um projeto pequeno, comece só com ESLint e um preset recomendado
pronto (do próprio `typescript-eslint`, por exemplo) — sem curar regra por
regra, sem separar tier consciente de tipo, sem regra caseira nenhuma.
Essa divisão inteira em duas ferramentas com regras curadas resolve um
problema de escala: muitos arquivos, muitos avisos, muito tempo de lint.
Nenhum desses problemas existe ainda num projeto pequeno. Vale revisitar
essa estrutura quando o `npm run lint` começar a demorar de verdade, ou
quando o preset genérico começar a atrapalhar mais do que ajudar — não
antes disso.

**Como decido se um anti-padrão vira regra customizada, ou se deixo sem
checagem automática?**

Antes de escrever qualquer coisa: procure se um plugin de comunidade já
cobre esse caso — pra fronteira de arquitetura, por exemplo,
`eslint-plugin-boundaries` cobre boa parte antes de precisar de código
próprio. Escreva uma regra caseira quando as três coisas forem verdade ao
mesmo tempo: (1) nenhum plugin publicado cobre o caso; (2) o anti-padrão já
causou um bug real, ou é específico o bastante do seu domínio (dinheiro,
autenticação, um recurso de baixo nível) que vale travar antes que cause
um; e (3) o padrão é mecânico o suficiente pra detectar via AST — se a
checagem depende de julgamento humano ou de contexto de negócio que o
código sozinho não expõe, uma regra de lint não é a ferramenta certa.

**Dá pra aplicar esse esquema todo de uma vez, num projeto grande que já
existe?**

Não de uma vez — é basicamente o oposto do que esse documento defende. A
sequência seria: primeiro, decidir sobre o formatter (ligar sofre o custo
da parede de diffs; desligar e documentar é válido). Depois, instalar
Biome e ESLint com um conjunto mínimo de regras que **já passam limpo**
hoje — comece de onde a base de código realmente está, não de onde você
gostaria que ela estivesse. Só então, uma regra nova de cada vez, sempre
em `"warn"` primeiro, seguindo o processo de
[ESLint warning burndown](../prompts/02-eslint-warning-burndown.md) até a
contagem zerar, antes de promover pra `"error"`. Aplicar tudo de uma vez,
incluindo regras que a base de código ainda viola em centenas de lugares,
é a receita pra alguém desabilitar o linter inteiro na primeira
sexta-feira de prazo apertado.

## O caminho executável: os arquivos prontos

Tudo acima é o raciocínio — por que duas ferramentas, por que aviso vira
erro, por que a fronteira de arquitetura mora no lint. Se você quer o
resultado sem reconstruir o raciocínio, os arquivos que rodam estão em
[`templates/eslint/`](../../templates/eslint/): as três regras próprias já
escritas e testadas (teto de tamanho de arquivo, console direto, acesso
direto ao banco a partir da camada de apresentação), os dois esqueletos de
configuração, e um verificador que prova que a cópia chegou íntegra.

Você não precisa ler esses arquivos pra usá-los. Dois prompts fazem o
trabalho, nessa ordem:

1. [`08-eslint-quality-gates-install.md`](../prompts/08-eslint-quality-gates-install.md)
   — o agente baixa as regras, adapta a configuração pra estrutura real do
   seu projeto, roda o verificador e reporta quantas violações existem por
   regra. Ele não conserta nada.
2. [`09-file-size-refactor.md`](../prompts/09-file-size-refactor.md) — o
   agente pega os arquivos que estouraram o teto de 350 linhas e os quebra
   em módulos menores, um arquivo por vez, com testes rodando entre cada
   um.

O primeiro instala a régua e mede; o segundo é o trabalho que a medição
revelou.
