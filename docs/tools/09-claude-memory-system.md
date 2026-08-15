# Sistema de memória do Claude

## O que é

Um padrão leve, baseado em arquivos, pra dar a um agente de IA memória
persistente entre sessões — sem banco de dados, sem serviço externo, só
arquivos que o agente lê no início de cada sessão e escreve de vez em
quando. Fica na ponta oposta, em peso, do *vault* (cofre — uma coleção de
notas em Markdown organizadas segundo uma convenção de pastas) descrito em
[08-obsidian-memory.md](08-obsidian-memory.md): aqui não tem servidor MCP
(*Model Context Protocol* — um jeito padronizado de expor ferramentas
externas pro agente), não tem grafo de relações entre notas, não tem
estrutura PARA (Projetos / Áreas / Recursos / Arquivo — uma convenção de
organização de notas). Só um arquivo índice pequeno e uma pasta de arquivos
por tópico.

## Por que usar

A maior parte do que um agente "poderia" lembrar não vale a pena lembrar —
dá pra derivar de novo só lendo o código. O que realmente vale é o pequeno
conjunto de coisas que foram caras de aprender da primeira vez: um erro que
precisou de várias correções até ser resolvido, uma escolha de arquitetura
que só faz sentido se você souber o que já foi tentado e descartado, uma
regra de negócio que o código não deixa explícita em lugar nenhum.

O trabalho de um sistema de memória é capturar exatamente essa fatia
estreita, barato o bastante pra ser mantido de verdade — em vez de cair em
uma de duas armadilhas opostas: não salvar nada, ou salvar tudo até o
índice ficar grande demais pra valer a pena carregar.

## Estrutura

- **`MEMORY.md`** — um arquivo índice, sempre carregado no início da
  sessão, uma linha por entrada. Mantenha curto: um teto mole (*soft cap* —
  um limite de alerta, não um erro rígido) de cerca de 130 linhas evita que
  ele infle o contexto de toda sessão só de existir.
- **Arquivos por tópico** — um arquivo pequeno por memória, com
  *frontmatter* (o bloco de metadados no topo de um arquivo Markdown, entre
  linhas `---`):

```markdown
---
name: slug-em-kebab-case
description: resumo de uma linha — usado pra decidir relevância em sessões futuras
metadata:
  type: feedback | architecture | business-rule | reference
---

O fato ou a regra em si, por que importa, e quando se aplica.
```

`name` segue o padrão *kebab-case* — um *slug* (identificador curto e
legível, geralmente derivado do título) com as palavras separadas por
hífen, tudo minúsculo. `type` é um conjunto pequeno e fixo — não invente
categorias novas:

- **`feedback`** — um erro que precisou de correção durante uma sessão.
- **`architecture`** — um padrão descoberto só depois de tentativas que
  falharam.
- **`business-rule`** — algo que afeta o código mas não é óbvio só de ler
  ele.
- **`reference`** — onde uma informação externa mora (um painel, uma wiki,
  um sistema de tickets).

## Critério de salvamento

Antes de escrever uma entrada nova, aplique um teste literal, palavra por
palavra:

> Uma sessão futura ficaria surpresa e grata de saber disso antes de
> começar?

Se a resposta for não, não salve. Esse teste exclui explicitamente:

- Qualquer coisa derivável só de ler o código ou o histórico do Git.
- Prazos, motivações, ou qualquer outro contexto temporário do momento
  atual.
- Passos de *debug* ou receitas de correção — isso já mora na mensagem do
  commit.
- Qualquer coisa já documentada em outro lugar das instruções do próprio
  projeto.

Errar pro lado de não salvar. Uma memória que ninguém precisava é ruído;
uma lição reaprendida na marra é cara — mas um índice pequeno e de alto
sinal vence um índice grande e ignorado, sempre.

## Política de crescimento

Quando o índice passa do teto, entradas de baixo valor não são simplesmente
apagadas — elas **migram** pra um armazenamento de longo prazo (um vault,
uma wiki, uma pasta de documentação — o que seu projeto já usa pra notas
longas), numa sequência fixa, nessa ordem, sem pular nenhum passo:

