# Superpowers

> [!IMPORTANT]
> Se você só for adotar **uma** ferramenta deste repositório inteiro, que seja essa. O resto do toolkit — orquestração de subagentes, proxy de tokens, personas de engenharia, quality gates de lint — otimiza *como* o trabalho é feito. Superpowers muda *quando* e *se* o trabalho deveria sequer começar: ela transforma o agente de IA de um executor que sai codando na primeira interpretação plausível do seu pedido em um parceiro disciplinado que questiona, planeja, delega e verifica antes de escrever a primeira linha de código. Todo o resto deste repositório pressupõe esse hábito já instalado.

## O que é

`superpowers` é um plugin do Claude Code — um pacote instalável que adiciona **skills** (habilidades: fluxos de trabalho nomeados que o agente pode invocar sob demanda) ao agente. Ele empacota uma biblioteca de **skills de processo**: fluxos reutilizáveis para cada etapa real de construir software — explorar a intenção por trás de um pedido, planejar, implementar, depurar, revisar, encerrar uma branch.

Isso é diferente de uma skill de *implementação*, que ensina uma tecnologia ou API específica ("como usar o React Router", "como estruturar uma migration"). Skills de processo ficam **acima** das de implementação: decidem quando e como abordar uma tarefa, antes de qualquer skill específica de domínio decidir o que escrever. É essa camada extra — a que decide *se* já dá pra começar a codar — que falta na maioria dos fluxos de IA, e é exatamente o que este plugin resolve.

