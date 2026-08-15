# Visão geral

Isto não é uma lista de ferramentas. É um fluxo de trabalho, montado peça por
peça a partir do uso real, dia a dia, em código que vai pra produção — não um
conjunto de plugins escolhidos por moda passageira. Cada peça deste conjunto
resolve um jeito específico de as coisas darem errado que as outras peças não
resolvem: sozinha, cada uma é só mais uma conveniência; juntas, formam um
jeito diferente de trabalhar com um agente de IA (o termo genérico pra uma
ferramenta como o Claude Code, que lê o seu código, decide o que fazer e
executa comandos por conta própria) dentro de uma base de código real.

Leia esta página primeiro. Os documentos de cada ferramenta individual (pasta
[`tools/`](tools/)) fazem muito mais sentido depois que você entende como as
sete peças se encaixam — sem esse contexto, cada uma parece uma ferramenta
isolada, e essa não é a proposta deste repositório.

## 1. Orquestração, não implementação solo

A sessão principal — a conversa que você tem diretamente com o agente — tem
um único trabalho: entender o problema, decidir o que fazer, e coordenar. Ela
não escreve código de produção com as próprias mãos. O trabalho real é
delegado a **subagentes especialistas** nomeados. Um subagente é uma segunda
instância do mesmo agente de IA, disparada pela sessão principal com uma
tarefa específica, um escopo bem definido e contexto próprio — como um colega
a quem você entrega um chamado já bem descrito, em vez de um clone seu
tentando adivinhar o que fazer sozinho.

Pense num tech lead experiente: ele nunca senta sozinho pra codificar um
sistema inteiro do início ao fim. Ele entende o problema, desenha a solução
em linhas gerais, e distribui cada pedaço pra quem tem mais propriedade sobre
aquele assunto — o desenho do banco de dados vai pro especialista em dados, a
tela vai pro dev de front-end, o trecho sensível de segurança passa por um
revisor de segurança antes de ir pro ar. Esse tech lead nunca perde a visão
do todo, mas também nunca vira gargalo tentando fazer tudo com as próprias
mãos. É exatamente esse o papel da sessão principal aqui: ela pensa, decide e
delega — nunca implementa diretamente.

Isso importa porque um agente genérico tentando dar conta de tudo — banco de
dados, interface, segurança, testes — perde o fio da meada assim que a tarefa
deixa de ser trivial: ele não parte de um checklist específico pra revisão de
autenticação, por exemplo, nem sabe de antemão quais classes de
vulnerabilidade importam numa mudança de login — ele reinventa um processo
apressado a cada vez, do zero. Um conjunto de especialistas, cada um com
escopo estreito e um gatilho claro de "quando usar", começa toda tarefa a
partir do checklist certo, em vez de inventar um debaixo de pressão.

Tem uma segunda camada dentro deste pilar que costuma passar despercebida:
além de qual especialista chamar, importa também em qual "nível" de modelo
ele roda. Uma tarefa mecânica — uma busca no código, a edição de um único
arquivo com a mudança já 100% especificada — não precisa do modelo mais caro
disponível; uma decisão arquitetural de verdade precisa do mais forte. Deixar
cada disparo herdar por padrão o modelo da sessão principal tende a gastar
poder de sobra numa tarefa simples e, ocasionalmente, poder de menos numa
tarefa difícil — por isso o nível do modelo é escolhido explicitamente a cada
disparo, nunca herdado por acidente.

E quando duas ou mais tarefas são de fato independentes — nenhuma mexe no
arquivo da outra, nenhuma espera pelo resultado da outra — elas são
disparadas em paralelo, numa "onda" só, em vez de esperar uma terminar pra
começar a próxima. O ganho de velocidade é real, mas só é seguro sob duas
condições ao mesmo tempo: nenhum subagente da mesma onda toca num arquivo que
outro também toca, e nenhum deles comita o próprio trabalho — quem comita,
sempre em ordem, é a sessão principal, depois que a onda inteira termina. Os
detalhes completos — como marcar cada tarefa com os arquivos que ela toca,
como as ondas são formadas, e a saída de emergência pra quando dois pedaços
realmente não dá pra separar — estão em
[Orquestração de subagentes](tools/02-subagent-orchestration.md).

