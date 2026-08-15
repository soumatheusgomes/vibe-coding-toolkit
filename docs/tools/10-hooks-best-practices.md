# Boas práticas para hooks

## O que é

Um **hook**, no contexto de um agente de IA como o Claude Code, é um
pedacinho de código que roda automaticamente em um momento específico do
fluxo do agente — antes de uma ferramenta ser executada, depois que ela
roda, quando uma sessão começa, quando ela termina, e assim por diante. O
agente não "decide" chamar um hook: é o próprio **harness** (a camada que
orquestra o agente — no nosso caso, o Claude Code) que dispara o hook no
momento certo, sempre, sem exceção.

O contrato de um hook é simples e apertado: ele recebe um evento em
**JSON** (um formato de texto para representar dados estruturados, em
pares chave-valor) pela **entrada padrão** (*stdin* — o canal por onde um
processo lê dados quando eles não vêm de um arquivo ou de um argumento de
linha de comando), e responde de volta através do seu **código de saída**
(*exit code* — o número que um processo devolve ao terminar; por
convenção, `0` significa "deu tudo certo"), opcionalmente complementado
por texto em stdout/stderr. É exatamente esse contrato estreito — evento
por stdin, resposta por código de saída — onde mora a maioria dos bugs de
hook, e é disso que trata a maior parte deste documento.

Hooks são registrados na configuração do harness (no Claude Code,
normalmente `.claude/settings.json`), indexados pelo momento do ciclo de
vida em que disparam: `PreToolUse` (antes de uma ferramenta rodar),
`PostToolUse` (depois dela rodar), `SessionStart` (quando a sessão
começa), `SessionEnd` (quando ela termina), `UserPromptSubmit` (a cada
mensagem enviada pelo usuário), `Stop` (quando o agente conclui e a sessão
vai parar), entre outros. Cada entrada associa um **matcher** (um filtro —
por exemplo, "só dispare para a ferramenta Bash") a um comando a ser
executado. Veja
[`templates/settings.json.example`](../../templates/settings.json.example)
para um exemplo concreto dessa configuração.

## Por que usar

### A política de fail-open não é hábito, é regra

Chamamos de **fail-open** (falhar aberto) a estratégia de, diante de um
erro dentro do hook, deixar a ação original seguir seu curso normal em vez
de travar tudo. O oposto — bloquear por padrão sempre que algo dá errado —
é **fail-closed** (falhar fechado), e também tem seu lugar, mas não é a
regra geral (veja as perguntas frequentes, no final).

Escreva essa escolha como regra explícita, não como hábito implícito: um
hook sai com código `0` (libera a ação) ou com um código de bloqueio
designado — e **só** com esses dois. Qualquer outro código de saída, ou um
erro não tratado que derruba o processo no meio do caminho, é um bug no
próprio hook, ponto final.

O motivo de isso precisar virar regra escrita, e não só bom senso
implícito: um hook que quebra em vez de degradar graciosamente pode
trancar um desenvolvedor pra fora da própria sessão. Um hook de
`SessionStart` que lança uma exceção antes de imprimir qualquer coisa pode
impedir a sessão de sequer começar — o pior lugar possível pra essa falha
acontecer, porque não sobra nem uma sessão de onde debugar o problema.

A postura padrão deve ser **degradar silenciosamente** — pular o reforço,
a checagem, o aviso, o que quer que o hook estivesse adicionando de
"extra" — em vez de bloquear, para qualquer coisa que não seja um
requisito duro de segurança. Um hook que adiciona um bônus (lembrar o
agente de uma convenção do projeto, por exemplo) e um hook que impõe um
limite de segurança real (bloquear a leitura de um arquivo de
credenciais) não deveriam falhar da mesma forma quando algo dá errado.

### O bug que vale nomear: `JSON.parse("null")`

Esse bug merece nome próprio porque é fácil de escrever, difícil de notar
numa revisão de código, e derruba a política de fail-open acima por
acidente — sem que ninguém tenha feito nada obviamente errado.

`JSON.parse("null")` retorna o valor JavaScript `null` — **sem lançar
erro**. É um JSON válido, do mesmo jeito que `"true"` ou `"42"` são.
Então um padrão que parece defensivo, como este, não te protege de
verdade:

