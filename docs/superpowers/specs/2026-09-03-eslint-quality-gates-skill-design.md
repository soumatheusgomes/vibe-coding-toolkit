# Skill de quality gates de ESLint — design

Data: 2026-09-03

## Problema

O toolkit documenta bem a filosofia de lint que ele defende: o
[doc 06](../../tools/06-eslint-biome-quality-gates.md) explica o porquê em 840
linhas, e o [prompt 07](../../prompts/07-eslint-complete-setup.md) descreve o
setup em 611 linhas de prosa portável. Nenhum dos dois entrega código que roda.
As regras de lint próprias — a parte mais difícil de reproduzir do zero — são
descritas como padrão a replicar, então cada execução do prompt produz uma
implementação diferente, e nada garante que ela funcione.

O objetivo desta skill é fechar essa lacuna: uma pessoa clona o toolkit, aponta
o agente dela para a pasta da skill e diz "instala isso aqui" — e o projeto sai
com ESLint configurado e três regras próprias que já foram testadas.

## Escopo

**Entra:** ESLint apenas, e apenas regras que fazem sentido para qualquer
negócio. Três regras próprias, um esqueleto de configuração em duas camadas
(rápida e consciente de tipos), fronteiras de arquitetura por caminho, e um
verificador que prova que as regras funcionam.

**Não entra:** Biome (o pedido foi ESLint); o burndown de avisos, já coberto
pelo [prompt 02](../../prompts/02-eslint-warning-burndown.md); e as regras do
projeto de origem que dependem de domínio — as duas de React/shadcn, as duas de
Next.js App Router e a de aritmética monetária.

## Origem e genericização

As regras vêm de um projeto privado de produção. Nenhum nome, identificador ou
termo de domínio daquele projeto sobrevive à extração: o namespace do plugin
passa a ser `quality`, as mensagens perdem o prefixo de marca, e todo caminho,
módulo ou binding que estava fixo no código vira opção de configuração.

## Estrutura

```
templates/skills/eslint-quality-gates/
  SKILL.md                         # procedimento que o agente segue (inglês)
  eslint-rules/
    utils.cjs                      # helpers de caminho
    core-rules.cjs                 # as três regras
    index.cjs                      # entrada do plugin
  eslint.config.mjs.example        # esqueleto da camada rápida
  eslint.typed.config.mjs.example  # camada consciente de tipos
  verify.mjs                       # self-check via RuleTester
```

`SKILL.md` fica em inglês, como todo bloco de prompt do repositório; a
explicação em português vive nos docs que apontam para a skill.

## As três regras

### `quality/max-lines`

Teto de tamanho por arquivo, com uma mensagem que sugere para onde extrair o
excesso (lógica de negócio, blocos de UI repetidos, acesso a dados, grupos de
helpers). Opções: `max` (padrão 350), `ignore` (lista de caminhos com baseline
tolerado) e `includeTests` (padrão `false`).

Arquivos que a regra nunca checa por padrão: `.d.ts`, arquivos de teste e mock,
arquivos de configuração, e arquivos-barril de tipos/constantes — um `index.ts`
que só reexporta não tem tamanho que signifique alguma coisa. Diretórios
gerados, `node_modules`, builds e migrações também ficam de fora.

Com `includeTests: true`, arquivos de teste voltam a ser checados; é assim que
se liga a mesma regra em `warn` para testes num bloco separado, sem afrouxar o
`error` de produção.

### `quality/no-direct-console`

Proíbe saída direta no console fora dos adaptadores de log. Opções: `allow`
(métodos liberados, padrão vazio) e `logger` (nome do helper do projeto, usado
só no texto da mensagem — padrão genérico se não informado).

Arquivos de teste são isentos dentro da regra. Os adaptadores de log do projeto
— o wrapper que de fato chama o console, e qualquer script que precise logar
antes da infraestrutura existir — são isentos por override de glob na
configuração, não por lista fixa dentro da regra.

### `quality/no-direct-data-access`

Impede que camadas de apresentação importem o cliente de banco diretamente.
Todas as quatro decisões que estavam fixas no código viram opção:

- `modules`: especificadores de import que contam como o módulo de dados
- `bindings`: nomes importados que contam como o cliente (importar o default ou
  o namespace sempre conta)
- `layers`: trechos de caminho que marcam as camadas vigiadas
- `extensions`: sufixos de arquivo que marcam camada de apresentação
  independente do caminho

Sem `modules` configurado a regra não faz nada — é uma regra que exige
configuração, e falhar em silêncio é melhor do que adivinhar a estrutura do
projeto errado.

Esta regra checa o binding pelo nome; a fronteira por caminho é trabalho do
`import-x/no-restricted-paths` no esqueleto de configuração. As duas se
sobrepõem de propósito: uma pega `import { db } from "..."`, a outra pega
qualquer arquivo da camada errada tocando a pasta errada.

## Esqueleto de configuração

