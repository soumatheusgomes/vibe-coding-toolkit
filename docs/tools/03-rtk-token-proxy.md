# RTK — proxy de tokens para CLI

## O que é

**RTK** é o nome usado neste documento — como espaço reservado
(*placeholder*), não como produto publicado — para um **proxy** de
**CLI** (*Command Line Interface*, interface de linha de comando: os
comandos que você digita num terminal). Um proxy, aqui, é um programa que
fica no meio do caminho entre duas pontas — neste caso, entre o agente de
IA e o terminal — interceptando o que passa por ele e podendo alterar
antes de deixar seguir.

O RTK reescreve comandos comuns de leitura — `status`, `log`, `diff`,
`grep`, `find`, listar arquivos — para equivalentes mais compactos em
**tokens** (a unidade de texto que um modelo de linguagem usa pra medir, e
cobrar, o que lê e escreve; grosso modo, um pedaço de palavra) antes deles
rodarem de verdade. É transparente pro agente: nenhuma sobrecarga de
prompt, nenhuma ida e volta extra — só um resultado mais barato pro mesmo
pedido.

A peça que faz isso funcionar é um **hook** — explicado em detalhe em
[Boas práticas para hooks](10-hooks-best-practices.md); resumindo, um
pedacinho de código que roda automaticamente antes de qualquer chamada de
terminal — que intercepta o comando proposto antes dele ser executado de
verdade.

Esta página documenta uma ferramenta pessoal que **não está publicada
publicamente** até o momento. Em vez de "instale isso", o que segue é o
**padrão** por trás dela — o desenho geral, não uma biblioteca — pra quem
quiser construir a própria versão.

Além de reescrever comandos, o proxy expõe seus próprios comandos de
**meta** (comandos sobre o proxy em si, não comandos que ele repassa para
o terminal) — e esses nunca devem ser reescritos:

- um comando de **estatísticas**, reportando a economia acumulada de
  tokens;
- um comando de **histórico**, mostrando quais comandos foram reescritos e
  quanto cada um economizou;