```javascript
let evento;
try {
  evento = JSON.parse(lerStdin() || "{}");
} catch {
  evento = {}; // nunca é alcançado se o stdin for `null` — JSON.parse("null") não lança erro
}

if (evento.tool_name === "Bash") { // TypeError: Cannot read properties of null
  // ...
}
```

Um payload de stdin igual ao texto literal `null` é uma string não-vazia e
perfeitamente parseável — então o fallback `|| "{}"` nunca entra em ação
(a string não está vazia) e o bloco `catch` nunca roda (o parse não
falhou). Nada "deu errado" do ponto de vista do `try/catch`. `evento`
simplesmente vira `null` silenciosamente, em vez do `{}` que o `catch`
deveria garantir. A quebra acontece uma linha depois, na primeira leitura
de propriedade sem proteção — **fora** de qualquer `try/catch` que
estivesse protegendo o parse em si.

Uma checagem `typeof` também não salva:

```javascript
typeof evento.tool_name === "string" // ainda lança: Cannot read properties of null
```

O acesso à propriedade (`evento.tool_name`) acontece *antes* de `typeof`
conseguir ver o resultado — então o acesso lança o erro primeiro, e
`typeof` nunca chega a rodar.

#### A correção

Dois helpers pequenos e reutilizáveis resolvem isso de vez —
`readStdinRaw` (lê o stdin bruto) e `parseHookEvent` (interpreta esse
texto como um evento), os mesmos nomes usados no arquivo pronto pra
copiar linkado no final desta seção:

- `readStdinRaw` lê o stdin e **nunca lança erro** — qualquer falha
  retorna uma string vazia.
- `parseHookEvent` tenta interpretar essa string como JSON e retorna
  `null` tanto para JSON inválido **quanto** para o valor JSON `null`
  literal — colapsando as duas situações de falha numa só.

```javascript
import { readFileSync } from "node:fs";

export function readStdinRaw() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

export function parseHookEvent(raw) {
  try {
    return JSON.parse(raw); // "null" vira o valor `null` — mesma forma de uma falha de parse
  } catch {
    return null;
  }
}
```

Não precisa de nenhum caso especial: `JSON.parse` já retorna o valor
`null` para uma entrada `null` literal, então o mesmo `catch` que trata
uma falha de parse de verdade também cobre esse caso, de graça. A partir
daí, cada ponto de uso só precisa de uma checagem:

```javascript
const evento = parseHookEvent(readStdinRaw());
if (evento === null) {
  process.exit(0); // falha aberta — não há nada utilizável pra agir em cima
}
// ...segue o hook — `evento` aqui é garantidamente um objeto de verdade
```

Veja [`templates/hooks/hook-io.mjs.example`](../../templates/hooks/hook-io.mjs.example)
para uma versão pronta pra copiar dessas duas funções.

### Dívida de migração é real — documente, não presuma

Não presuma que uma correção como essa foi aplicada de forma uniforme só
porque a maioria dos hooks de um projeto já importa o helper
compartilhado. Alguns podem não estar corrigidos e mesmo assim
sobreviverem "por acidente", por motivos que não têm nada a ver com a
correção em si:

- Uma checagem diferente já roda antes e acaba pegando o caso `null` por
  coincidência — um encadeamento opcional (`?.`) no próximo acesso, por
  exemplo.
- Um `try/catch` amplo envolve o handler inteiro e acaba engolindo esse
  `TypeError` específico também, mesmo sem ter sido escrito pensando
  nesse bug.

As duas situações acima são proteção real, funcionando hoje — e as duas
estão a uma reordenação de código ou um refactor de distância de quebrar,
porque nenhuma das duas foi escrita *como* proteção contra esse bug
específico. Documente explicitamente quais hooks foram corrigidos de
propósito e quais estão seguros por acidente, em vez de presumir
cobertura uniforme. Migre os acidentais de forma oportunista — na próxima
vez que cada um for tocado por outro motivo, não como correção urgente,
já que nada está quebrado agora.

## Tutorial passo a passo — escrevendo um hook seguro do zero

Vamos construir um hook mínimo, mas real: um `PreToolUse` que avisa (e
bloqueia) quando o agente tenta editar um arquivo que parece sensível —
por exemplo, um `.env`. É pequeno o bastante pra caber num tutorial e usa
exatamente os dois helpers explicados acima.

