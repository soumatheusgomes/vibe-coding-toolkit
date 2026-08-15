# Brainstorm até plano

## Quando usar

Use este prompt sempre que um pedido estiver aberto ou vago o bastante pra
um agente conseguir, de boa consciência, construir três coisas diferentes
a partir dele — por exemplo "adiciona um sistema de notificações", sem
dizer qual canal (e-mail? push? dentro do app?), pra quem, ou quando
disparar. Funciona tanto pra um pedido que chegou cru de um stakeholder (a
pessoa ou área interessada no resultado, dentro ou fora do time técnico)
quanto pra uma ideia que você mesmo esboçou rápido demais e ainda não
amarrou os detalhes.

## Por que funciona

O modo de falha que esse prompt evita é bem concreto: o agente lê um
pedido ambíguo, escolhe silenciosamente a interpretação que parece mais
plausível, constrói em cima dela com total confiança — e o descompasso com
o que você realmente queria só aparece depois que o trabalho já está
pronto, quando desfazer custa muito mais caro do que teria custado
perguntar antes. Separar "entender a intenção" de "planejar" e de
"implementar" em fases distintas, cada uma com seu próprio checkpoint,
impede que a ambiguidade vaze silenciosamente de uma fase pra outra. A
primeira fase usa perguntas pontuais no estilo socrático (perguntas
feitas pra te ajudar a destravar a própria resposta, em vez do agente
simplesmente adivinhar) pra fixar o que "pronto" significa, o que está
dentro e fora de escopo, e restrições que você nem citou mas provavelmente
tem; quando o pedido admite mais de uma leitura razoável, o agente
apresenta as interpretações lado a lado em vez de escolher uma sozinho e
torcer pra acertar. E exigir uma checagem de verificação executável — um
comando, um teste, um comportamento observável — em cada passo do plano,
em vez de um "deveria funcionar", impede que o agente marque um passo
como concluído antes de provar isso de verdade.

## Como adaptar os placeholders

- **`[DESCRIBE THE REQUEST HERE — as short or open-ended as it actually
  is]`** — substitua por exatamente o pedido do jeito que ele chegou até
  você: uma frase solta, um requisito colado direto de uma conversa, ou
  uma ideia que ainda nem virou requisito formal. Não pré-refine o pedido
  antes de colar aqui — quanto mais cru e ambíguo ele estiver, mais valor
  a Etapa 1 (as perguntas de esclarecimento) vai gerar. Se o pedido já
  chegar bem definido, sem problema: o próprio prompt instrui o agente a
  não interrogar por interrogar quando não há ambiguidade real.

## O prompt

```
Before writing any code for this request: [DESCRIBE THE REQUEST HERE — as
short or open-ended as it actually is].

Do not start implementing. Follow this sequence:

## 1. Clarify intent first
Ask a short set of pointed questions to pin down:
- What "done" actually looks like for this request.
- What's explicitly in scope vs. explicitly out of scope.
- Any constraints I haven't stated but probably have — existing patterns
  to follow, things not to touch, performance or compatibility needs.

If the request is genuinely ambiguous — more than one reasonable reading —
say so directly and lay out the interpretations side by side instead of
silently picking one and hoping it's right. Keep this round tight; don't
interrogate a request that's already clear.

## 2. Turn the clarified intent into a plan
Once scope is settled, write a step-by-step plan. Every step gets an
explicit verification check attached — a command to run, a test to pass, a
behavior to observe — never "should work." A step with no way to verify it
is a sign that step is too vague; break it down further.

## 3. Get a go-ahead
Show the plan and wait for a lightweight confirmation, or corrections,
before touching any code. A plan that changes after feedback is expected,
not a failure — re-confirm only the parts that changed.

## 4. Implement against the plan
Work through the plan in order. For each step, actually run its
verification check and show the result before checking it off — never
mark a step done because it "should" pass. If a step's verification
fails, stop and fix it before moving to the next step; don't build on an
unverified foundation.
```

## Exemplo de uso

Imagine que alguém deixou cair, no meio de uma conversa, o seguinte
pedido — sem dizer se o cupom é valor fixo ou percentual, se dá pra
combinar mais de um, ou quando ele expira:

- `[DESCRIBE THE REQUEST HERE...]` → "adiciona um sistema de cupom de
  desconto no checkout."

Na Etapa 1, o agente não escreve nada — ele devolve perguntas: "o cupom é
valor fixo, percentual, ou os dois?", "dá pra aplicar mais de um cupom no
mesmo pedido?", "o cupom expira por data, por número de usos, ou os
dois?". Como "valor fixo vs. percentual" é genuinamente ambíguo, ele
detalha as duas leituras lado a lado em vez de escolher sozinho.

Depois que você responde ("percentual, não acumulável, expira só por
data"), o agente escreve, na Etapa 2, um plano com passos como "criar
tabela de cupons" → verificação: a migração roda sem erro; "validar cupom
no endpoint de checkout" → verificação: teste cobrindo cupom válido,
expirado e inexistente passa; "aplicar o desconto no total do pedido" →
verificação: teste do cálculo passa.

Na Etapa 3, ele mostra esse plano e espera seu sinal verde — pode ser só
um "ok" ou um ajuste pontual ("esquece expiração por uso, só por data
mesmo"). Só na Etapa 4 ele começa a implementar, rodando e mostrando o
resultado de cada verificação antes de marcar o passo como feito. Se o
teste do cupom expirado falhar, ele para ali, corrige, e só então segue
pro próximo passo — nunca constrói em cima de um passo que não provou que
funciona.

## Dicas

- Pule as perguntas da Etapa 1 quando o pedido já for pequeno e
  inequívoco — o próprio prompt já avisa isso; não force o ritual numa
  correção de uma linha.
- O sinal verde da Etapa 3 é pra ser barato — um "pode seguir" ou uma
  correção pontual, não uma revisão de design completa. Guarde o
  escrutínio de verdade pras checagens de verificação do plano.
- Combina direto com as skills de brainstorm → plano → implementação →
  review do [superpowers](../tools/01-superpowers.md); este prompt é uma
  versão portátil e independente de ferramenta da mesma disciplina.
