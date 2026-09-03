# Quebrar os arquivos gigantes que o teto de linhas revelou

## Quando usar

Use este prompt depois que o teto de tamanho por arquivo já está
instalado e o linter já apontou quais arquivos estouraram — normalmente
logo após o [`08-eslint-quality-gates-install.md`](08-eslint-quality-gates-install.md).
Ele é o segundo tempo: o 08 instala a régua e mede; este aqui manda o
agente pegar os arquivos que não couberam e transformá-los em módulos
menores e isolados.

Não use pra zerar avisos de lint em geral — isso é o
[`02-eslint-warning-burndown.md`](02-eslint-warning-burndown.md), que é
mais amplo e trata regra por regra. Este prompt é só sobre tamanho de
arquivo, porque quebrar um arquivo de 800 linhas é um tipo de trabalho
diferente de corrigir 240 avisos de `complexity`: aqui cada mudança move
código entre arquivos, e é aí que a mudança de comportamento se esconde.

## Por que funciona

A pergunta que faz esse trabalho dar errado é sempre a mesma: *onde
cortar*. Um agente sem instrução corta onde a contagem de linhas manda —
tira 200 linhas do fim do arquivo, joga num `utils.ts`, e o resultado são
dois arquivos que só fazem sentido lidos juntos. O arquivo passou no
linter e o código ficou pior.

Por isso o prompt define o corte por responsabilidade, não por linha, e
usa as mesmas quatro costuras que a própria mensagem da regra sugere:
lógica de negócio vira serviço de domínio, bloco de UI repetido vira
sub-componente, acesso a dados vira repositório, e aglomerado de helpers
vira módulo utilitário do domínio. Se nenhuma dessas costuras existe no
arquivo, a instrução é dizer isso e parar — inventar uma abstração só pra
satisfazer o linter é trocar um problema visível por um invisível.

O segundo mecanismo é o ritmo: **um arquivo por vez, um commit por
arquivo**, com testes e checagem de tipos rodando entre cada um. Quebrar
seis arquivos num commit só significa que, quando algo quebrar, você não
sabe qual extração causou. E o terceiro é a regra de preservação: as
exportações públicas do arquivo original continuam existindo, com o mesmo
nome e a mesma assinatura. Quem importava aquele arquivo não deveria nem
saber que ele foi dividido.

Fechando, o prompt exige que a contagem final venha de rodar o comando de
novo, nunca de somar mentalmente o que foi feito.

## Como adaptar os placeholders

- **`[LINT_COMMAND]`** — o comando que roda o linter mostrando a saída
  completa, por arquivo e por regra. Alguns wrappers de CI resumem a
  saída; se o seu resumir, use a invocação direta.
- **`[TEST_COMMAND]`** — o comando da suíte de testes.
- **`[TYPECHECK_COMMAND]`** — o comando de checagem de tipos. Se o
  projeto for JavaScript puro, escreva `none` e o prompt pula esse passo.
- **`[MAX_LINES]`** — o teto configurado na regra. Padrão do toolkit:
  `350`.
- **`[BATCH_SIZE]`** — quantos arquivos quebrar antes de parar e te
  mostrar o resultado. Comece com `3`. Subir isso antes de confiar no
  resultado das três primeiras é a forma mais rápida de acumular um diff
  que ninguém revisa.
- **`[RULE_ID]`** — o id da regra de tamanho. Se você instalou pelo
  prompt 08, é `quality/max-lines`.

## O prompt