1. **Checar duplicidade** — buscar no armazenamento de longo prazo por algo
   sobre o mesmo assunto; estender uma nota existente em vez de criar
   duplicata.
2. **Adequar ao formato exigido pelo destino** — um armazenamento de longo
   prazo costuma ter *template* (modelo) ou frontmatter obrigatório
   próprios; busque esse formato e siga ele à risca.
3. **Criar** a entrada no armazenamento de longo prazo.
4. **Confirmar** — ler a entrada recém-criada de volta. Sem leitura
   confirmada, a migração não aconteceu.
5. **Só então**, apagar o arquivo de curto prazo e a linha dele no
   `MEMORY.md`.

Nunca pule direto pro passo 5. Uma migração não confirmada é perda de dado,
não uma mudança de lugar — a entrada ficou sem existir em lugar nenhum pelo
tempo que levar até alguém notar o erro. Na dúvida sobre se uma entrada
ainda merece o lugar dela no índice rápido, deixe ela lá: migrar depois não
custa nada, mas uma lição perdida dos dois lados ao mesmo tempo é cara de
reaprender.

## A ideia generalizável

Não importa se o armazenamento de longo prazo acaba sendo o Obsidian (veja
[08-obsidian-memory.md](08-obsidian-memory.md)), uma wiki, ou uma pasta de
documentação simples. O que generaliza é o design em duas camadas: um
índice barato e sempre carregado pra qualquer coisa que vale a pena aparecer
automaticamente agora, e um caminho deliberado e confirmado de promoção pra
um armazenamento de longo prazo sem limite de tamanho, quando algo ganha um
lugar permanente. A camada rápida fica pequena de propósito; a camada de
longo prazo não tem limite de tamanho, porque ela nunca é carregada
automaticamente.

## Tutorial — montando do zero

1. **Crie a pasta e o arquivo índice.** Escolha uma pasta pro sistema de
   memória (por exemplo `.claude/memory/`, ou o equivalente na sua
   ferramenta) e crie `MEMORY.md` dentro dela, vazio, só com um título
   explicando o propósito.
2. **Escreva a regra de uso num arquivo próprio** (por exemplo
   `INSTRUCTIONS.md`, na mesma pasta) — o critério de salvamento, o formato
   de frontmatter, a política de crescimento — e carregue esse arquivo
   automaticamente no início de cada sessão (um `@import` dentro do
   `CLAUDE.md`, ou o mecanismo equivalente da sua ferramenta). Sem isso, o
   sistema de memória depende de alguém lembrar de abrir o arquivo na mão —
   e memória que depende de lembrete manual não é memória automática.
3. **Aplique o critério de salvamento a um caso real.** Suponha que, numa
   sessão, o agente gastou um bom tempo tentando descobrir por que o
   upload de uma imagem falhava silenciosamente, até achar que a causa era
   um limite de tamanho não documentado num proxy no meio do caminho. Passe
   isso pelo teste literal: uma sessão futura ficaria surpresa e grata de
   saber disso antes de começar? Sim — não está escrito em nenhum
   comentário nem é óbvio só de ler o código. Vale uma entrada.
4. **Escreva o arquivo de tópico.** Crie
   `.claude/memory/limite-upload-imagem.md` com o frontmatter completo
   (`name`, `description`, `type: architecture`, nesse caso) e o corpo
   explicando o fato, por que importa, e quando se aplica.
5. **Adicione uma linha no índice.** Em `MEMORY.md`:
   `- [Limite de upload de imagem](limite-upload-imagem.md) — o proxy corta uploads acima de X silenciosamente, sem devolver erro`.
6. **Antes da próxima entrada, confira o tamanho do índice.** Conte as
   linhas não vazias de `MEMORY.md`. Abaixo do teto (cerca de 130 linhas),
   só adicione. Acima, rode a política de crescimento primeiro: migre as
   entradas de menor valor pro armazenamento de longo prazo, seguindo a
   sequência de cinco passos, antes de escrever a entrada nova.

Pra não montar isso na mão toda vez, existe um *prompt* pronto — veja
[Memory bootstrap](../prompts/06-memory-bootstrap.md) — que aplica esses
mesmos passos num projeto novo, ou num projeto já existente que ainda não
tem memória nenhuma.

