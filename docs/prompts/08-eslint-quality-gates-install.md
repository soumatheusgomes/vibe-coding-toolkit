# Instalar os quality gates de ESLint (teto de 350 linhas)

## Quando usar

Use este prompt quando você quer, num projeto JavaScript ou TypeScript
qualquer, as três regras de lint que este toolkit defende — teto de
tamanho por arquivo, proibição de `console` direto e proibição de a
camada de apresentação importar o cliente do banco — já funcionando, sem
reconstruir o raciocínio por trás delas.

A diferença pro [`07-eslint-complete-setup.md`](07-eslint-complete-setup.md)
é o que cada um entrega. O 07 descreve os padrões em prosa e deixa o
agente escrever as regras do zero, adaptadas à sua stack: mais flexível,
mas cada execução produz um código diferente. Este aqui aponta o agente
pra três arquivos `.cjs` que já existem, já foram testados, e ele só
copia e conecta. Use o 07 quando quiser que o agente raciocine sobre a
sua stack inteira, incluindo regras de framework; use este quando quiser
o teto de 350 linhas valendo hoje.

Depois de instalar, o passo natural é
[`09-file-size-refactor.md`](09-file-size-refactor.md) — é ele que manda o
agente quebrar os arquivos que estouraram o teto.

## Por que funciona

A parte difícil de uma regra de lint caseira não é a ideia, é o código.
Uma regra escrita na hora, por descrição, erra em silêncio: ela isenta
arquivo de teste demais ou de menos, não sabe que um `index.ts` que só
reexporta não tem tamanho que signifique alguma coisa, e reporta em
posição errada. Nenhum desses erros aparece como falha — aparece como uma
regra que "não pega nada" ou que "pega tudo", e a pessoa desliga.

Por isso o prompt não pede pro agente escrever as regras. Ele pede pra
copiar. O que o agente decide é só o que realmente depende do seu
projeto: onde fica a camada de apresentação, qual módulo exporta o
cliente do banco, qual arquivo é o adaptador de log, quais diretórios
ignorar.

E o passo final é medir, não consertar. O prompt manda o agente rodar o
linter, contar as violações por regra, e escolher a severidade a partir
dessa contagem: regra com zero violação nasce em `error`; regra com
violação nasce em `warn` com a contagem anotada como linha de base. Um
gate que nasce vermelho em cima de código que já existia não é gate, é
ruído que alguém vai desligar na primeira sexta-feira.

## Como adaptar os placeholders

Este prompt tem poucos placeholders de propósito — quase tudo que ele
precisa saber, o passo 1 manda o agente descobrir lendo o projeto.

- **`[MAX_LINES]`** — o teto de linhas por arquivo. O padrão do toolkit é
  `350`. Abaixo de ~200 a regra vira briga constante em código legítimo;
  acima de ~500 ela para de exercer pressão.
- **`[PACKAGE_MANAGER]`** — `npm`, `pnpm`, `yarn` ou `bun`. Se não souber,
  deixe `npm` e o agente corrige quando ler o projeto.
- **`[SOURCE_URL]`** — de onde o agente pega os arquivos. Se você clonou
  este repositório, use o caminho local `templates/eslint`. Se não, use a
  URL raw do GitHub que já está preenchida no prompt.

## O prompt