### Passo 1 — crie o arquivo do hook

Crie `.claude/hooks/protect-env-files.mjs`. Todo hook aqui é um módulo
Node.js (`.mjs`, o formato de módulo ECMAScript — o padrão do JavaScript
moderno) que lê stdin, decide algo, e termina com um código de saída.

### Passo 2 — importe os helpers de leitura segura

```javascript
import { readStdinRaw, parseHookEvent } from "./hook-io.mjs";
```

Se você ainda não tem esse arquivo, copie
[`templates/hooks/hook-io.mjs.example`](../../templates/hooks/hook-io.mjs.example)
para `.claude/hooks/hook-io.mjs` — é o par de funções da seção anterior,
prontas pra usar.

### Passo 3 — leia e interprete o evento, com saída segura por padrão

```javascript
const evento = parseHookEvent(readStdinRaw());
if (evento === null) {
  process.exit(0); // nada utilizável — falha aberta, não bloqueia por engano
}
```

Esse é o primeiro reflexo de qualquer hook: antes de fazer qualquer outra
coisa, garanta que o evento é um objeto de verdade. Tudo daqui pra frente
assume que `evento` é seguro de acessar.

### Passo 4 — extraia só o que você precisa, com fallback

```javascript
const caminho = evento?.tool_input?.file_path ?? "";
```

O encadeamento opcional (`?.`) evita quebrar se `tool_input` não existir
por algum motivo; o `?? ""` garante que `caminho` é sempre uma string,
mesmo que vazia — então o próximo passo (um teste de regex) nunca lança
erro por receber `undefined`.

### Passo 5 — decida, e responda com o código de saída certo

```javascript
const pareceSensivel = /\.env(\..+)?$/.test(caminho);
if (!pareceSensivel) {
  process.exit(0); // não é o que estamos vigiando — libera
}

console.error(
  `Aviso: ${caminho} parece um arquivo de segredos. Confirme antes de editar.`
);
process.exit(2); // bloqueia — o agente vê a mensagem acima como motivo
```

`/\.env(\..+)?$/` é uma **regex** (expressão regular — um padrão de texto
usado pra casar strings que seguem um formato específico) que reconhece
nomes terminando em `.env` ou `.env.algumacoisa`. E `2` aqui é um código
de bloqueio de exemplo — confirme, na documentação do seu harness, qual
código ele espera pra "bloquear com mensagem"; o Claude Code usa `2`. O
que importa é a disciplina: só `0` ou o código de bloqueio documentado,
nunca um terceiro valor por acidente (por exemplo, deixar uma exceção não
tratada derrubar o processo com `1`).

### Passo 6 — o arquivo completo

Juntando os passos 2 a 5:

```javascript
#!/usr/bin/env node
import { readStdinRaw, parseHookEvent } from "./hook-io.mjs";

const evento = parseHookEvent(readStdinRaw());
if (evento === null) {
  process.exit(0); // nada utilizável — falha aberta
}

const caminho = evento?.tool_input?.file_path ?? "";
const pareceSensivel = /\.env(\..+)?$/.test(caminho);

if (!pareceSensivel) {
  process.exit(0); // não é o que estamos vigiando — libera
}

console.error(
  `Aviso: ${caminho} parece um arquivo de segredos. Confirme antes de editar.`
);
process.exit(2); // bloqueia — o agente vê a mensagem acima como motivo
```

### Passo 7 — registre o hook

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/protect-env-files.mjs" }
        ]
      }
    ]
  }
}
```

### Passo 8 — verifique o comportamento de fail-open manualmente

Antes de confiar no hook, teste os dois extremos pelo terminal, simulando
o que o harness manda por stdin:

```bash
# Evento normal, arquivo não sensível → deve sair 0 e nada acontece
echo '{"tool_input":{"file_path":"src/index.js"}}' | node .claude/hooks/protect-env-files.mjs; echo "saída: $?"

# Arquivo sensível → deve sair 2 e imprimir o aviso
echo '{"tool_input":{"file_path":".env.local"}}' | node .claude/hooks/protect-env-files.mjs; echo "saída: $?"