## Exemplos — entradas boas vs. entradas ruins

### Ruim — deriva do próprio código

```markdown
---
name: projeto-usa-nextjs
description: o projeto usa Next.js e React
metadata:
  type: reference
---

Este projeto foi construído com Next.js e React.
```

Não passa no teste: basta abrir o `package.json` pra descobrir isso em
cinco segundos. Não foi caro de aprender, e uma sessão futura não fica
surpresa nem grata — ela só perde tempo lendo uma entrada que não ensina
nada de novo.

### Boa — regra de negócio implícita no código

```markdown
---
name: cupom-nao-acumula-com-primeira-compra
description: cupons de desconto não podem ser combinados com o desconto promocional de primeira compra
metadata:
  type: business-rule
---

O calculador de preço aplica só um desconto por pedido: se o cupom E o
desconto de "primeira compra" forem elegíveis ao mesmo tempo, vence o de
maior valor — os dois nunca somam. Essa regra não está em nenhum comentário
nem tipo, só num `if` no meio da função de cálculo de total. Um novo tipo
de desconto precisa checar essa exclusão explicitamente, ou o total final
fica errado silenciosamente.
```

Passa no teste: não é óbvio só de ler a assinatura das funções envolvidas,
e o custo de descobrir isso do jeito difícil (um cliente reclamando de um
total errado) é bem mais alto que o de ler uma entrada de memória.

### Ruim — prazo e contexto temporário

```markdown
---
name: rodar-testes-antes-de-sexta
description: rodar os testes antes de sexta porque a demo pro cliente é segunda
metadata:
  type: feedback
---

Rodar a suíte de testes completa antes de sexta-feira, porque a
demonstração pro cliente está marcada pra segunda de manhã.
```

Não passa: isso é um prazo específico de um momento específico, não uma
lição durável. Daqui a duas semanas essa entrada não significa nada pra
ninguém — só ocupa espaço no índice.

### Boa — erro corrigido repetidamente na sessão