## 2. Brainstorm → plano → implementação → revisão

Código é a última etapa, não a primeira. Deixado por conta própria, um agente
tende a pular direto pra escrever código: interpreta o pedido do jeito que
pareceu mais óbvio na hora, sem confirmar as premissas, e só descobre que
construiu a coisa errada depois de o código já estar todo escrito — quando o
retrabalho já custou tempo de verdade. A disciplina deste pilar existe pra
cortar esse caminho antes mesmo de ele começar.

Primeiro se explora a intenção: o que exatamente está sendo pedido, e por quê
— perguntas que parecem óbvias vistas de fora, mas que, quando puladas, são a
causa da maior parte do retrabalho depois. Essa exploração vira um plano
explícito e revisável, escrito, em vez de uma ideia solta só na cabeça do
agente. O plano só então vira código. E o código passa por uma revisão antes
de ser considerado pronto — nunca "escrevi e torço pra estar certo".

Essa sequência de quatro etapas — explorar, planejar, implementar, revisar —
é também o que a camada de orquestração do pilar 1 efetivamente executa: cada
subagente especialista entra em cena numa dessas etapas, não em qualquer uma.
E cada etapa, por sua vez, tem uma habilidade nomeada e específica por trás
dela (ver [Superpowers](tools/01-superpowers.md)) — o que faz a diferença
entre "seguimos um processo" como boa intenção e "seguimos um processo" de
fato, toda vez, mesmo com pressa.

## 3. Uma camada de economia de tokens

Um token é a unidade que um modelo de linguagem usa pra medir — e cobrar —
tanto o que ele lê quanto o que ele escreve; grosso modo, um pedaço de
palavra. Numa sessão longa, cada comando que o agente roda no terminal —
checar o status do git, ver um diff, rodar a suíte de testes — devolve uma
saída em texto que consome tokens da janela de contexto (o tanto de texto que
o modelo consegue "enxergar" de uma vez), mesmo quando ninguém vai ler aquele
texto inteiro, linha por linha.

Uma camada de proxy — um script que intercepta o comando antes de ele rodar
de verdade — reconhece um punhado de comandos de leitura, repetitivos e
conhecidos (status, diff, log, grep, busca de arquivo) e devolve uma versão
enxuta e equivalente do resultado, em vez da saída bruta e inteira. Pro
agente, isso é transparente: nenhuma instrução extra pra lembrar, nenhuma
etapa a mais no meio do caminho — o comando simplesmente volta mais barato.
Na prática, é isso que permite uma sessão rodar por horas sem a janela de
contexto lotar de saída que ninguém ia usar mesmo.

O desenho já prevê o que acontece quando o proxy falha: se o binário que faz
a reescrita está ausente, ou dá erro, o hook — um gancho, ou seja, um script
que roda automaticamente antes ou depois de uma ação do agente — deixa o
comando original passar sem filtro nenhum, em vez de travar a sessão inteira
por causa de uma ferramenta auxiliar quebrada. E os próprios comandos de meta
do proxy — ver quanto já foi economizado, ver o histórico do que foi
reescrito, ou rodar um comando bruto sem filtro algum — ficam de fora da
reescrita, senão o proxy acabaria filtrando a si mesmo.

Ver [Padrão de proxy de tokens](tools/03-rtk-token-proxy.md) pro desenho
completo do hook e pras pegadinhas de reescrever um comando sem
acidentalmente mudar o que ele faz.

## 4. Duas camadas de personalidade compostas

Duas camadas de comportamento, independentes uma da outra, se empilham em
cima do agente base:

- **O que é construído** — uma disciplina de "engenheiro sênior preguiçoso":
  preguiça, aqui, significa eficiência, não descuido. Antes de escrever
  qualquer código, o agente percorre uma escada de perguntas, em ordem, e
  para na primeira que já resolve o problema: isso precisa existir de
  verdade? já existe algo parecido nesta própria base de código? a
  biblioteca padrão da linguagem já resolve? um recurso nativo da
  plataforma resolve (um campo de data do próprio HTML em vez de uma lib de
  calendário, uma restrição do banco em vez de código de aplicação)? uma
  dependência que já está instalada resolve? dá pra fazer numa linha só? Só
  depois de esgotar essas perguntas — e só então — o agente escreve o
  mínimo de código novo que resolve de verdade. É a sigla **YAGNI** ("you
  aren't gonna need it" — você não vai precisar disso) levada a sério, como
  reflexo, e não como slogan.
- **Como o agente fala sobre isso** — uma camada de compressão de
  comunicação: tira do texto do agente o enchimento — frases de cortesia,
  hesitação, "ótima pergunta!", "vou seguir em frente e..." — sem tirar
  informação nenhuma: números, unidades, código e o texto exato de um erro
  atravessam intactos. A ideia é reportar o resultado, não narrar o
  processo de chegar até ele.

As duas camadas são independentes de propósito, porque resolvem problemas
diferentes: disciplina de engenharia decide o que termina no repositório;
estilo de comunicação decide o que aparece na tela pra um humano ler. Um
agente que fala pouco ainda pode, por conta própria, construir uma abstração
que ninguém pediu; um agente que constrói exatamente o necessário ainda pode
devolver um parágrafo enorme explicando a própria decisão. Compor duas
camadas focadas, cada uma cuidando de um problema só, funciona melhor do que
uma única camada tentando dar conta dos dois ao mesmo tempo — e cada projeto
pode ligar só uma delas, se for o caso.

Nenhuma das duas é absoluta. Do lado da engenharia, a "preguiça" nunca abre
mão de validação de entrada em fronteiras de confiança, tratamento de erro
que evita perda de dado, medidas de segurança, acessibilidade básica, e
qualquer coisa pedida explicitamente — e ela nunca se aplica ao entendimento
do problema, só à solução: o agente ainda precisa ler e entender o fluxo real
antes de escolher o degrau da escada, porque um diff pequeno no lugar errado
não é preguiça, é só mais um bug. Do lado da comunicação, a compressão se
desliga sozinha diante de avisos de segurança, confirmações antes de uma ação
irreversível, ou qualquer situação em que encurtar a frase criaria
ambiguidade técnica de verdade — clareza vence brevidade exatamente nos
momentos em que isso mais importa.

Ver [Ponytail](tools/04-ponytail.md) e [Caveman](tools/05-caveman.md).

## 5. Gates de qualidade como migração rastreada

Lint é a checagem automática de estilo e de padrões arriscados no código —
por exemplo, uma variável nunca usada, ou uma função complexa demais pra ler
de uma vez. Uma regra nova de lint nunca deveria pular direto de "desligada"
pra "erro que trava a build": isso ou trava o trabalho de todo mundo da noite
pro dia, ou é desligada de novo assim que alguém reclamar — e nenhuma das
duas opções muda o código de verdade.

Em vez disso, toda regra nova entra primeiro como aviso (warning): visível no
relatório do lint, mas sem travar nada. Isso transforma a quantidade de
violações num número real, público e visível — não numa frase do tipo
"depois a gente aperta isso", que na prática ninguém nunca revisita de novo.
Só quando esse número chega a zero, a regra é promovida a erro de verdade —
e, dali em diante, o gate fica fechado pra sempre. Ele aperta aos poucos;
nunca é imposto de surpresa.

Esse mesmo espírito — escolha deliberada e documentada, em vez do padrão de
fábrica de uma ferramenta aceito sem pensar — aparece em outras decisões do
mesmo setup: usar dois linters com responsabilidades diferentes e sem
sobreposição entre si (um cobrindo um punhado pequeno de regras específicas,
escolhidas a dedo; o outro cobrindo o grosso das regras que dependem de
informação de tipo ou são específicas de um framework); manter o formatador
de código desligado de propósito numa base que nunca passou por um — rodar
um formatador pela primeira vez numa base de código grande produz milhares de
linhas de diff só de formatação, sem relação nenhuma com bug real, e isso só
atrapalha a revisão de verdade; e até registrar a mesma regra de arquitetura
duas vezes, em severidades diferentes — uma em erro, pras fronteiras que o
time já se comprometeu a nunca mais cruzar; outra em aviso, pra uma dívida já
conhecida, que ainda está sendo paga aos poucos, mas que continua visível
enquanto isso.

Ver [Quality gates ESLint/Biome](tools/06-eslint-biome-quality-gates.md).

## 6. Um grafo de conhecimento do código

Antes de mexer numa parte da base de código que ainda não conhece, um agente
precisa se orientar: o que chama o quê, quais módulos são centrais (mudar ali
afeta metade da aplicação), o que mais quebra se este arquivo mudar. Refazer
essa investigação do zero com busca de texto simples a cada sessão é lento e
caro em tokens — o agente lê arquivo atrás de arquivo tentando reconstruir
uma imagem que, na sessão anterior, ele já tinha montado e simplesmente
jogou fora ao terminar.

Um **grafo de conhecimento** persistente — um "mapa" das relações entre as
partes do projeto, salvo em disco e reaproveitado entre sessões — resolve
isso guardando essa estrutura de uma sessão pra outra: ele lê a base de
código — e, opcionalmente, documentação, artigos e imagens — e monta uma
rede de nós (arquivos, funções, conceitos) e das relações entre eles, já
identificando os nós de maior conectividade — os arquivos que, se
quebrarem, arrastam muita coisa junto — e agrupando conteúdo relacionado em
comunidades. O resultado fica disponível de três formas ao mesmo tempo: um
grafo interativo em HTML pra explorar visualmente, um grafo em JSON pronto
pra consulta por outro agente, e um relatório em linguagem simples, direto
de ler.

Perguntas como "o que chama esta função" ou "qual a relação entre estes dois
conceitos" viram uma única consulta, em vez de dezenas de leituras
exploratórias — e uma atualização incremental, que só reprocessa os arquivos
que mudaram, mantém o grafo em dia sem reconstruir tudo de novo a cada
commit.

Ver [Graphify](tools/07-graphify.md).

## 7. Um sistema de memória em duas camadas

Duas camadas, cada uma resolvendo um problema diferente:

- Um **índice pequeno, sempre carregado**, pra fatos que a sessão precisa
  saber *antes* de começar a trabalhar — uma lição aprendida com esforço,
  uma armadilha já conhecida de alguma ferramenta, uma decisão que, sem esse
  registro, seria redescoberta do jeito difícil de novo a cada sessão. Fica
  deliberadamente pequeno — um teto informal de mais ou menos 130 linhas,
  uma linha por lembrete — porque inflar esse índice é o mesmo que garantir
  que ninguém vai lê-lo até o fim.
- Um **cofre estruturado de longo prazo**, sem limite de tamanho, consultado
  sob demanda em vez de carregado toda sessão — é pra onde vai a cauda longa
  do que vale a pena guardar mas não precisa pular aos olhos toda vez:
  específico demais, raro demais, ou grande demais pra caber no índice sem
  estourar o teto acima.

Antes de qualquer coisa entrar no índice rápido, vale um teste simples: uma
sessão futura ficaria surpresa — e agradecida — de saber disso antes de
começar? Coisa derivável só de ler o código de novo, prazo, motivação, ou
passo de debug não passa nesse teste. E quando uma entrada do índice deixa de
merecer aquele espaço nobre, ela não é simplesmente apagada: existe um
caminho de migração — buscar duplicata no cofre de longo prazo primeiro,
casar com o modelo exigido por aquela pasta, criar a nota, confirmar lendo
ela de volta, e só então apagar a cópia curta — porque uma migração não
confirmada é perda de dado, não uma simples mudança de lugar.

Na prática, esse cofre de longo prazo costuma ser um vault — um cofre de
notas em Markdown puro — do Obsidian, acessado exclusivamente por um
servidor MCP (Model Context Protocol, um jeito padronizado de expor
ferramentas e dados pra um agente de IA, em vez de acesso direto a arquivo).
Passar pelo servidor em vez de mexer direto no arquivo é o que garante que
toda nota nasça no formato certo — frontmatter (o bloco de metadados no topo
do arquivo) obrigatório, um modelo por pasta, links que realmente apontam
pra algo que existe — porque uma edição direta no arquivo passaria por cima
de toda essa validação e quebraria a convenção em silêncio.

Ver [Sistema de memória do Claude](tools/09-claude-memory-system.md) e
[Obsidian como memória](tools/08-obsidian-memory.md).

## Por que isso importa

Nenhuma dessas sete peças, olhada sozinha, é impressionante: filtrar a saída
de um comando, subir uma regra de lint aos poucos, manter um índice de
lembretes num arquivo de texto. O valor de verdade está em como elas se
encaixam num loop só: planejar antes de construir, delegar em vez de
implementar sozinho, gastar token só no que importa, manter a engenharia
enxuta por padrão, apertar gates de qualidade aos poucos em vez de os impor
de surpresa, e nunca reaprender a mesma lição duas vezes. Tire uma peça
qualquer e sobra uma conveniência a mais. Rode as sete juntas, e o resultado
é um jeito diferente de trabalhar — não uma coleção de plugins instalados
por acaso.

Se você só for entender uma peça a fundo primeiro, entenda o
[Superpowers](tools/01-superpowers.md): é o pilar mais central — e mais
poderoso — de todos os sete, porque é ele que dá forma concreta e executável
ao pilar 2 (brainstorm → plano → implementação → revisão). Sem ele, os
outros seis pilares ainda funcionam isoladamente, mas o agente perde
justamente a disciplina que decide *quando* cada um dos outros seis deveria
entrar em cena.

Pronto pra colocar tudo isso em prática, na ordem certa e com exemplo real
em cada etapa? O [Guia de instalação](01-installation.md) é a referência
rápida de comandos; o [Playbook de onboarding](02-playbook-onboarding.md) é
o caminho recomendado — o passo a passo completo, narrado do zero até o
fluxo inteiro rodando de verdade no seu projeto.

## Leitura complementar oficial

Este repositório é uma curadoria pessoal — o *taste* (o critério, o gosto
autoral) de uma pessoa só, não uma lista exaustiva de tudo que existe sobre
o assunto. Pra quem quer ir direto à fonte oficial, ou quer um catálogo bem
mais completo do que um recorte com opinião, seguem os links.

**Material oficial da Anthropic, pra quem quer ir na fonte:**

- [Claude Code: Best Practices](https://code.claude.com/docs/en/best-practices)
  — a documentação oficial mais próxima do que este repositório tenta ser,
  mantida ativamente.
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
  (dez/2024) — o post clássico que nomeia os padrões de arquitetura de
  agente; o "orchestrator-workers" que a seção de orquestração deste
  repositório usa como base vem de lá.
- [Multi-Agent Systems: When to Use Them](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)
  (jan/2026) — já citado em
  [tools/02-subagent-orchestration.md](tools/02-subagent-orchestration.md),
  linkado aqui também.
- [Guia oficial de prompt engineering](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview).
- [Claude Cookbooks](https://github.com/anthropics/claude-cookbooks) (51
  mil+ estrelas) — exemplos práticos de código.

**Pra quem quer mais do que uma curadoria pessoal:**

- [`hesreallyhim/awesome-claude-code`](https://github.com/hesreallyhim/awesome-claude-code)
  (52 mil+ estrelas) — lista curada por muita gente, cobre skills,
  comandos, hooks e subagents especificamente pra Claude Code.
- [`wshobson/agents`](https://github.com/wshobson/agents) (38 mil+
  estrelas) — coleção pronta com 200+ subagentes especialistas de nicho,
  além do roster genérico que este repositório mostra em
  [tools/02-subagent-orchestration.md](tools/02-subagent-orchestration.md).

E se esse recorte específico não for pra você, existem metodologias
completas alternativas, com filosofia diferente da usada aqui — mais
estruturadas e mais pesadas de propósito. O [GitHub Spec
Kit](https://github.com/github/spec-kit) (*spec-driven development* —
desenvolvimento guiado por uma especificação formal escrita antes do
código, 128 mil+ estrelas) e o
[BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) (simula um
time ágil completo, com personas como PM e arquiteto, 51 mil+ estrelas)
competem e se sobrepõem com a proposta de
[Superpowers](tools/01-superpowers.md) + `aia-harness` já coberta aqui —
não é uma recomendação de usar as duas coisas juntas.