```
Split the files that exceed this project's per-file size budget into
smaller, focused modules. This is behavior-preserving refactoring, not a
rewrite and not a feature change.

## 0. Ground truth

Run [LINT_COMMAND] and list every file reported by [RULE_ID], with its
actual line count, sorted largest first. Use the real output from running
it now. Never a count from memory, from a previous message, or from a
summary — if the command's output is truncated by a wrapper, run the
linter directly until you have the full list.

Report that list before touching anything.

## 1. Pick the batch

Take the [BATCH_SIZE] largest files. Do not start on any others.

For each one, before editing, state:
  - what the file is responsible for today, in one sentence
  - the seams you found, and which one you will cut on
  - what its public exports are (the names other files import from it)

## 2. Where to cut

Cut on responsibility, never on line count. The four seams worth looking
for, in this order:

  - business logic mixed into a UI or route file -> a domain service or
    use-case module
  - a repeated block of UI -> a reusable sub-component
  - data access (queries, ORM calls, raw SQL) -> a repository or adapter
  - a cluster of helpers that only serve one concept -> a
    domain-specific utility module

If a file has no seam — it is one long, genuinely cohesive
implementation — say so, leave it alone, and move to the next file. Adding
an abstraction that exists only to satisfy the linter makes the codebase
worse than the long file did. Report it as "no natural seam" and let a
human decide.

Never split at an arbitrary line number to get under the budget. A file
named helpers.ts, utils.ts, misc.ts or common.ts holding whatever was
left over is a failure, not a result.

## 3. Preserve the interface

After the split, the original file's public exports must still exist,
with the same names and the same signatures. Prefer leaving the original
file as a thin module that re-exports from the new ones over editing
every import site across the codebase.

Rewriting import sites is allowed only when the original file is meant to
disappear entirely, and only when you say so explicitly before doing it.

## 4. One file at a time

For each file in the batch, in order:

  a. make the split
  b. run [TYPECHECK_COMMAND] (skip if it is "none")
  c. run [TEST_COMMAND]
  d. run [LINT_COMMAND] and confirm the file is no longer reported, and
     that no NEW violation appeared anywhere
  e. commit, with a message naming the file and the seam you cut on
  f. only then move to the next file

If b, c, or d fails, fix it before moving on. Do not proceed with a
failing check and do not batch the fixes at the end.

Watch for a specific trap in step d: extracting code frequently trades one
violation for another. A function pulled out of a long file can push its
new home over the budget, and an extraction can change a function's
inferred return type, which surfaces as a type error rather than a lint
error. Both are your problem, in the same commit.

## 5. Stop and report

After [BATCH_SIZE] files, stop. Do not continue into the next batch on
your own.

Report:
  - the files you split, and the seam used for each
  - the files you deliberately did NOT split, and why
  - the output of [LINT_COMMAND] run one final time: how many files are
    still over the budget, and their names
  - any violation of another rule that appeared as a side effect

Mark nothing as done that you did not verify by running the command again.

Codebase: [STACK/FRAMEWORK]. Budget: [MAX_LINES] lines. Rule: [RULE_ID].
```

## Exemplo de uso

Imagine que o prompt 08 acabou de reportar onze arquivos acima de 350
linhas num app Next.js, sendo o maior um `src/app/dashboard/page.tsx` de
780 linhas. Você preencheria:

- `[LINT_COMMAND]` → `npm run lint`
- `[TEST_COMMAND]` → `npm test`
- `[TYPECHECK_COMMAND]` → `npm run typecheck`
- `[MAX_LINES]` → `350`
- `[BATCH_SIZE]` → `3`
- `[RULE_ID]` → `quality/max-lines`

O agente lista os onze de verdade, pega os três maiores, e no
`page.tsx` reporta: responsabilidade atual "monta o dashboard e também
calcula os agregados de saldo"; costuras encontradas "cálculo de
agregados (lógica de negócio) e três cartões de métrica repetidos (UI)";
exportações públicas "default `DashboardPage`". Ele extrai os agregados
pra um módulo de domínio e os cartões pra um sub-componente, mantém o
`export default` intacto, roda typecheck, testes e lint, confirma que
nenhum aviso novo apareceu, e commita. Depois faz o segundo arquivo. No
terceiro, encontra um parser de 400 linhas que é uma máquina de estados
única e coesa — reporta "sem costura natural", não mexe, e para. No fim,
diz que restam oito arquivos acima do teto, listados.

## Dicas

- `[BATCH_SIZE]` baixo não é excesso de cautela: é o que mantém o diff no
  tamanho que um humano revisa de verdade. Três arquivos por rodada, com
  commit por arquivo, dá seis pontos de retorno se algo der errado.
- Quando o agente disser "sem costura natural", leia o arquivo antes de
  discordar. Às vezes ele está certo, e o certo é subir o `ignore` da
  regra pra aquele arquivo específico em vez de picotá-lo.
- Combine com [`03-multi-agent-code-review.md`](03-multi-agent-code-review.md)
  no fim de cada lote — extração de código é exatamente o tipo de mudança
  em que um revisor separado enxerga o que quem extraiu não enxerga.
- As pegadinhas do passo 4d têm exemplos concretos, com código, em
  [`../tools/06-eslint-biome-quality-gates.md`](../tools/06-eslint-biome-quality-gates.md)
  — vale ler antes da primeira rodada.