Fonte: [`anthropics/claude-plugins-official`](https://github.com/anthropics/claude-plugins-official).

## Instalação

Dentro de uma sessão do Claude Code:

```text
/plugin marketplace add anthropics/claude-plugins-official
/plugin install superpowers@claude-plugins-official
```

Sem configuração adicional. A partir daí, a skill `using-superpowers` — a regra central descrita a seguir — é carregada automaticamente no início de toda conversa, e as demais skills ficam disponíveis para o agente invocar sob demanda.

## A regra central

Existe uma skill que roda por baixo de todas as outras: `using-superpowers`. Ela é carregada no início de toda conversa e define uma única regra, tratada como inegociável no próprio texto da skill:

> Se existe sequer 1% de chance de uma skill se aplicar ao que você está fazendo, você é obrigado a invocá-la — **antes de qualquer resposta ou ação**, incluindo perguntas de esclarecimento, explorar o código, ou checar arquivos.

Isso inverte a ordem que parece natural. O instinto é: entender o pedido, fazer uma pergunta de esclarecimento se precisar, *depois* procurar uma ferramenta. Superpowers roda a skill de processo primeiro — geralmente `brainstorming` para qualquer coisa criativa — e as perguntas de esclarecimento acontecem *dentro* dela, não antes. Responder, ou até só perguntar, antes de invocar a skill é exatamente o modo de falha que essa regra existe para evitar.

### Skills de processo vêm antes de skills de implementação

Quando mais de uma skill se aplica, quem decide a abordagem entra primeiro:

- "Vamos construir X" → `brainstorming` primeiro, skills de implementação depois.
- "Corrige esse bug" → `systematic-debugging` primeiro, skills de domínio depois.

### Os "red flags" — pensamentos que são o agente se convencendo a pular a regra

A skill inclui uma tabela de racionalizações comuns, porque "é só uma pergunta simples" é exatamente o tipo de pensamento que leva a pular a etapa que evitaria retrabalho depois. Uma amostra, traduzida do original:

| Pensamento | Por que é uma armadilha |
|---|---|
| "Isso é só uma pergunta simples" | Perguntas são tarefas. Verifique se uma skill se aplica. |
| "Preciso entender mais o contexto primeiro" | A checagem de skill vem ANTES das perguntas de esclarecimento. |
| "Deixa eu só explorar o código primeiro" | As skills dizem COMO explorar. Verifique antes de explorar. |
| "Isso não precisa de uma skill formal" | Se a skill existe, use-a. |
| "Eu lembro dessa skill" | Skills evoluem. Leia a versão atual. |
| "A skill é exagero pra isso" | Coisas simples viram complexas. Use-a mesmo assim. |

E uma ressalva importante, também tirada do texto original da skill: instruções explícitas suas — o `CLAUDE.md` do projeto, ou um pedido direto do tipo "pula o brainstorming, só faz X" — têm prioridade sobre as skills. A regra existe para impedir que o agente pule a etapa **por conta própria**, não para tirar de você a decisão final. Voltamos a esse ponto nas perguntas frequentes, no fim deste documento.

## As seis skills essenciais

Estas são as skills que formam o núcleo do ciclo — da ideia solta ao código testado. Para cada uma: o que faz, quando entra em ação, e um exemplo concreto. Os exemplos giram em torno de um mesmo cenário fictício — uma loja online genérica — para que dê pra acompanhar a mesma história do início ao fim.

### `brainstorming`

**O que faz:** conduz uma exploração socrática — perguntas direcionadas, uma de cada vez, no estilo do método de ensino por perguntas de Sócrates — da intenção, dos requisitos e do design por trás de um pedido, **antes** de qualquer trabalho criativo começar. "Criativo" aqui inclui criar uma feature, construir um componente, adicionar funcionalidade ou mudar um comportamento existente.

**Quando entra em ação:** todo pedido desse tipo passa primeiro por uma classificação em três caminhos, que o agente diz em voz alta para você poder corrigir:

- **Spike** — uma pergunta de viabilidade ("dá pra fazer X?"). O resultado é uma resposta, não código permanente.
- **Bounded** (limitado) — uma mudança bem delimitada num fluxo que **já existe** no código: um flag novo, um endpoint pequeno, uma correção de um arquivo só.
- **Architectural** (arquitetural) — projeto novo, subsistema novo, ou qualquer mudança que reestrutura como as peças se encaixam.

Na dúvida entre dois caminhos, a skill manda escolher o mais pesado. E o ajuste é de mão única: complexidade escondida que aparece no meio da tarefa faz o caminho subir de nível — nunca descer.

O detalhe que mais gente perde: em **qualquer** um dos três caminhos existe um portão de aprovação (a skill chama isso de *hard gate*). Nenhuma linha de código, nenhum scaffold, nenhuma skill de implementação é chamada antes de você ouvir o que o agente pretende fazer e dar um "sim" explícito. O que muda entre os caminhos é só o tamanho da cerimônia — duas frases no chat para o bounded, um documento de design completo salvo em disco para o architectural — a aprovação em si nunca é opcional.

**Exemplo prático.** Pedido: "adiciona um sistema de notificações no app."

Sem a skill, um agente "executor" já sairia escrevendo um serviço de notificação com e-mail, push e in-app de uma vez — são as opções óbvias — e provavelmente construiria pelo menos uma delas errada, porque nunca perguntou qual era o requisito real.

Com a skill:

```text
Agente: Isso é um subsistema novo, então vou tratar como arquitetural — vou
fazer algumas perguntas antes de propor um design.

Primeira pergunta: quais canais de notificação importam agora — e-mail,
push, in-app, ou mais de um?

Você: só in-app por enquanto.

Agente: Entendido. Segunda pergunta: precisa ser em tempo real (a
notificação aparece sem recarregar a página) ou um contador que atualiza
no próximo carregamento já resolve?

Você: tempo real seria ideal.

Agente: Terceira: qual o volume esperado — dezenas de notificações por
dia, ou milhares por minuto em horário de pico?
```

Só depois dessa sequência — nunca mais de uma pergunta por mensagem — a skill propõe 2 a 3 abordagens com vantagens e desvantagens de cada uma (por exemplo: *polling* simples a cada N segundos vs. um stream via *Server-Sent Events*, SSE, um canal HTTP de mão única do servidor pro navegador vs. um WebSocket completo), recomenda uma, apresenta o design em seções aprovadas uma a uma, e só então escreve um documento de design (spec). A skill para ali — literalmente para, sem tocar em código — até você aprovar esse documento por escrito.

### `writing-plans`

**O que faz:** pega uma especificação já aprovada e transforma num plano de implementação passo a passo e verificável, assumindo que quem for executar — possivelmente um subagente sem nenhum contexto do projeto — não sabe nada sobre o seu código nem sobre boas práticas de teste.

**Quando entra em ação:** logo depois que `brainstorming` termina o caminho arquitetural, ou sempre que já existe um requisito multi-etapa antes de tocar em código. Nunca antes de existir um design aprovado.

Mecânica que vale conhecer:

- Todo plano começa com um cabeçalho fixo: uma frase de objetivo (Goal), a arquitetura em 2-3 frases, o stack técnico, o caminho do documento de spec que o plano implementa, e uma seção de **restrições globais** (regras que valem para todas as tarefas — versão mínima de uma lib, convenção de nomes, etc.).
- Cada tarefa lista os arquivos exatos que cria ou modifica, as interfaces que consome de tarefas anteriores e produz para as seguintes, e os passos são "bite-sized" (mordida pequena): 2 a 5 minutos cada — "escreva o teste que falha", "rode e confirme que falha", "implemente o mínimo", "rode e confirme que passa", "commit".
- Regra explícita de **zero placeholder**: frases como "adicione tratamento de erro apropriado", "similar à Task 3" ou um teste descrito em prosa sem o código de verdade são tratadas como falha do plano, não como detalhe a resolver depois. Cada passo precisa trazer o conteúdo real que quem for implementar vai usar.
- Antes de entregar, a própria skill se autorrevisa: cobre toda a spec? tem placeholder escondido? os nomes de função e tipo usados numa tarefa tardia batem com os definidos numa tarefa anterior?

**Exemplo prático.** Continuando o sistema de notificações: com o design aprovado (in-app, tempo real via SSE, volume baixo), `writing-plans` gera um arquivo como `docs/superpowers/plans/2026-08-14-notificacoes-in-app.md`, com tarefas neste formato:

```text
### Task 3: Endpoint SSE de notificações

**Files:**
- Create: `src/routes/notifications/stream.ts`
- Test: `tests/routes/notifications-stream.test.ts`

**Interfaces:**
- Consumes: `NotificationService.subscribe(userId): AsyncIterable<Notification>` (Task 2)
- Produces: rota `GET /notifications/stream`, emite eventos SSE `notification`

- [ ] Passo 1: escrever o teste que falha (conecta, publica uma
      notificação pro usuário, espera receber o evento SSE)
- [ ] Passo 2: rodar e confirmar que falha porque a rota não existe
- [ ] Passo 3: implementar a rota mínima que passa no teste
- [ ] Passo 4: rodar e confirmar que passa
- [ ] Passo 5: commit
```

Nenhuma dessas linhas é um resumo — o plano de verdade traz o corpo do teste, a assinatura exata da função, o caminho exato do arquivo. Quem for implementar a Task 3 não precisa adivinhar nada disso.

> Prompt pronto que cobre exatamente essa transição, de ideia solta a plano formal: [Brainstorm até plano](../prompts/04-brainstorm-to-plan.md).

### `subagent-driven-development`

**O que faz:** executa um plano despachando um **subagente** implementador — uma instância separada do agente, que não herda o histórico da conversa atual e recebe só o contexto que você decide passar para ela — para cada tarefa, sob um contrato fixo: se a tarefa está ambígua, o subagente pergunta **antes** de escrever qualquer código; implementa seguindo TDD (a próxima skill desta lista); se autorrevisa antes de reportar; e devolve um de quatro status explícitos — `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT` ou `BLOCKED` — nunca um resumo livre.

**Quando entra em ação:** depois que existe um plano escrito e você decide executá-lo na sessão atual. (A alternativa, `executing-plans`, roda numa sessão separada com pausas para revisão humana entre tarefas — ver a seção de skills de apoio.)

Detalhe importante: o comportamento padrão da skill é **serial** — um implementador por vez, nunca dois em paralelo — porque dois subagentes editando o mesmo arquivo ao mesmo tempo podem se atropelar, e dois commits concorrentes podem corromper o histórico do git. Depois que um subagente termina e reporta, o orquestrador despacha um *segundo* subagente — um revisor de tarefa — que confere duas coisas obrigatórias: a tarefa bate com a especificação, **e** a qualidade do código está adequada. Só as duas aprovadas juntas fecham a tarefa; senão entra num loop de correção com um teto de tentativas antes de escalar a decisão para você. No fim de todas as tarefas, roda ainda uma revisão final olhando a branch inteira.

> [!TIP]
> Esse padrão serial é o *default* da skill, não uma lei física — dá para rodar várias tarefas **genuinamente independentes** em paralelo com segurança, desde que nenhuma duas toquem no mesmo arquivo e nenhum implementador faça commit sozinho. É exatamente o que [Orquestração de subagentes](02-subagent-orchestration.md) descreve como "execução em ondas", e o prompt pronto [Parallel wave dispatch](../prompts/05-parallel-wave-dispatch.md) automatiza.

**Exemplo prático:**

```text
[Task 2 do plano de notificações: NotificationService.send()]

Subagente implementador: Antes de começar — se o envio falhar (usuário
sem preferências configuradas, por exemplo), a função deve lançar uma
exceção ou devolver um resultado tipado com erro?

Você: devolve um resultado tipado — { ok: false, reason: string }.

Subagente: [implementa via TDD, roda os testes, se autorrevisa, encontra
e corrige um caso que faltava — usuário com notificações desativadas nas
preferências — e faz commit]

Status: DONE. 6/6 testes passando. Sem pendências.

[Orquestrador despacha um subagente revisor de tarefa]

Revisor: Spec ✅ — todos os requisitos da Task 2 atendidos. Qualidade:
aprovado. Sem achados.

[Task 2: completa. Próxima tarefa.]
```

Se o subagente implementador tivesse travado ("preciso de mais contexto sobre X"), o orquestrador responderia e o redespacharia — nunca force um subagente travado a tentar de novo sem mudar nada.

### `dispatching-parallel-agents`

**O que faz:** quando existem 2 ou mais problemas genuinamente independentes — sem estado compartilhado, sem um depender da ordem do outro — despacha um subagente para cada um **na mesma mensagem**, em vez de investigar ou implementar um de cada vez.

**Quando entra em ação:** o caso canônico da skill é investigação: várias falhas desconectadas (arquivos de teste diferentes, subsistemas diferentes) depois de uma mudança grande. Ela também vale para qualquer par de tarefas independentes fora desse caso — mas quando as tarefas são passos de **um mesmo** plano de implementação, o padrão mais específico é a "execução em ondas" descrita acima em `subagent-driven-development` e detalhada em [Orquestração de subagentes](02-subagent-orchestration.md).

**Exemplo prático.** Depois de um refactor grande no checkout, três suítes de teste ficam vermelhas ao mesmo tempo, em arquivos sem relação entre si:

```text
tests/cart/discount-calculation.test.ts   — 2 falhas
tests/checkout/payment-flow.test.ts       — 1 falha
tests/orders/history-pagination.test.ts   — 3 falhas
```

Investigar uma de cada vez desperdiça tempo, porque corrigir o cálculo de desconto não tem nenhum efeito sobre a paginação do histórico de pedidos. A skill despacha os três de uma vez, cada um com escopo, contexto e restrições próprios:

```text
Subagente 1: "Corrija as 2 falhas em discount-calculation.test.ts. Não
mude nenhum outro arquivo. Devolva: causa raiz + o que foi mudado."
Subagente 2: "Corrija a falha em payment-flow.test.ts. [mesmas regras]"
Subagente 3: "Corrija as 3 falhas em history-pagination.test.ts. [mesmas regras]"
```

As três chamadas saem na mesma resposta — é isso que define "paralelo" aqui: mais de um despacho na mesma mensagem roda de forma concorrente; um despacho por mensagem roda em série, mesmo que os problemas sejam independentes. Quando os três voltam, o orquestrador lê os três resumos, confere se algum mexeu em arquivo do outro, e só então roda a suíte completa.

### `systematic-debugging`

**O que faz:** investigação de **causa raiz** — a origem real do problema, não o ponto onde o sintoma aparece — baseada em evidência, antes de propor qualquer correção. A regra que o próprio texto da skill chama de "lei de ferro": **nenhuma correção sem investigação de causa raiz primeiro.**

**Quando entra em ação:** qualquer bug, teste falhando ou comportamento inesperado — especialmente sob pressão de tempo, que é exatamente quando "só troca essa linha e testa" fica mais tentador.

Mecânica real, em quatro fases obrigatórias, nesta ordem:

1. **Investigação da causa raiz** — ler a mensagem de erro inteira (não só a primeira linha), reproduzir o problema de forma confiável, checar o que mudou recentemente (`git log`, `git diff`), e — em sistemas com várias camadas — instrumentar **cada fronteira** entre componentes com log, para ver exatamente onde o valor esperado vira o valor errado, em vez de adivinhar a camada culpada.
2. **Análise de padrão** — comparar com um exemplo parecido que funciona; listar toda diferença, por menor que pareça.
3. **Hipótese e teste mínimo** — uma hipótese de cada vez ("acho que a causa é X, porque Y"), a menor mudança possível para testá-la, nunca duas mudanças ao mesmo tempo.
4. **Implementação** — só agora escreve um teste que reproduz o bug (isso entrega para `test-driven-development`), corrige a causa raiz — nunca o sintoma — e verifica.

Se três correções seguidas falharem, a skill manda **parar** e questionar a arquitetura em vez de tentar uma quarta: três tentativas falhas geralmente significam que o problema não está onde você está procurando.

**Exemplo prático.** Relato: "o total do carrinho às vezes vem errado depois de aplicar um cupom de desconto."

Sem a skill, o agente veria a linha que calcula o desconto, acharia que entendeu o problema, mudaria o arredondamento, e entregaria — sem nunca confirmar que essa era mesmo a causa.

Com a skill:

```text
Agente: Vou reproduzir antes de mexer em qualquer coisa.
[Reproduz: acontece só quando o usuário muda a quantidade de um item
DEPOIS de já ter aplicado o cupom.]

Vou checar o que mudou recentemente na área de descontos.
[git log --oneline -- src/cart/discount.ts, últimos 30 dias]

O sistema tem 3 camadas aqui — serviço de carrinho, motor de desconto,
formatador de preço. Vou logar o valor em cada fronteira pra achar onde
ele vira errado, em vez de chutar a camada.
[Roda uma vez com logging temporário]

Achado: o valor entra certo no motor de desconto, mas SAI aplicado duas
vezes. Hipótese: o carrinho recalcula o desconto do zero a cada mudança
de quantidade, mas nunca remove o desconto anterior antes de recalcular.

[Faz a menor mudança possível pra testar a hipótese, confirma, SÓ ENTÃO
escreve o teste de regressão e corrige na origem: o recálculo do
carrinho, não o motor de desconto.]
```

A correção final fica numa linha bem diferente da que o "chute" inicial teria mudado — e vem acompanhada de um teste que trava esse cenário específico para sempre.

### `test-driven-development`

**O que faz:** o ciclo clássico vermelho-verde-refatorar (*red-green-refactor*): escreve o teste primeiro (vermelho — ele **tem** que falhar), a implementação mínima que faz o teste passar (verde), depois melhora o código mantendo os testes passando (refatorar). A lei de ferro da skill: **nenhum código de produção sem um teste que falhou primeiro.**

**Quando entra em ação:** toda feature nova e todo bug fix, antes de escrever qualquer código de implementação — inclusive dentro de cada tarefa despachada por `subagent-driven-development`.

O detalhe que costuma ser pulado: depois de escrever o teste, rodar e **confirmar que ele falha pelo motivo certo** — "função não existe" ou "resultado errado", nunca um erro de digitação ou de configuração. Um teste que passa de primeira não prova nada: você nunca viu ele falhar, então não sabe se ele testa a coisa certa. E se código de implementação foi escrito antes do teste por engano, a regra é literal: apague e comece de novo. Não "adapte enquanto escreve o teste depois", não guarde "como referência".

**Exemplo prático.** Função `applyDiscountCode()` na mesma loja fictícia:

```javascript
// VERMELHO — escreve primeiro, roda, confirma que falha
test('aplica 10% de desconto com cupom válido', () => {
  const cart = { items: [{ price: 100 }], total: 100 };
  const result = applyDiscountCode(cart, 'SAVE10');
  expect(result.total).toBe(90);
});
// Rodando: FAIL — applyDiscountCode não está definida. Motivo certo.

// VERDE — implementação mínima que passa
function applyDiscountCode(cart, code) {
  if (code === 'SAVE10') {
    return { ...cart, total: cart.total * 0.9 };
  }
  return cart;
}
// Rodando: PASS.

// REFATORAR — só depois de verde, sem mudar comportamento
// (ex: extrair a tabela de cupons pra um objeto separado)
```

Sem a skill, é comum ver a ordem inversa: implementar `applyDiscountCode` já cobrindo vários cupons e casos de borda "por precaução", escrever um teste depois só pra bater o olho, e nunca saber de verdade se aquele teste pegaria uma regressão.

## O resto do elenco: as skills de apoio

As seis acima cobrem o coração do ciclo — da ideia ao código testado. As sete abaixo cobrem o resto do ciclo de vida: como isolar o trabalho, como fechar uma tarefa, como dar e receber revisão, e como a própria biblioteca de skills se mantém. Menos protagonismo individual, mas cada uma fecha uma lacuna que, sem ela, vira um hábito ruim silencioso.

| Skill | Papel no ciclo de vida |
|---|---|
| `using-git-worktrees` | Isola o trabalho numa *worktree* — uma segunda cópia de trabalho do mesmo repositório git, em outra pasta, numa branch própria — antes de a implementação começar, pra nunca sujar a branch em que você já estava. |
| `executing-plans` | A alternativa a `subagent-driven-development` quando não há subagentes disponíveis, ou quando você quer rodar o plano numa sessão separada com uma pausa de revisão humana entre cada tarefa, em vez de execução contínua. |
| `requesting-code-review` | Despacha um subagente revisor com contexto preciso (nunca o histórico inteiro da sessão) depois de cada tarefa, de uma feature grande, ou antes de mergear — pega problema antes de ele se espalhar. |
| `receiving-code-review` | Como processar o retorno de uma revisão: ler tudo, reafirmar o requisito com suas próprias palavras, verificar contra o código de verdade, e só então concordar ou discordar tecnicamente — nunca um "você está certíssimo!" automático, nem uma implementação cega. |
| `finishing-a-development-branch` | Depois que os testes estão verdes: roda a suíte completa, detecta se você está numa worktree, apresenta as opções reais (merge local / push + PR / manter como está) e limpa o workspace — nunca descarta trabalho sem uma confirmação explícita e literal. |
| `verification-before-completion` | O freio final: nenhuma alegação de "pronto", "corrigido" ou "os testes passam" sem ter rodado o comando de verificação **naquele mesmo turno** e lido a saída real. "Deveria funcionar agora" não conta. |
| `writing-skills` | A skill que escreve outras skills — literalmente TDD aplicado à documentação de processo: escreve um cenário de pressão, observa um agente falhar sem a skill, escreve a skill, confirma que agora ele obedece. É assim que o próprio catálogo de skills evolui. |

## Do pedido vago ao código: um exemplo encadeado

As seções acima mostram cada skill isolada. Na prática elas se encadeiam dentro de **um** pedido só, sem você precisar invocar nada manualmente — a regra central (`using-superpowers`) é quem decide qual roda a seguir. Reconstruindo o exemplo da loja fictícia do início ao fim:

**1. Pedido:** "adiciona um sistema de notificações no app."

**2. `brainstorming` assume, antes de qualquer resposta.** Classifica como arquitetural (subsistema novo), faz as perguntas uma de cada vez (canal, tempo real, volume), propõe SSE em vez de polling ou WebSocket completo, apresenta o design em seções, escreve `docs/superpowers/specs/2026-08-14-notificacoes-design.md`, e para — literalmente para, sem tocar em código — até você aprovar por escrito.

**3. Você aprova. `writing-plans` assume.** Transforma a spec aprovada em `docs/superpowers/plans/2026-08-14-notificacoes-in-app.md`: cabeçalho com objetivo, arquitetura e restrições globais, e uma lista de tarefas bite-sized — migração da tabela de notificações, `NotificationService`, endpoint SSE, componente de sino de notificação no frontend — cada uma com arquivos exatos e testes com código de verdade, sem nenhum placeholder. No fim, pergunta: execução via subagente, ou inline nesta mesma sessão?

**4. Você escolhe subagente. `subagent-driven-development` assume.** Um implementador por tarefa, cada um seguindo `test-driven-development` por dentro (teste primeiro, roda, vê falhar, implementa o mínimo, roda de novo, commit), se autorrevisando antes de reportar. Duas das tarefas — a migração do banco e o texto de um e-mail transacional de exemplo — não dependem uma da outra nem tocam nos mesmos arquivos: é aqui que a execução em ondas de [Orquestração de subagentes](02-subagent-orchestration.md) despacha as duas juntas em vez de esperar uma terminar. Cada tarefa passa por um subagente revisor (spec + qualidade) antes de ser marcada como completa.

**5. Se aparecesse um bug no meio do caminho** — digamos, o contador de notificações não lidas dessincroniza depois de marcar uma como lida — `systematic-debugging` assumiria antes de qualquer correção: reproduzir, checar mudanças recentes, instrumentar as fronteiras entre o serviço e o componente, uma hipótese por vez.

**6. Depois da última tarefa, revisão final, e `finishing-a-development-branch` assume.** A suíte completa roda verde, a skill detecta que você está numa worktree isolada, e pergunta: merge local, push + PR, ou manter como está?

Seis skills, uma cadeia só, zero decisão de "qual ferramenta usar agora" tomada manualmente por você no meio do caminho. Para um exemplo ainda mais completo — incluindo como isso se encaixa no resto do fluxo do repositório — ver o [Playbook de onboarding](../02-playbook-onboarding.md).

## Dicas e boas práticas

**Quando é apropriado pular uma skill.** Estritamente, segundo o texto da própria `using-superpowers`, a resposta é "nunca, se ela se aplica" — mas "se aplica" é medido pela classificação de `brainstorming` (spike / bounded / architectural), que já existe justamente para escalar a cerimônia para o tamanho da tarefa. Uma correção de uma linha, numa área do código já lida e entendida, é **bounded**: um par de perguntas, um design de duas frases no chat, aprovação, implementa — nunca um documento de spec de 300 palavras. O erro comum é forçar uma tarefa pequena para o caminho architectural (cerimônia demais) ou chamar de bounded algo que na verdade reestrutura uma interface da qual outras partes do sistema dependem (cerimônia de menos). Vale a pena o seu projeto formalizar, no próprio `CLAUDE.md`, um critério objetivo do que conta como trivial de verdade (número de arquivos, presença ou não de um fluxo já existente para mudar) — assim o agente não fica reclassificando o mesmo tipo de tarefa toda hora.

**Combinando com orquestração de subagentes.** `subagent-driven-development` decide **o quê** cada subagente faz e sob qual contrato (perguntar antes, TDD, autorrevisão, status explícito) — mas o padrão dela é um implementador por vez, em série. [Orquestração de subagentes](02-subagent-orchestration.md) decide **quantos** rodam ao mesmo tempo: tarefas com arquivos totalmente disjuntos e sem dependência entre si podem rodar em "ondas" paralelas, desde que nenhum subagente faça commit sozinho — isso fica para o orquestrador, depois que a onda inteira termina. As duas camadas são complementares, não concorrentes: uma nunca substitui o contrato da outra.

**Escolha de modelo por papel.** A própria `subagent-driven-development` recomenda nunca deixar um subagente herdar silenciosamente o modelo da sessão principal: tarefa mecânica e bem especificada (uma função isolada, spec completa) vai para o modelo mais barato disponível; integração e depuração vão para o modelo padrão; julgamento arquitetural — e a revisão final da branch inteira — vai para o modelo mais capaz disponível. Turnos importam mais que preço por token: um modelo bem mais barato que gasta 3x mais turnos numa tarefa multi-etapa geralmente sai mais caro no total.

**Skills de processo não substituem skills de implementação — elas as precedem.** Depois que `brainstorming` aprova o design de um componente, por exemplo, a skill de padrões específicos do seu stack ainda entra em cena para decidir os detalhes da implementação. `using-superpowers` só garante que a ordem entre as duas nunca se inverte.

## Perguntas frequentes

**Isso deixa tudo mais lento?**
Para uma tarefa trivial, se você forçar o caminho architectural sem necessidade, sim. Mas a classificação em spike/bounded/architectural existe exatamente para evitar isso — uma correção bounded custa um par de perguntas e duas frases de design, não um documento de spec. O tempo que a skill "gasta" perguntando costuma ser menor que o tempo perdido implementando a interpretação errada de um pedido ambíguo, ou descobrindo duas semanas depois um bug cuja causa raiz nunca foi investigada de verdade.

**Funciona para tarefas pequenas também?**
Sim — é literalmente para isso que existe o caminho **bounded**: contexto rápido, as perguntas que realmente importam, um design de poucas frases no chat, aprovação, implementa. Sem documento de spec, sem plano formal. A skill nunca é tudo ou nada.

**Dá para desativar uma skill específica?**
O plugin não vem com um botão de "desligar só essa skill". O que existe, e é explícito no próprio texto de `using-superpowers`, é uma hierarquia de prioridade: instruções diretas suas — um `CLAUDE.md` de projeto, ou um pedido explícito do tipo "pula o brainstorming, só implementa isso" — têm prioridade sobre qualquer skill. A regra existe para impedir que o agente pule uma etapa por conta própria, não para tirar de você a palavra final. Para desativar de vez, a opção é desinstalar o plugin inteiro.

**E se eu simplesmente pedir pro agente codar direto, sem passar pelo processo?**
Funciona — e é diferente de o agente decidir pular a etapa sozinho. Um pedido explícito seu é a instrução de maior prioridade no sistema; a skill só existe para cobrir os casos em que ninguém disse nada e o agente, por conta própria, iria direto para o código.

**Superpowers conflita com Ponytail ou Caveman?**
Não — são camadas independentes que resolvem problemas diferentes. Superpowers decide **quando** parar para perguntar, planejar e verificar. [Ponytail](04-ponytail.md) decide **o que** construir, uma vez que já está implementando (o mínimo que resolve o problema, sem abstração especulativa). [Caveman](05-caveman.md) decide só **como** o agente fala sobre o que fez. As três compõem bem porque nenhuma opina sobre o território da outra — ver [Visão geral](../00-overview.md) para como as peças do toolkit se encaixam.
