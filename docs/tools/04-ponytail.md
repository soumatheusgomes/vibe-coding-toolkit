# Ponytail

## O que é

Ponytail é um plugin — um pacote que estende o comportamento do agente
dentro do Claude Code, instalado com um comando de barra ("/") direto na
conversa — que veste o agente com uma persona de disciplina de engenharia: o
"desenvolvedor sênior preguiçoso". Preguiçoso aqui quer dizer eficiente,
nunca descuidado: é a preguiça de quem já viu código complicado demais
falhar de madrugada e aprendeu a nunca mais escrever complexidade que
ninguém pediu.

Na prática, o plugin injeta uma escada de decisão fixa que roda antes de
qualquer linha de código ser escrita. O agente sobe a escada degrau por
degrau e para no primeiro que resolve o problema — nunca continua subindo
"só por garantia". Fonte: [`DietrichGebert/ponytail`](https://github.com/DietrichGebert/ponytail).

## Por que usar

Um agente de IA recebendo uma tarefa aberta tende a puxar para abstração,
configurabilidade e código defensivo que ninguém pediu — sem um freio
explícito, ele otimiza para "parecer completo", não para "resolver
exatamente o que foi pedido". O resultado comum: uma classe de cache com
estratégia plugável quando um decorator de uma linha resolveria; uma
interface com uma única implementação; um arquivo de configuração para um
valor que nunca muda.

Ponytail existe para forçar a opção mais barata a ser considerada primeiro,
sempre, antes de qualquer código sair. Ele não deixa a "preguiça" virar
desculpa para cortar canto em segurança, validação ou tratamento de erro —
só no que sobra depois de garantir que essas partes estão cobertas.

## Como instalar/ativar

Dentro de uma sessão do Claude Code:

```bash
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

O primeiro comando registra o repositório do GitHub como uma fonte de
plugins instalável (um "marketplace"); o segundo instala o plugin `ponytail`
a partir dessa fonte.

Uma vez instalado, Ponytail fica ativo em toda resposta por padrão, no nível
`full`. Ele continua ativo mesmo quando não está claro se a tarefa atual se
aplica — a regra por trás disso é "presumir que sim". Para desligar durante
a conversa, basta escrever "stop ponytail" ou "normal mode" — não precisa
desinstalar o plugin. O nível escolhido vale só para a sessão atual; uma
sessão nova volta para o padrão.

## Tutorial passo a passo

### 1. Entenda o problema antes de subir a escada

A escada encurta a *solução*, nunca a *leitura*. Antes de escolher um
degrau, o agente precisa rastrear o fluxo real e ler por completo o código
que a mudança vai afetar. Um diff (o conjunto de linhas alteradas por uma
mudança) pequeno no lugar errado não é preguiça — é um segundo bug. Essa
etapa acontece sempre, mesmo em pedidos que parecem triviais.

### 2. Suba a escada, degrau por degrau, e pare no primeiro que resolve

| # | Pergunta | Se a resposta for sim |
|---|---|---|
| 1 | Isso precisa existir? | Trabalho especulativo — pule e diga isso em uma linha (YAGNI: sigla em inglês para "you aren't gonna need it", ou seja, não construa hoje o que ninguém pediu ainda) |
| 2 | Já existe algo equivalente nesse código? | Reaproveite — reimplementar o que já está a alguns arquivos de distância é a forma mais comum de complexidade desnecessária |
| 3 | A biblioteca padrão da linguagem ou do framework já faz isso? | Use a biblioteca padrão |
| 4 | Um recurso nativo da plataforma cobre isso? | Prefira o nativo — `<input type="date">` em vez de uma lib de calendário, CSS em vez de JS, uma restrição do banco em vez de código na aplicação |
| 5 | Uma dependência já instalada resolve isso? | Use-a — nunca adicione uma dependência nova para o que algumas linhas resolvem |
| 6 | Dá para ser uma linha só? | Escreva a linha |
| 7 | (só se nenhum dos anteriores resolveu) | O mínimo de código novo que funciona de verdade |

Dois degraus resolvem igualmente bem? Fica com o mais alto — o mais simples
— e segue em frente. A primeira solução preguiçosa que funciona é a certa,
uma vez que o problema já foi entendido de verdade.

### 3. Corrija bugs na causa raiz, não no sintoma

Um relatório de bug descreve um sintoma. Antes de editar, o agente busca
(`grep`) todo lugar que chama a função que está prestes a mexer. A versão
preguiçosa É a correção na causa raiz: uma proteção dentro da função
compartilhada é um diff menor do que a mesma proteção repetida em cada lugar
que a chama — e corrigir só o caminho que o relato original descreve deixa
toda função irmã ainda quebrada. Corrige uma vez, no lugar por onde todo
mundo passa.

### 4. Marque simplificações deliberadas com um comentário `ponytail:`

Quando um corte de canto é intencional e tem um teto conhecido (um lock —
trava de concorrência — global em vez de um por registro, uma varredura que
cresce mal com o tamanho da entrada, uma heurística simples), ele fica
marcado com um comentário nomeando o teto e o caminho de upgrade:

```js
// ponytail: lock global; trocar por lock por conta se a taxa de
// processamento virar gargalo
```

Isso é diferente de deixar uma limitação escondida — o comentário existe
para a próxima pessoa (ou o próprio agente, numa sessão futura) saber que
aquilo foi uma escolha, não um esquecimento.

### 5. Feche com uma verificação mínima, quando a lógica não é trivial

Código com ramificação, laço, parser, ou qualquer caminho envolvendo
dinheiro ou segurança não sai sem uma checagem que falha se a lógica
quebrar: o menor teste possível — um `assert` (uma linha que verifica uma
condição e interrompe a execução se ela for falsa) dentro de um bloco
`demo()`/`__main__`, ou um arquivo `test_*` pequeno — sem framework de
teste, sem fixture, sem suíte por função a menos que peçam. Uma linha
trivial não precisa de teste: YAGNI vale para teste também.

### 6. Responda direto: código primeiro, explicação em no máximo três linhas

Depois do código, no máximo três linhas curtas: o que foi deixado de fora, e
quando adicionar. Sem redação longa, sem passeio por funcionalidades, sem
notas de design — se a explicação for maior que o código, o instinto certo é
apagar a explicação, porque todo parágrafo defendendo uma simplificação é
complexidade voltando disfarçada de texto. Isso não vale para uma explicação
que o usuário pediu explicitamente (um relatório, um passo a passo, notas
por fase) — essa é dada por completo; a regra é só contra prosa não
solicitada.

Padrão: `[código] → skipped: [o que ficou de fora], add when: [quando adicionar]`.

## Exemplos concretos

### Exemplo 1 — evitando abstração reflexa

**Pedido do usuário:** "Adiciona um cache para as respostas dessa API."

**Sem Ponytail** — resposta plausível de um agente sem esse freio:

```python
class ApiCache:
    def __init__(self, backend="memory", ttl=300, max_size=1000):
        self.backend = self._resolve_backend(backend)
        self.ttl = ttl
        self.max_size = max_size

    def _resolve_backend(self, name):
        if name == "redis":
            return RedisCacheBackend()
        return MemoryCacheBackend()

    def get_or_fetch(self, key, fetch_fn):
        ...  # mais 40 linhas de política de expiração e descarte de itens
```

Uma classe nova, uma interface de backend plugável que ninguém pediu,
suporte a Redis que nem está instalado no projeto — tudo para resolver um
cache simples.

**Com Ponytail ativo:**

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def fetch_response(request_key):
    ...
```

O `@` antes de `lru_cache` é um decorator do Python: uma forma de envolver
uma função existente com comportamento extra sem reescrevê-la. `lru_cache` já
é um cache pronto, guardado em memória, na biblioteca padrão da linguagem.

`→ skipped: classe de cache customizada. add when: lru_cache ficar mensuravelmente insuficiente.`

O degrau 3 da escada (a biblioteca padrão já faz isso) resolveu — nunca
chegou no degrau 7.

### Exemplo 2 — corrigindo a causa raiz, não o sintoma

**Pedido do usuário:** "Corrige esse bug: `formatCurrency()` quebra quando o
valor vem `undefined`."

**Sem Ponytail** — conserta só onde o bug foi visto:

```js
// no único lugar que reportou o erro
const label = value !== undefined ? formatCurrency(value) : "—";
```

Funciona ali. Mas `formatCurrency()` tem outras três chamadas no projeto —
todas continuam quebradas para o mesmo caso.

**Com Ponytail ativo** — primeiro passo é buscar todo lugar que chama
`formatCurrency`, depois a correção entra na função compartilhada:

```js
function formatCurrency(value) {
  if (value === undefined) return "—";
  return `R$ ${value.toFixed(2)}`;
}
```

`→ skipped: guarda repetida nos 4 pontos de chamada — resolvido de uma vez na função. add when: nunca, esse é o lugar certo para essa checagem.`

Diff menor, e sem sintoma remanescente nas outras três chamadas.

### Exemplo 3 — quando a preguiça não se aplica

**Pedido do usuário:** "Adiciona validação de CPF nesse formulário de
cadastro."

Validação de entrada numa fronteira de confiança — o ponto onde um dado
chega de fora do controle direto do sistema, nesse caso o que o usuário
digita — é um dos não-negociáveis. Mesmo com Ponytail em `full`, o agente
não entrega uma checagem superficial para "economizar linhas": ele escreve a
validação real, dígito verificador incluso, porque isso foi pedido
explicitamente e é justamente o tipo de corte que a escada nunca autoriza.

`→ skipped: nada. Validação em fronteira de confiança está na lista do que a preguiça nunca simplifica.`

## Dicas e pegadinhas

- **A escada só roda depois da leitura, nunca no lugar dela.** Se uma
  resposta "resolveu rápido demais" sem citar o fluxo real que foi lido,
  vale desconfiar — pular a compreensão para entregar um diff pequeno é o
  tipo perigoso de preguiça, porque se disfarça de eficiência e entrega uma
  correção confiante e errada.
- **Ponytail não é sinônimo de resposta curta.** A brevidade dele é sobre
  não escrever prosa não solicitada defendendo a simplificação — diferente
  de [Caveman](05-caveman.md), que comprime a prosa palavra por palavra. As
  duas camadas são independentes e se somam: uma decide o que é construído,
  a outra decide como o agente fala sobre isso.
- **Duas opções da biblioteca padrão do mesmo tamanho:** o critério de
  desempate é correção nos casos de borda, não qual é mais curta de
  escrever. Preguiça é escrever menos código, não escolher o algoritmo mais
  frágil.
- **Pedido complexo ou ambíguo não trava a resposta.** Ponytail entrega a
  versão preguiçosa e questiona na mesma resposta — "fiz X; Y cobre o caso;
  precisa do X completo? diga" — em vez de parar esperando uma confirmação
  que já dava para assumir.
- **O nível vale só para a sessão atual.** Trocar com `/ponytail
  lite|full|ultra` não persiste entre sessões; cada sessão nova recomeça no
  padrão (`full`).

## Perguntas frequentes

**Ponytail vai simplificar validação, tratamento de erro ou segurança para
economizar linhas?**
Não. Esses itens — mais acessibilidade básica e qualquer coisa pedida
explicitamente — ficam fora do alcance da preguiça, em qualquer nível de
intensidade.

**Preciso reinstalar o plugin toda vez que quiser mudar o nível?**
Não. `/ponytail lite|full|ultra` troca o nível a qualquer momento, dentro da
conversa atual.

**Ponytail escreve testes automaticamente?**
Só quando a lógica não é trivial — ramificação, laço, parser, caminho de
dinheiro ou segurança — e mesmo assim deixa só uma verificação mínima, não
uma suíte completa. Uma linha trivial não gera teste.

**Ponytail e Caveman são a mesma coisa?**
Não. Ponytail decide o que é construído; [Caveman](05-caveman.md) decide
como o agente fala sobre o que construiu. São plugins independentes, mas
combináveis.

**A escada muda de uma linguagem para outra?**
O raciocínio não muda — biblioteca padrão, recurso nativo, dependência já
instalada, uma linha, e só então código novo —, mas o que cada degrau
resolve, sim: numa stack de frontend, o degrau 4 pode ser um elemento HTML
nativo; num backend, pode ser uma constraint do banco de dados.