# O próprio bug que este documento existe pra evitar → deve sair 0, nunca travar
echo 'null' | node .claude/hooks/protect-env-files.mjs; echo "saída: $?"
```

Se o terceiro comando aí em cima imprimir um stack trace em vez de
`saída: 0`, o hook ainda tem o bug — volte ao Passo 3.

## Exemplos concretos

Dois exemplos adicionais, em pseudocódigo comentado, mostrando o padrão
fail-open em situações diferentes de um bloqueio de segurança — aqui o
que falha é sempre uma melhoria opcional, nunca uma trava dura.

### Exemplo 1 — reforçar um modo de comportamento persistente

```javascript
#!/usr/bin/env node
// UserPromptSubmit — reforça um "modo" ativo (por exemplo, um estilo de
// resposta específico) a cada mensagem do usuário, lendo um arquivo de
// estado gravado no início da sessão.
import { readFileSync } from "node:fs";
import { readStdinRaw, parseHookEvent } from "./hook-io.mjs";

const evento = parseHookEvent(readStdinRaw());
if (evento === null) {
  process.exit(0); // sem evento utilizável — segue sem reforçar nada
}

let estado;
try {
  estado = JSON.parse(readFileSync(".claude/state/modo-ativo.json", "utf8"));
} catch {
  process.exit(0); // arquivo de estado ausente ou corrompido — não é motivo
                    // pra travar a sessão, só significa "sem modo ativo agora"
}

console.log(JSON.stringify({
  hookSpecificOutput: { additionalContext: `Modo ativo: ${estado.nome}` },
}));
process.exit(0);
```

Se o arquivo de estado não existir ou vier corrompido, o hook simplesmente
não reforça nada nessa mensagem — a sessão continua normalmente, só sem o
lembrete. Comparado a travar a mensagem do usuário inteira por causa de um
arquivo de estado ilegível, essa degradação é claramente aceitável.

### Exemplo 2 — formatar um arquivo automaticamente após a edição

```javascript
#!/usr/bin/env node
// PostToolUse (Edit|Write) — roda um formatador no arquivo que acabou de
// ser editado. Se o formatador não estiver instalado ou falhar, a edição
// já aconteceu de qualquer forma — bloquear aqui não desfaz nada, só
// atrapalha.
import { execFileSync } from "node:child_process";
import { readStdinRaw, parseHookEvent } from "./hook-io.mjs";

const evento = parseHookEvent(readStdinRaw());
if (evento === null) {
  process.exit(0);
}

const caminho = evento?.tool_input?.file_path ?? "";
if (!caminho) {
  process.exit(0); // sem caminho pra formatar — nada a fazer
}

try {
  execFileSync("npx", ["prettier", "--write", caminho], { stdio: "ignore" });
} catch {
  process.exit(0); // formatador ausente, ou o arquivo tem um erro de sintaxe
                    // temporário — deixa o arquivo como está, sem travar
}

