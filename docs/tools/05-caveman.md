# Caveman

## O que é

Caveman é um plugin — um pacote que estende o comportamento do agente
dentro do Claude Code — de compressão de comunicação: ele corta palavras de
enchimento, cautela retórica (frases como "talvez", "pode ser que",
"possivelmente", que suavizam uma resposta sem acrescentar informação nova)
e formalidades excessivas da própria prosa do agente. Não mexe no código que
o agente escreve, só em como ele fala sobre esse código.

É independente e combinável com [Ponytail](04-ponytail.md): Ponytail rege o
que é construído; Caveman rege como o agente fala sobre isso. Dá para usar
um sem o outro, ou os dois juntos. Fonte: [`JuliusBrussee/caveman`](https://github.com/JuliusBrussee/caveman).

## Por que usar

Por padrão, a prosa de um agente tende a vir preenchida com frases como "Vou
seguir em frente e...", "Parece que isso pode potencialmente...", "Ótima
pergunta!" — nenhuma delas muda o que foi de fato feito. Isso custa tempo de
leitura e tokens (as unidades que medem quanto texto entra e sai do modelo,
normalmente com custo associado) sem entregar nada a mais. O próprio
repositório do plugin reivindica um corte de até 65% no uso de tokens de uma
conversa só com essa compressão de estilo.

Caveman remove esse preenchimento sem remover informação: números, unidades,
código e o texto exato de mensagens de erro atravessam sem alteração. A
compressão é no estilo, nunca no conteúdo.

## Como instalar/ativar

Dentro de uma sessão do Claude Code:

```bash
/plugin marketplace add JuliusBrussee/caveman
/plugin install caveman@caveman
```

O primeiro comando registra o repositório do GitHub como fonte de plugins; o
segundo instala o plugin `caveman` a partir dela.

Depois de instalado, a intensidade da compressão pode ser ajustada a
qualquer momento com `/caveman`, valendo para a sessão atual. Para deixar a
compressão sempre ligada em qualquer agente de IDE que leia esse repositório
— não só nessa sessão do Claude Code —, `/caveman-init` grava a regra de
ativação direto no repositório (mais detalhes no tutorial abaixo).

## Tutorial passo a passo

### 1. O que é cortado

Palavras de enchimento, cautela retórica e formalidades — a parte de uma
resposta que existe para soar educada ou cuidadosa, mas não carrega nenhuma
informação que não estivesse lá sem ela. Exemplos: "vou verificar isso para
você", "parece que talvez", "sem problemas!", "excelente observação".

### 2. O que nunca é tocado

Quatro categorias ficam fora da compressão, sempre:

- **Palavras de negação** — não, nunca, nenhum, só, exceto. Cortar uma
  dessas inverteria o sentido real da frase, então a compressão nem tenta.
- **Números e unidades.**
- **Código e texto exato de erro.**
- **O idioma que o usuário está usando.** Caveman comprime o estilo, nunca o
  idioma — se a conversa é em português, a resposta comprimida continua em
  português.

### 3. A sobreposição de clareza automática

A compressão desliga sozinha em três situações, porque nelas clareza vale
mais que brevidade:

- avisos de segurança;
- confirmações antes de ações irreversíveis;
- qualquer lugar onde comprimir a frase criaria ambiguidade técnica.

Isso não é uma exceção manual para lembrar — é automático, embutido no
próprio plugin.

### 4. Ajustando a intensidade e deixando a regra fixa no repositório

`/caveman` troca o nível de compressão para a sessão atual, de forma
independente do comando equivalente do Ponytail (`/ponytail
lite|full|ultra`) — cada plugin tem seu próprio controle de intensidade.
Para a ativação sobreviver além da sessão atual — valendo para qualquer
agente de IDE que abrir esse repositório, não só para o Claude Code —,
`/caveman-init` grava a regra de ativação num arquivo do próprio projeto.

### 5. Comandos complementares

- **`/caveman-commit`** — gera uma mensagem de commit direta, sem
  preenchimento.
- **`/caveman-review`** — comentários de revisão de código em uma linha
  cada.
- **`/caveman-stats`** — uso de tokens da sessão atual e economia acumulada.
- **`/caveman-init`** — grava a regra de ativação permanente no repositório
  (ver passo 4).

## Exemplos concretos

### Exemplo 1 — prosa do dia a dia

**Pedido do usuário:** "Por que esse teste está falhando?"

**Sem Caveman:**

> Ótima pergunta! Deixa eu dar uma olhada nisso para você. Parece que pode
> ser porque, possivelmente, o mock não está retornando o valor esperado
> nesse cenário específico. Vou verificar com mais calma e te aviso o que
> encontrar.

**Com Caveman ativo:**

> Mock retorna `undefined`; teste espera `42`.

Mesma causa, zero palavra de preenchimento — e o valor exato (`42`) e o
termo técnico (`undefined`) atravessam intactos, porque números e código
nunca são comprimidos.

### Exemplo 2 — por que a negação nunca é cortada

**Pedido do usuário:** "Explica por que essa função não deve ser chamada
duas vezes seguidas, exceto em testes."

**Sem Caveman:**

> Boa pergunta! Essa função, de modo geral, não deveria ser chamada duas
> vezes seguidas — isso pode, em certas situações, causar um comportamento
> inesperado. Dito isso, em testes, geralmente não tem problema.

**Com Caveman ativo:**

> Não chame duas vezes seguidas — só é seguro em testes.

"Não" e "só" sobrevivem intocados porque carregam o sentido inteiro da
frase; cortar qualquer um dos dois inverteria a regra em vez de só
encurtá-la. Tudo ao redor — "boa pergunta", "de modo geral", "dito isso,
geralmente" — é enchimento e some.

### Exemplo 3 — quando a compressão desliga sozinha

**Pedido do usuário:** "Apaga a tabela `pedidos` do banco de dados."

Apagar uma tabela é irreversível — a sobreposição de clareza automática
entra em ação, e a confirmação continua completa mesmo com Caveman em
intensidade alta:

**Com Caveman ativo:**

> Isso vai apagar permanentemente a tabela `pedidos` e todos os dados nela —
> não é possível desfazer. Confirma que quer continuar?

Não vira "Apaga pedidos, sem volta, confirma?". A mensagem fica explícita
porque essa é justamente a categoria — confirmação antes de ação
irreversível — em que Caveman decide que clareza importa mais que economia
de palavras.

## Dicas e pegadinhas

- **Resposta "curta demais" numa confirmação irreversível ou aviso de
  segurança não é o comportamento esperado.** Se isso acontecer, é sinal de
  bug — a sobreposição de clareza deveria ter mantido a frase completa.
- **Números, código e texto de erro que mudam entre a versão "crua" e a
  comprimida também são bug, não estilo.** Esses elementos são garantidos
  intactos, sempre.
- **Combina com [Ponytail](04-ponytail.md), mas resolve um problema
  diferente.** Ponytail decide quanto código é escrito; Caveman decide
  quantas palavras descrevem esse código. Usar os dois juntos comprime nos
  dois eixos sem criar ambiguidade em nenhum.
- **`/caveman-init` é o único comando que sai da sessão atual.** Os outros
  (`/caveman`, `/caveman-commit`, `/caveman-review`, `/caveman-stats`) valem
  só enquanto a conversa dura.
- **Idioma nunca muda com o nível de intensidade.** Aumentar a compressão
  não troca o idioma da resposta — só corta o que sobra ao redor da
  informação.

## Perguntas frequentes

**Caveman faz o agente responder em inglês mesmo se eu escrever em
português?**
Não — ele comprime o estilo, nunca troca o idioma. A resposta continua no
idioma que você está usando.

**Vou perder números, código ou texto de erro por causa da compressão?**
Não. Esses elementos atravessam sem alteração, em qualquer nível de
intensidade.

**E se eu pedir uma confirmação antes de uma ação que não dá para
desfazer?**
A sobreposição de clareza automática desliga a compressão nesse caso
específico — a mensagem continua completa e sem ambiguidade.

**Caveman e Ponytail fazem a mesma coisa?**
Não. [Ponytail](04-ponytail.md) decide o que é construído; Caveman decide
como o agente fala sobre o que foi construído. São plugins independentes que
se combinam.

**Preciso escolher um nível toda sessão?**
Não. `/caveman` ajusta quando quiser, e o nível vale para a sessão atual;
para deixar ativo permanentemente no repositório, use `/caveman-init`.