A camada rápida compõe, nesta ordem: recomendações do `@eslint/js`, preset
`strict` do `typescript-eslint`, plugin `quality`, orçamento de tamanho e
complexidade, fronteiras de arquitetura, override para arquivos de teste e a
lista de ignorados.

O orçamento de complexidade entra todo em `warn` — `complexity` 12, `max-depth`
4, `max-statements` 20, `max-params` 4, `max-lines-per-function` 150 e
`max-nested-callbacks` 3. Nos arquivos de teste, `max-statements`,
`max-lines-per-function` e `max-nested-callbacks` são desligados: eles disparam
em massa no aninhamento de `describe`/`it` sem apontar problema real.
`complexity`, `max-depth` e `max-params` continuam valendo lá.

As fronteiras usam `import-x/no-restricted-paths` com um detalhe que vale
carregar: o mesmo pacote é registrado uma segunda vez sob outra chave de plugin,
o que dá às zonas um segundo identificador de regra e, com isso, uma severidade
própria. É o único jeito de ter zonas em `error` e zonas em `warn` ao mesmo
tempo — o flat config não mistura severidade dentro de um mesmo array `zones`,
e dois blocos que casam com os mesmos arquivos se substituem em vez de somar. A
chave em `warn` é onde mora a dívida de fronteira que já existe no projeto; a
chave em `error` é o que não pode regredir.

Blocos de framework — Next.js, React, hooks, jsx-a11y, plugin do ORM,
`eslint-plugin-security` — ficam no arquivo comentados, uma linha por bloco,
para o agente descomentar quando detectar a stack. Assim o esqueleto serve a um
projeto Node puro sem carregar dependência que ele não usa.

Os comentários de porquê do arquivo original vêm junto, genericizados,
incluindo quatro pegadinhas que só aparecem depois de apanhar delas:

1. `except` é relativo a `from`, não é um caminho independente — não dá para
   isentar o importador por ali; restrinja o `target`.
2. Um barril que é irmão da pasta (`repositories.ts` ao lado de
   `repositories/`) não casa com `repositories/**/*`; precisa da entrada
   separada.
3. `from` não aceita misturar glob com caminho literal — a regra passa a
   reportar erro de schema em todo arquivo que a zona tocar.
4. Ordem de bloco manda: um `off` colocado antes do bloco que liga a regra é
   sobrescrito em silêncio.

A camada consciente de tipos vive em `eslint.typed.config.mjs`, importa a
camada rápida e acrescenta as regras que precisam de informação de tipo, todas
em `warn`. São dois arquivos e dois scripts (`lint` e `lint:types`), não um
arquivo que ramifica em `process.env.CI`: ramificar faz o comportamento local e
o de CI divergirem em silêncio para o mesmo código, e ler `process.env` dentro
do próprio arquivo de configuração dispara o `no-undef` dele mesmo.

## Instalação pelo agente

`SKILL.md` é um procedimento numerado, não uma explicação. Na ordem: detectar a
stack pelo `package.json` e pelo `tsconfig.json`; instalar as dependências;
copiar `eslint-rules/` para a raiz do projeto; copiar o esqueleto e ajustar
globs, camadas e módulo de dados para a estrutura real; ligar os scripts;
rodar `verify.mjs`; rodar o ESLint e reportar a contagem.

A severidade inicial segue o estado do projeto. Projeto novo, ou projeto que já
sai limpo: `error`. Projeto com violações existentes: `warn`, com a contagem
registrada como baseline — a promoção para `error` é o que fecha a migração
depois, e é o mesmo raciocínio que o doc 06 já defende.

O agente não deve "consertar" as violações durante a instalação. Instalar e
medir é o entregável; a queima do backlog é outro trabalho, com prompt próprio.

## Verificação

`verify.mjs` usa o `RuleTester` do próprio ESLint com `node:test`, sem
framework de teste adicional. Cobre, por regra, um caso válido e um inválido,
mais as bordas que importam: arquivo de teste isento, `.d.ts` isento, barril
isento, `includeTests` ligado, `no-direct-data-access` sem `modules` não
reportando nada, e import de default ou namespace contando como binding.

Roda em qualquer projeto com ESLint 9 instalado:
`node .claude/skills/eslint-quality-gates/verify.mjs`. Serve como passo final
da instalação e como prova de que a cópia chegou íntegra.

## Documentação

Três ponteiros curtos, nenhum texto novo longo: uma seção no fim do doc 06
separando "o porquê está aqui, o código que roda está lá"; um item na lista de
`templates/` do README; e uma nota no prompt 07 dizendo que a skill é o caminho
executável para quem quer o resultado em vez do raciocínio.

## Critério de pronto

Uma pessoa clona o toolkit, aponta o agente dela para
`templates/skills/eslint-quality-gates/` num projeto JavaScript ou TypeScript
qualquer, e o projeto termina com ESLint rodando, as três regras ativas,
`verify.mjs` passando e uma contagem de violações reportada.