```markdown
---
name: campo-de-formulario-precisa-validacao-compartilhada
description: novo campo de formulário sempre precisa de validação também no schema compartilhado
metadata:
  type: feedback
---

Ao adicionar um campo novo num formulário, o agente esqueceu de adicionar a
regra de validação correspondente em `shared/validation/*.ts` — o arquivo
usado tanto pelo client quanto pelo server — três vezes seguidas na mesma
sessão, até ser corrigido pelo usuário. Sempre checar esse arquivo ao mexer
em campo de formulário, mesmo que o pedido original só mencione a tela.
```

Passa: é um erro que já custou três correções manuais — exatamente o tipo
de atrito que uma entrada de memória existe pra evitar na próxima sessão.

### Ruim — receita de debug

```markdown
---
name: como-corrigi-o-bug-de-login
description: reiniciar o servidor de dev e limpar o cache resolve o bug de login
metadata:
  type: feedback
---

Pra corrigir o bug de login que aparecia em desenvolvimento, bastou
reiniciar o servidor de dev e apagar a pasta de cache local.
```

Não passa: é uma receita de correção de um sintoma pontual, do tipo que já
mora (ou deveria morar) na mensagem do commit que resolveu o bug. Não é uma
lição sobre o sistema — é um passo operacional isolado.

### Boa — padrão de arquitetura descoberto após tentativa falha

```markdown
---
name: validacao-de-cupom-e-sincrona-de-proposito
description: a validação de cupom no checkout é síncrona de propósito, não é uma sobra de código antigo
metadata:
  type: architecture
---

A chamada que valida um cupom durante o checkout é síncrona (bloqueia a
resposta até o serviço de validação responder), e isso foi uma escolha
deliberada, não uma versão não otimizada esquecida pra trás. Uma versão
assíncrona anterior criava uma janela onde o pedido podia ser marcado como
pago antes da validação do cupom voltar, deixando passar um cupom inválido.
Uma futura tentativa de "isso aqui podia ser não bloqueante, ia ficar mais
rápido" reabre esse bug.
```

Passa: exatamente o tipo de decisão que parece ingênua de fora ("por que
isso bloqueia a resposta?") mas só faz sentido sabendo o que já deu errado
antes — o caso clássico do tipo `architecture`.

### Ruim — já documentado em outro lugar do projeto

```markdown
---
name: como-rodar-os-testes
description: o comando pra rodar a suíte de testes é npm run test
metadata:
  type: reference
---

O comando pra rodar todos os testes do projeto é `npm run test`.
```

Não passa: isso já está (ou deveria estar) na seção de comandos do
`CLAUDE.md`/`README.md` do projeto. Duplicar aqui só cria duas fontes da
verdade que podem ficar dessincronizadas.

### Boa — onde uma informação externa mora

```markdown
---
name: postmortems-ficam-no-notion
description: relatórios de incidente de produção ficam numa base do Notion, não neste repositório
metadata:
  type: reference
---

Os relatórios de postmortem (análise pós-incidente) de problemas em
produção são escritos numa base do Notion do time, não em nenhum lugar
deste repositório. Antes de assumir que um incidente de produção nunca foi
investigado, buscar lá.
```

Passa: informação que não existe em lugar nenhum do código, e que uma
sessão nova não teria como adivinhar sozinha.

## Dicas e pegadinhas

- **O teto de ~130 linhas é um gatilho de manutenção, não um erro rígido.**
  Não espere passar de 300 linhas pra começar a migrar — quanto mais tarde
  a sanitização (limpeza) acontece, maior o lote de entradas pra decidir de
  uma vez.
- **`type` tem só 4 valores — resista à tentação de inventar um novo.** Se
  uma entrada não se encaixa em nenhum dos quatro, isso é sinal de que
  talvez ela nem devesse virar memória.
- **Uma entrada que só repete a mensagem de um commit é um cheiro ruim**
  (*code smell* — um sinal de que algo não está bem estruturado). A
  mensagem de commit já existe pra isso; o índice não precisa duplicar
  histórico.
- **Nunca apague antes de confirmar a leitura de volta no passo de
  migração.** Se a sessão for interrompida entre criar a nota nova e
  apagar a antiga, a única forma de isso ser recuperável é nunca ter
  apagado primeiro.
- **Escreva pensando numa sessão futura, não em você agora.** Um fato que
  você obviamente vai lembrar daqui a cinco minutos não precisa de entrada
  permanente; um fato que um agente novo, sem histórico nenhum, não teria
  como adivinhar, precisa.
- **A linha de `description` é a única parte lida automaticamente todo
  santo dia.** Se ela for vaga (`"nota sobre o backend"`), o índice inteiro
  perde a função — capriche nela mais do que no corpo do arquivo de tópico.

## Perguntas frequentes

**Isso substitui um banco de dados ou um sistema de busca vetorial
(embeddings)?**
Não — de propósito. É markdown puro, sem infraestrutura pra manter, sem
serviço rodando, sem custo além de espaço em disco. Essa simplicidade é o
motivo de funcionar mesmo em projeto pequeno.

**E se eu não tiver um vault tipo Obsidian pra migrar as entradas antigas?**
O armazenamento de longo prazo pode ser literalmente qualquer coisa que dê
pra buscar, criar e ler de volta — uma wiki, uma pasta de documentação
comum, até um segundo arquivo markdown maior. O que importa é seguir a
sequência de migração (checar duplicidade → adequar ao formato → criar →
confirmar → só então apagar), não a ferramenta escolhida.

**Quem decide o que vira uma entrada de memória?**
O próprio agente, aplicando o teste literal — idealmente sem precisar ser
cobrado por isso. Mas nada impede um humano de simplesmente pedir "salva
isso" no meio de uma sessão.

**Preciso ler o `MEMORY.md` inteiro toda sessão?**
Sim, e é assim que o design foi pensado: o índice existe justamente pra ser
pequeno o bastante pra ler por completo, todo santo dia, sem pesar no
contexto. É essa restrição de tamanho que sustenta o teto de ~130 linhas.

**Uma entrada pode ter mais de um `type` ao mesmo tempo?**
Não — escolha o que encaixa melhor. Se um fato genuinamente cobre dois
tipos ao mesmo tempo (por exemplo, é ao mesmo tempo uma regra de negócio e
uma referência externa), isso costuma ser sinal de que são duas entradas,
não uma.