```
Install this project's ESLint quality gates by COPYING pre-written rule
files, not by writing rules from scratch. The rules already exist and are
already tested; your job is to place them and adapt the configuration to
this project's real shape.

## 0. Get the files

Fetch these six files from [SOURCE_URL] (default:
https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/templates/eslint):

  eslint-rules/utils.cjs
  eslint-rules/core-rules.cjs
  eslint-rules/index.cjs
  eslint.config.mjs.example
  eslint.typed.config.mjs.example
  verify.mjs

Place them in the project like this:

  ./eslint-rules/utils.cjs
  ./eslint-rules/core-rules.cjs
  ./eslint-rules/index.cjs
  ./eslint.config.mjs          (from eslint.config.mjs.example)
  ./eslint.typed.config.mjs    (from eslint.typed.config.mjs.example, TypeScript only)
  ./verify.mjs                 (temporary; delete after step 5)

Copy the .cjs files byte for byte. Do not reformat them, do not convert
them to ESM, do not merge them into one file, do not "improve" them. They
are CommonJS on purpose so ESLint loads them with no build step. If you
rewrite them, this prompt has failed.

## 1. Read the project before changing anything

Report what you found before continuing:

- package manager, existing lint script, existing ESLint version
- whether this is TypeScript, and what path aliases tsconfig.json defines
- the source root: src/, app/, lib/, or the repository root
- the presentation layer: which directories hold UI or route entrypoints
- the data module: which file exports the database/ORM client, and under
  what name
- the log adapter: the module the project already logs through, if any

If the project is on ESLint 8 or older, stop and say so. The config uses
defineConfig and globalIgnores from eslint/config, which do not exist
before ESLint 9.

If there is no data module, say so and remove the
quality/no-direct-data-access rule instead of inventing a boundary this
project does not have.

## 2. Install dependencies

  [PACKAGE_MANAGER] i -D eslint@^9 @eslint/js@^9
  # TypeScript projects:
  [PACKAGE_MANAGER] i -D typescript-eslint
  # Only if enforcing import boundaries:
  [PACKAGE_MANAGER] i -D eslint-plugin-import-x eslint-import-resolver-typescript

Pin @eslint/js to the same major as eslint. Unpinned, the installer picks
@eslint/js@10, whose peer range demands eslint@10, and the install fails
with ERESOLVE.

## 3. Adapt eslint.config.mjs

Every item here is a real edit against what step 1 found, not a review:

- the `files` globs, if the source root is not src/
- quality/max-lines: set `max` to [MAX_LINES]
- quality/no-direct-data-access: set `modules` to the real import
  specifiers of the data module, `bindings` to the real exported client
  name, `layers` to the real presentation directories, `extensions` to
  the component file extension (drop `extensions` entirely on a
  non-React project)
- the import-x zones: rewrite them for this project's real layers, or
  delete the whole import-x block if the project has no layering yet. If
  you delete it, also delete its two imports at the top of the file and
  its two entries in the test-file block, or ESLint fails on an unknown
  rule id
- the quality/no-direct-console "off" block: point it at the real log
  adapter, or delete the block if there is none
- the `globals` list: add what this project's runtime actually provides
- globalIgnores: add this project's build output directories

Two failure modes that are completely silent when you get them wrong.
First, a block that turns a rule `off` must come AFTER the block that
turns it on — for a file matched by both, flat config applies the later
block last, so an `off` placed earlier is overridden without any warning.
Second, `except` inside a no-restricted-paths zone is relative to `from`;
it carves files out of `from` and cannot exempt an importer. To exempt an
importer, narrow `target`.

## 4. Wire the scripts

  "lint": "eslint ."
  "lint:fix": "eslint . --fix"
  "lint:types": "eslint --config eslint.typed.config.mjs ."

Drop lint:types on a JavaScript project. Keep the type-aware tier out of
the fast script and out of any pre-commit hook: it builds a full
TypeScript program, which is slow enough to make people bypass the hook
and heavy enough to exhaust the heap on a small CI runner.

## 5. Verify the copy survived

  node verify.mjs

Expected: three lines ending in ": ok", exit code 0. Anything else means
the copy is broken — fix it before going further. Delete verify.mjs
afterwards, or keep it and wire it into the test script; do not leave it
lying around unexplained.

## 6. Run the linter and MEASURE

  [PACKAGE_MANAGER] run lint

Report the count per rule. Then set severities from the count, not from
preference:

- zero violations for a rule: leave it at "error"
- violations exist: drop that rule to "warn" and write the count in a
  comment next to it. That count is the baseline, and the migration is
  finished when it reaches zero and the rule goes back to "error"
- quality/max-lines with only a handful of offenders: keep it at "error"
  and list those files in its `ignore` option instead. A short explicit
  list beats a rule nobody trusts

## 7. Report

State: which rules were installed, which were skipped and why, the
violation count per rule, which rules are at "warn" with a baseline, the
list of files over the [MAX_LINES]-line budget sorted by size, and the
exact commands to run the linter.

## Rules for you, the agent

Do NOT fix any violation you found. Installing the gate and measuring what
it catches is the entire job. Refactoring is separate work with its own
review.

Do NOT raise [MAX_LINES] to make a file pass. The budget is the point. Use
the `ignore` option for a known offender, or leave it reported.

Do NOT enable a framework preset because it exists. Uncomment a block only
for a framework this project actually uses.
```

## Exemplo de uso

Imagine um projeto Next.js em TypeScript, com alias `@/*`, banco em
`src/db/index.ts` exportando `db`, componentes em `src/components/` e
rotas em `src/app/`. Você preencheria:

- `[MAX_LINES]` → `350`
- `[PACKAGE_MANAGER]` → `npm`
- `[SOURCE_URL]` → a URL raw padrão, já preenchida no prompt

O agente baixa os seis arquivos, lê o `tsconfig.json` e descobre o alias
sozinho, aponta `modules` pra `@/db`, `layers` pra `/src/app/` e
`/src/components/`, roda `node verify.mjs` (três `ok`), roda o lint e
volta com algo como: `quality/no-direct-console` zero violações, fica em
`error`; `quality/no-direct-data-access` duas violações, cai pra `warn`
com a contagem anotada; `quality/max-lines` onze arquivos acima de 350,
listados do maior pro menor. E para por aí — não conserta nada.

Essa lista dos onze arquivos é exatamente a entrada do
[`09-file-size-refactor.md`](09-file-size-refactor.md).

## Dicas

- Se o agente reescrever os `.cjs` em vez de copiar, mande refazer. O
  ponto inteiro do prompt é que essas três regras sejam sempre o mesmo
  código, já testado — uma regra escrita na hora erra em silêncio.
- Rode `node verify.mjs` antes de acreditar em qualquer contagem de
  violação. Se as regras chegaram quebradas, um lint que passa limpo não
  quer dizer nada.
- Instale primeiro só o `quality/max-lines` se o projeto for grande e
  você quiser um gate de cada vez. As três são independentes.
- O raciocínio completo por trás dessas escolhas — por que aviso vira
  erro, por que fronteira de arquitetura mora no lint — está em
  [`../tools/06-eslint-biome-quality-gates.md`](../tools/06-eslint-biome-quality-gates.md).