process.exit(0);
```

Nos dois exemplos, o denominador comum é o mesmo: o hook está adicionando
algo (reforço de contexto, formatação automática), não impondo um limite
duro — então qualquer falha no meio do caminho tem que resultar em "a
sessão continua sem o extra", nunca em "a sessão trava".

## Catálogo de categorias de hooks

Conforme o conjunto de hooks de um projeto amadurece, algumas categorias
tendem a aparecer repetidamente. Vale conhecê-las como referência, mesmo
antes de precisar de todas:

- **Reescrever ou reforçar um comando de terminal proposto** antes dele
  rodar. Veja [RTK — proxy de tokens para CLI](03-rtk-token-proxy.md).
- **Injetar contexto de orientação** antes de uma busca ou leitura ampla,
  se auto-instalando no primeiro uso. Veja [Graphify](07-graphify.md).
- **Bloquear acesso direto ao sistema de arquivos** numa pasta protegida
  e redirecionar para uma ferramenta mais segura e estruturada. Veja
  [Obsidian como memória](08-obsidian-memory.md).
- **Bloquear edições numa branch protegida** — recusar uma escrita direta
  em `main`, por exemplo.
- **Escanear conteúdo antes dele ser escrito**, procurando segredos
  (chaves de API, senhas, tokens de acesso) commitados por acidente.
- **Formatar um arquivo automaticamente** assim que ele é editado.
- **Um par de hooks de início e fim de sessão** que registra um log
  corrente da sessão e, depois, compila esse log em notas permanentes.
- **Um hook de finalização** que roda uma verificação final — testes,
  build — antes da sessão poder se considerar terminada.

## Dicas e pegadinhas

- **Fail-open não é a resposta certa pra tudo.** Reserve fail-closed
  (bloquear por padrão diante de erro) para os poucos casos em que deixar
  passar é pior do que atrapalhar — segurança de verdade, não
  conveniência. Se você está em dúvida sobre qual dos dois um hook novo
  deveria usar, essa dúvida sozinha já é sinal de que vale documentar a
  decisão junto do código.
- **`?.` (encadeamento opcional) e `?? valor` (nullish coalescing — troca
  `null`/`undefined` por um valor padrão) resolvem a maioria dos acessos
  inseguros** — mas nenhum dos dois substitui a checagem `=== null` logo
  após interpretar o evento. Eles protegem acessos *depois* que você já
  sabe que tem um objeto; não protegem o parse em si.
- **Teste o caminho de falha, não só o caminho feliz.** O Passo 8 do
  tutorial acima (mandar `null` literal pelo stdin) é o teste mais barato
  que existe pra esse bug específico — e o mais fácil de esquecer de
  escrever, porque o caminho feliz sempre passa primeiro na sua cabeça.
- **Uma convergência que vale notar:** duas ferramentas construídas de
  forma totalmente independente pra manter um "modo de comportamento
  persistente" ao longo de uma sessão — [Ponytail](04-ponytail.md) e
  [Caveman](05-caveman.md) — chegaram à mesma arquitetura de hooks sem
  combinar nada entre si: um hook de início de sessão grava um arquivo de
  estado e injeta o conjunto de regras ativo como saída do próprio hook, e
  um hook que roda a cada mensagem do usuário (`UserPromptSubmit`) reforça
  esse modo continuamente. Nenhuma das duas copiou a outra — o que é uma
  evidência razoável de que essa arquitetura (estado gravado no início,
  reforçado a cada turno) é simplesmente a forma certa de resolver esse
  problema, não uma coincidência de implementação.

## Perguntas frequentes

**Um hook realmente pode me trancar pra fora da minha própria sessão?**
Sim — o caso mais grave é um hook de `SessionStart` que lança uma exceção
não tratada antes de imprimir qualquer saída. Se o harness espera uma
resposta do hook antes de liberar a sessão, e o hook nunca responde nada
coerente, a sessão pode nem chegar a começar. É exatamente o cenário que a
política de fail-open existe para prevenir.

**Fail-open vale também para hooks de segurança?**
Não necessariamente — e essa é a exceção explícita à regra. Um hook que
impõe um limite duro de segurança (por exemplo, recusar acesso direto a
uma pasta de credenciais) pode, e geralmente deve, falhar **fechado**: se
ele não consegue avaliar a situação com confiança, bloquear é mais seguro
do que liberar. A regra de fail-open, do jeito que este documento a
descreve, é sobre hooks que adicionam uma melhoria opcional — não sobre os
poucos que impõem uma trava real.

**Preciso usar exatamente os dois helpers mostrados aqui?**
Não — o nome dos arquivos e das funções não importa. O que importa é a
forma: uma função de leitura de stdin que nunca lança erro, e uma função
de parse que trata JSON inválido e o valor `null` literal como o mesmo
sinal de "nada utilizável aqui". Qualquer implementação que preserve essa
forma resolve o mesmo problema.

**Que código eu uso pra bloquear — sempre `2`?**
Depende do harness. O Claude Code usa `2` como código de bloqueio (com a
mensagem de stderr sendo mostrada ao agente); outros harnesses de agente
podem usar uma convenção diferente. Confirme na documentação do seu
harness — o que não muda entre eles é a disciplina de só usar `0` ou o
código documentado, nunca deixar um terceiro valor escapar por acidente.

**Como eu sei se um hook do meu projeto já está corrigido pra esse bug, ou
só "seguro por acidente"?**
Você não sabe, a não ser que alguém tenha documentado isso explicitamente.
É exatamente por isso que a seção sobre dívida de migração, acima,
recomenda registrar a decisão em vez de presumir cobertura uniforme — um
comentário curto no próprio hook (algo como "usa parseHookEvent —
corrigido" vs. "ainda não migrado, mas o try/catch amplo cobre por
enquanto") já resolve.