- uma **via de escape sem filtro** (*raw*/*passthrough*), que roda um
  comando completamente sem alteração, ignorando toda a lógica de
  reescrita.

## Por que usar

Sessões longas com um agente de IA rodam repetidamente o mesmo punhado de
comandos de leitura — `git status`, `git diff`, `git log`, buscas em
arquivos. Rodados sem filtro, esses comandos despejam facilmente milhares
de tokens de saída que o agente lê uma vez, aproveita uma fração, e
descarta. Isso custa duas coisas: dinheiro (a maioria dos modelos cobra
por token processado) e espaço de contexto (a "memória de curto prazo" da
conversa, que é finita — quanto mais espaço ocupado por saída de comando
que ninguém vai reler, menos sobra pro que realmente importa).

Um proxy de tokens intercepta exatamente esses comandos e devolve só o que
é útil — um resumo, uma contagem, as linhas que mudaram — em vez do
despejo completo. E porque a reescrita acontece dentro de um hook, fora da
conversa em si, mantê-lo ativo não custa nada em tokens de prompt: não
existe uma instrução no *system prompt* (as instruções permanentes que
moldam o comportamento do agente) que precise ser relida a cada turno, nem
o risco de o agente "esquecer" de usar o proxy — o comando original nunca
chega a rodar sem passar por ele primeiro.

Os comandos de meta também têm valor prático próprio: estatísticas e
histórico transformam "eu acho que isso está economizando tokens" num
número que você pode olhar. E a via de escape sem filtro é o que torna o
resto seguro de usar — veja a pegadinha, mais abaixo.

## Tutorial passo a passo — construindo seu próprio proxy de tokens

Um esboço de como montar esse hook do zero. Nomes de campos reais dependem
da API de hooks do seu agente — o que segue é a forma geral, não uma
cópia exata de nenhuma implementação específica.

### Passo 1 — escolha os comandos seguros pra reescrever

Comece só com leituras puras, sem efeito colateral e sem ambiguidade sobre
o que fazem: `git status`, `git diff`, `git log`, `grep`, `find`, `ls`. Não
inclua nada que escreva, apague, ou possa se comportar de formas
diferentes dependendo de flags menos comuns — isso vira a pegadinha
discutida mais abaixo.

### Passo 2 — tenha o binário compacto

O proxy em si — o programa que de fato roda o comando original e devolve
uma versão condensada da saída — fica fora do escopo deste tutorial (pode
ser um binário compilado, um script, o que for). O hook só precisa saber
invocá-lo; a lógica de "como compactar a saída de um `git diff`" é
implementação sua.

### Passo 3 — leia o comando proposto

```javascript
#!/usr/bin/env node
// Hook de PreToolUse — ilustrativo, não é o código-fonte real de nenhuma
// ferramenta específica.
import { readStdinRaw, parseHookEvent } from "./hook-io.mjs";

const evento = parseHookEvent(readStdinRaw());
if (evento === null) {
  process.exit(0); // sem evento utilizável — falha aberta, comando original roda
}

const comando = evento?.tool_input?.command ?? "";
```

O hook recebe o comando proposto como JSON pela entrada padrão (*stdin*) —
o mesmo par de helpers de leitura segura discutido em
[Boas práticas para hooks](10-hooks-best-practices.md) se aplica aqui
integralmente. Um proxy de comandos é, antes de qualquer outra coisa, um
hook, e herda a mesma obrigação de nunca travar a sessão por causa de um
evento mal formado.

### Passo 4 — reconheça comandos conhecidos e seguros

```javascript
const REESCREVIVEL = /^(git status|git diff|git log|grep|find|ls)\b/;

if (!REESCREVIVEL.test(comando)) {
  process.exit(0); // não reconhecido — comando original roda sem alteração
}
```

`REESCREVIVEL` é uma **regex** (expressão regular — um padrão de texto
usado pra casar strings que seguem um formato específico) funcionando como
uma **allowlist** (lista de permissões: só o que está explicitamente
listado é afetado; tudo o mais passa direto, sem alteração). Qualquer
coisa fora dela — incluindo os próprios comandos de meta do proxy — segue
pro terminal sem nenhuma modificação.

### Passo 5 — confira se o proxy está disponível

```javascript
import { access } from "node:fs/promises";

const PROXY_BIN = "/usr/local/bin/rtk-proxy";

try {
  await access(PROXY_BIN);
} catch {
  process.exit(0); // proxy não instalado — falha aberta
}
```

Esse é o ponto mais importante do hook inteiro: se o binário do proxy não
existir — máquina nova, instalação incompleta, o que for — o hook não pode
travar o desenvolvedor por isso. Ele simplesmente deixa o comando original
rodar, exatamente como se o proxy não existisse. Veja
[Boas práticas para hooks](10-hooks-best-practices.md) para a política
geral de fail-open (falhar aberto — deixar a ação original seguir diante
de um erro, em vez de travar) que essa checagem segue.

### Passo 6 — rode o proxy e devolva o resultado compacto

```javascript
import { execFile } from "node:child_process";

execFile(PROXY_BIN, ["run", comando], (erro, saida) => {
  if (erro) {
    process.exit(0); // proxy deu erro — falha aberta, comando original roda
    return;
  }

  // Bloqueia o comando original (caro) e devolve o resultado compacto
  // diretamente — o agente recebe uma resposta, não um pedido de nova tentativa.
  console.log(JSON.stringify({ decision: "block", reason: saida }));
  process.exit(0);
});
```

Bloquear aqui não significa "recusar e travar" — significa "impedir que o
comando caro rode, e entregar a resposta equivalente por outro caminho".
Do ponto de vista do agente, ele pediu um comando e recebeu uma resposta;
só não foi o comando original que gerou essa resposta.

### Passo 7 — o hook completo

Juntando os passos 3 a 6:

```javascript
#!/usr/bin/env node
import { access } from "node:fs/promises";
import { execFile } from "node:child_process";
import { readStdinRaw, parseHookEvent } from "./hook-io.mjs";

const PROXY_BIN = "/usr/local/bin/rtk-proxy";
const REESCREVIVEL = /^(git status|git diff|git log|grep|find|ls)\b/;

const evento = parseHookEvent(readStdinRaw());
if (evento === null) {
  process.exit(0); // sem evento utilizável — falha aberta
}

const comando = evento?.tool_input?.command ?? "";

if (!REESCREVIVEL.test(comando)) {
  process.exit(0); // não reconhecido — comando original roda sem alteração
}

try {
  await access(PROXY_BIN);
} catch {
  process.exit(0); // proxy não instalado — falha aberta
}

execFile(PROXY_BIN, ["run", comando], (erro, saida) => {
  if (erro) {
    process.exit(0); // proxy deu erro — falha aberta
    return;
  }
  console.log(JSON.stringify({ decision: "block", reason: saida }));
  process.exit(0);
});
```

### Passo 8 — registre o hook

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/rtk-proxy-hook.mjs" }
        ]
      }
    ]
  }
}
```

### Passo 9 — verifique a via de escape

Confirme que existe, e funciona, um jeito de rodar qualquer comando sem
passar pela reescrita — antes de confiar no hook em produção:

```bash
# Com o hook ativo, isso deveria sair reescrito:
git status

# Isso, mesmo com o hook ativo, deveria rodar cru, sem interceptação —
# o nome exato do comando de meta é escolha sua, mas ele precisa existir:
rtk proxy git status
```

Se não existir um caminho assim, qualquer erro de reescrita — como o do
Exemplo 3, logo abaixo — vira um beco sem saída: não tem como o agente
(nem você) recuperar o comportamento original a não ser desativando o
hook inteiro.

## Exemplos concretos

### Exemplo 1 — `git status`

Sem o proxy, o agente roda o comando cru e recebe a saída completa do
Git — cabeçalho de branch, cada arquivo modificado, staged, untracked,
linha por linha. Com o proxy ativo, o mesmo pedido do agente é
interceptado e reescrito:

```bash
# O agente propõe:
git status

# O hook reescreve para (ilustrativo):
rtk-proxy run "git status"

# E a resposta que volta pro agente, no lugar da saída bruta do Git, é
# algo como:
# 3 arquivos modificados, 1 novo, 0 staged — branch: feature/checkout-retry
```

O agente pediu `git status`; o que ele recebeu é semanticamente a mesma
informação, só que resumida numa linha em vez de um bloco inteiro de
saída formatada pra leitura humana.

### Exemplo 2 — `grep` numa árvore grande

```bash
# O agente propõe:
grep -r "TODO" src/

# O hook reescreve para (ilustrativo):
rtk-proxy run "grep -r \"TODO\" src/"

# E a resposta compacta é algo como:
# 12 ocorrências de "TODO" em 7 arquivos — use rtk history pra ver a lista completa
```

Em vez de despejar as 12 linhas de contexto de cada ocorrência, o proxy
devolve a contagem — e deixa o histórico (`rtk history`, um dos comandos
de meta) disponível caso o agente realmente precise da lista completa
depois.

### Exemplo 3 — quando a reescrita erra: a pegadinha da flag

```bash
# Comando real, proposto pelo agente:
git log -h
```

Se o **parser** (o componente que interpreta os argumentos de um comando)
do proxy também trata `-h` como a flag de ajuda **dele mesmo** — antes de
sequer examinar qual comando está sendo reescrito — o resultado é a ajuda
do `rtk-proxy`, não o log do Git:

```bash
rtk-proxy run "git log -h"
# → imprime a ajuda do rtk-proxy (texto explicando os comandos do proxy)
# → NÃO imprime o log do Git, que era o que o agente queria
```

Nada quebra. Não existe mensagem de erro nenhuma. O agente recebe uma
resposta com aparência completamente válida — só que é a resposta errada,
pra uma pergunta que ele nunca fez.

## Dicas e pegadinhas

- **Uma reescrita transparente pode mudar o significado de uma flag sem
  avisar.** Se o parser do proxy usa alguma flag que coincide com uma flag
  da ferramenta original, a reescrita pode disparar o comportamento
  errado — como no Exemplo 3 acima. É uma limitação conhecida do próprio
  padrão de "reescrever comandos de forma transparente", não um bug de
  uma implementação específica.
- **Sempre tenha uma via de escape sem filtro.** É o que torna o resto do
  padrão seguro de usar: se uma reescrita específica se mostrar errada, o
  desenvolvedor (ou o próprio agente) precisa de um jeito de rodar o
  comando original, cru, sob demanda — sem precisar desativar o hook
  inteiro pra isso.
- **Nunca presuma que a saída reescrita é equivalente à original sem
  checar** — principalmente pra flags incomuns, que o parser do proxy
  provavelmente nunca foi testado contra. A reescrita é uma aposta
  informada, não uma garantia matemática.
- **Os comandos de meta precisam ficar fora da allowlist de reescrita.**
  Se o padrão que reconhece comandos reescrevíveis (Passo 4 do tutorial)
  também casar com os comandos de estatísticas, histórico ou passthrough
  do próprio proxy, ele acaba tentando reescrever a si mesmo — exclua-os
  explicitamente.
- **O proxy é um hook antes de qualquer outra coisa** — toda a disciplina
  de fail-open de [Boas práticas para hooks](10-hooks-best-practices.md)
  se aplica sem exceção: binário ausente, erro do proxy, evento mal
  formado — tudo isso deve deixar o comando original rodar, nunca travar
  o desenvolvedor.

## Perguntas frequentes

**Onde eu baixo o RTK?**
Em lugar nenhum, por enquanto — não é uma ferramenta publicada. O que este
documento oferece é o padrão por trás dela, pra você construir sua própria
versão adaptada ao seu fluxo de trabalho.

**Isso funciona com comandos que escrevem ou apagam alguma coisa?**
O padrão, do jeito descrito aqui, é pensado só pra comandos de
**leitura** — `status`, `diff`, `log`, `grep`, `find`, listar arquivos.
Reescrever um comando de escrita (um `git commit`, um `rm`) introduz um
risco totalmente diferente: um parser errado ali não devolve uma resposta
errada, pode executar a ação errada. Fica fora do escopo deste padrão, de
propósito.

**E se a reescrita der uma resposta errada, tipo no exemplo da flag `-h`?**
É exatamente pra isso que a via de escape sem filtro existe — rode o
comando original diretamente, sem passar pelo proxy, e trate a regra de
reescrita que causou o problema como um bug a corrigir no parser do proxy
(por exemplo, ignorando flags de uma letra só quando vêm depois do nome de
um comando já reconhecido).

**Preciso reescrever pra um binário separado, ou dá pra fazer tudo dentro
do próprio hook?**
Dá pra fazer tudo dentro do hook se a compactação for simples — por
exemplo, rodar o comando original e cortar a saída pras últimas N linhas.
Um binário separado compensa quando a lógica de compactação fica complexa
o bastante pra merecer testes e versionamento próprios, independentes do
hook que só faz o roteamento.

**Isso economiza tokens de verdade, ou só parece?**
Depende inteiramente de quanto da saída bruta dos comandos reescritos o
agente de fato usa. Comandos como `git status` num repositório grande, ou
`grep` numa árvore de milhares de arquivos, tendem a ter a maior
diferença — a saída bruta é grande, e o que importa geralmente cabe num
resumo. É exatamente pra medir isso que os comandos de meta de
estatísticas e histórico existem: sem eles, "economiza tokens" é uma
hipótese; com eles, é um número.
