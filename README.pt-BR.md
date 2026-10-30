[English](README.md) · **Português (Brasil)** · [Español](README.es.md)

> Tradução do README. A versão oficial, os guias, os prompts, os templates e as imagens são mantidos em inglês.

<a id="top"></a>
<a id="about-the-project"></a>

<p align="center">
  <picture>
    <source media="(prefers-reduced-motion: reduce)" srcset="docs/assets/readme/hero-still.svg" />
    <img src="docs/assets/readme/hero.svg" alt="Vibe Coding Toolkit — configuração da máquina e de projetos individuais, em carvão e âmbar." width="1600" />
  </picture>
</p>

# Vibe Coding Toolkit

**Configure sua máquina. Inicie ou melhore seus projetos.**

Um toolkit de **documentação, prompts e templates** com **duas funções: configurar máquinas e configurar projetos individuais**. Desenvolva com agentes de IA: preparar a máquina, iniciar uma aplicação, melhorar um projeto existente e manter contexto e qualidade durante o trabalho.

Você descreve o objetivo. O agente inspeciona o ambiente, organiza as decisões, configura as peças aplicáveis e verifica o resultado. **O código fica no seu projeto; este repositório guarda a receita.**

<p align="center">
  <a href="#start-here"><strong>INICIAR UM PROJETO →</strong></a>
  &nbsp; · &nbsp;
  <a href="docs/03-environment-setup.md">PREPARAR A MÁQUINA</a>
  &nbsp; · &nbsp;
  <a href="docs/prompts/12-existing-project-setup.md">CONFIGURAR PROJETO EXISTENTE</a>
  &nbsp; · &nbsp;
  <a href="#full-documentation">EXPLORAR O TOOLKIT</a>
</p>

<p align="center">
  <a href=".github/workflows/validate.yml"><img src="https://github.com/soumatheusgomes/vibe-coding-toolkit/actions/workflows/validate.yml/badge.svg" alt="Estado da validação do toolkit no GitHub Actions" /></a>
  &nbsp;
  <a href="LICENSE"><strong>MIT</strong></a>
  &nbsp; · &nbsp;
  <a href="#community">Star History</a>
  &nbsp; · &nbsp;
  <a href="docs/05-toolkit-validation.md">Evidências e limites</a>
</p>

<p align="center">
  <strong>Claude Code + Codex</strong> / instruções portáveis / skills locais
  <br />
  <strong>Next.js</strong> para projetos novos / sua stack preservada em projetos existentes
</p>

---

<a id="how-to-use-this-repository"></a>
<a id="how-to-use-this-repo"></a>
<a id="complete-setup-with-the-project-open-in-the-agent"></a>
<a id="choose-your-entry-point"></a>

## 00 / Escolha onde começar

| Seu momento | Caminho | O que você recebe |
|---|---|---|
| **Tenho uma ideia** | [Iniciar um projeto Next.js](docs/04-project-bootstrap.md) · [Prompt 11](docs/prompts/11-next-project-bootstrap.md) | Produto definido, base oficial, documentação, skills e checks |
| **Já tenho um projeto** | [Configurar ou atualizar a base](docs/prompts/12-existing-project-setup.md) | Diagnóstico, brainstorming, harness, ferramentas e melhorias verificadas |
| **Preciso preparar a máquina** | [Setup do ambiente](docs/03-environment-setup.md) · [Prompt 10](docs/prompts/10-development-environment-setup.md) | Runtime, agentes, integrações globais, backups e manifesto |
| **Quero resolver uma necessidade** | [Instalação modular](docs/01-installation.md) · [Prompts](docs/prompts/README.md) | Lint, refatoração, revisão, contexto ou uma ferramenta específica |

**Durante a leitura:** [Preparação](#foundation) · [Agentes](#agents) · [Conhecimento](#knowledge) · [Qualidade](#quality) · [Prompts](#ready-to-use-prompts) · [Documentação](#full-documentation) · [Comunidade](#community).

O agente precisa conseguir ler arquivos, editar e executar comandos. Os guias tratam **Claude Code e Codex separadamente**; outros clientes podem seguir os acordos com capacidades equivalentes. Conversa sem acesso ao ambiente explica o processo, mas não comprova instalações ou testes.

<a id="foundation"></a>

## 01 / Prepare uma base que combina com o projeto

<p align="center">
  <picture>
    <source media="(prefers-reduced-motion: reduce)" srcset="docs/assets/readme/foundation-still.svg" />
    <img src="docs/assets/readme/foundation.svg" alt="Fluxo de preparação: entender a intenção, configurar a base, integrar as ferramentas e comprovar o resultado." width="1600" loading="lazy" />
  </picture>
</p>

O setup começa pelo que existe: produto, arquivos, runtime, gerenciador, instruções e ferramentas disponíveis. Projetos novos recebem uma base coerente; projetos existentes recebem uma adoção compatível com seus contratos.

<a id="start-here"></a>

### Comece um projeto com duas linhas

Abra o agente no diretório de destino e cole. Troque a segunda linha pela descrição do seu produto:

```text
Leia https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/docs/prompts/11-next-project-bootstrap.md e execute o setup neste diretório.
Projeto: [nome, problema, público, fluxos principais e restrições].
```

Exemplo: “CRM para pequenas imobiliárias. Corretores registram contatos, negócios e tarefas; gestores acompanham o funil por equipe. Interface em inglês, MVP focado em cadastro e acompanhamento de oportunidades.”

| Parte da entrega | Conteúdo |
|---|---|
| **Produto** | `PRODUCT.md`: problema, público, MVP, restrições, hipóteses e critérios de aceitação |
| **Aplicação** | Base oficial Next.js, App Router, TypeScript, Tailwind e ESLint |
| **Servidor e dados** | Drizzle/PostgreSQL para persistência nova, Zod, Pino e fronteiras de servidor |
| **Testes e qualidade** | Vitest, regras locais, scripts canônicos e validação da base |
| **Agentes** | Instruções compartilhadas, integração por cliente e skills Vercel locais |
| **Documentação** | Quatro arquivos na raiz e cinco documentos em `docs/`, com fontes e evidências |

O [bootstrap](docs/04-project-bootstrap.md) termina com a base configurada e a próxima tarefa do MVP identificada. Autenticação, serviços e funcionalidades entram conforme o produto. Uma aplicação sem persistência pode omitir banco com justificativa. Os [defaults](docs/06-project-defaults.md) são revistos com fontes atuais na execução.

### Configure ou atualize um projeto existente

Abra o agente na raiz da aplicação e cole:

```text
Leia https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/docs/prompts/12-existing-project-setup.md e execute integralmente o bloco da seção “Prompt” neste projeto, começando pelo brainstorming.
```

O prompt atende uma base sem toolkit, uma adoção parcial ou uma configuração antiga. O trabalho segue este percurso:

1. **Conhecer:** inspecionar produto, stack, instruções, dependências, integrações e checks atuais.
2. **Decidir:** fazer brainstorming e apresentar melhorias, riscos, dependências e critérios de conclusão.
3. **Configurar:** instalar, atualizar, integrar ou reaproveitar cada peça aplicável do catálogo.
4. **Melhorar:** conciliar documentação e regras; organizar código com mudanças incrementais verificáveis.
5. **Comprovar:** comparar antes/depois, testar integrações disponíveis e registrar limites e pendências.

**Repetir o prompt é parte da manutenção.** Ele confere a revisão do toolkit e a documentação atual, preserva personalizações e evita duplicar instruções, skills, hooks ou servidores MCP. Stack, banco e contratos existentes são preservados; migrações incompatíveis recebem uma decisão própria.

### Prepare a máquina

```text
Leia https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/docs/prompts/10-development-environment-setup.md e execute integralmente o bloco da seção “Prompt” neste computador.
```

O [setup global](docs/03-environment-setup.md) cuida de ferramentas de sistema, Node.js, Docker, agentes, plugins e integrações. Registra versões, escopos, backups, validações e intervenções necessárias. O setup de projeto reutiliza esse ambiente.

> Cole os textos na conversa de um agente com terminal. Os atalhos remotos usam a versão publicada em `main`; em uma cópia ainda não publicada, use o arquivo local. Nenhum setup publica automaticamente sua aplicação.

<a id="agents"></a>
<a id="complete-workflow"></a>
<a id="workflow"></a>
<a id="superpowers-first"></a>

## 02 / Dê direção ao trabalho dos agentes

<p align="center">
  <picture>
    <source media="(prefers-reduced-motion: reduce)" srcset="docs/assets/readme/orchestration-still.svg" />
    <img src="docs/assets/readme/orchestration.svg" alt="Um coordenador distribui tarefas entre capacidades leve, focada e crítica, conforme complexidade e risco, e verifica a integração." width="1600" loading="lazy" />
  </picture>
</p>

**Entender → desenhar → planejar quando necessário → implementar → verificar → revisar.** Cada etapa existe para tornar o resultado mais previsível. O processo acompanha o tamanho do pedido e a autorização vigente.

| Função | Ferramentas e acordos | Quando entram |
|---|---|---|
| **Entender e decidir** | [Superpowers](docs/tools/01-superpowers.md) | Brainstorming, desenho proporcional, planejamento, diagnóstico e verificação |
| **Construir com escopo** | [Ponytail full](docs/tools/04-ponytail.md) | Reutilizar o que existe e entregar a menor mudança completa |
| **Conversar com clareza** | [Caveman](docs/tools/05-caveman.md) | Respostas concisas; código, documentação e commits com redação normal |
| **Delegar com responsabilidade** | [Subagentes e ondas](docs/tools/02-subagent-orchestration.md) | Contexto isolável, especialização útil e tarefas independentes |
| **Reduzir saída repetitiva** | [RTK](docs/tools/03-rtk-token-proxy.md) | Comandos suportados, preservando acesso à saída original |
| **Configurar cada cliente** | [Codex](docs/tools/15-codex-workflow.md) · [Playbook Claude](docs/02-playbook-onboarding.md) | Instruções, descoberta de skills, MCPs e hooks no formato correto |

### Capacidade escolhida por tarefa

Com seleção de modelos autorizada, a LLM escolhe entre os modelos e esforços realmente disponíveis. Busca, inventário e mudanças mecânicas favorecem capacidade leve; decisões ambíguas, segurança, dados e revisão crítica recebem capacidade suficiente para o risco.

O [prompt de projeto existente](docs/prompts/12-existing-project-setup.md) autoriza essa seleção dentro do cliente e autenticação vigentes, respeitando restrições explícitas. Sem essa política, preserve o modelo da sessão. Disponibilidade de ferramenta não autoriza trocar provedor, ativar proxy ou criar cobrança por API.

### Paralelo quando o trabalho permite

- Cada tarefa tem objetivo, contexto mínimo, arquivos permitidos, dependências, aceite e checks.
- Um escritor por arquivo; lockfiles e configurações compartilhadas têm responsável único.
- Revisores paralelos trabalham em leitura. O coordenador confere o diff e a integração.
- Falhas pedem diagnóstico e possível escalonamento, com limites de tempo e tentativas.
- A retomada verifica arquivos, checkout e processos reais. Um resumo anterior não prova o estado atual.

Mudanças pequenas podem ficar no agente principal. O [protocolo de orquestração](docs/tools/02-subagent-orchestration.md) detalha critérios, recuperação e concorrência.

<a id="knowledge"></a>

## 03 / Faça o conhecimento sobreviver à sessão

<p align="center">
  <picture>
    <source media="(prefers-reduced-motion: reduce)" srcset="docs/assets/readme/context-still.svg" />
    <img src="docs/assets/readme/context.svg" alt="Um índice curto de instruções conecta produto, documentação, código, fontes e evidências, carregando detalhes conforme a tarefa." width="1600" loading="lazy" />
  </picture>
</p>

**Harness engineering** organiza o ambiente no qual o agente trabalha: instruções localizáveis, contexto confiável, ferramentas acessíveis, comandos reproduzíveis e feedback verificável. O projeto guarda o que o próximo agente precisa para continuar.

| Necessidade | Peça do toolkit | Resultado esperado |
|---|---|---|
| **Saber por onde começar** | [AGENTS compartilhado](templates/AGENTS.md.template) e [ponte Claude](templates/CLAUDE.md.template) | Comandos e restrições curtos, apontando para os detalhes |
| **Consultar APIs atuais** | [Context7](docs/tools/12-context7.md) | Documentação da biblioteca e versão relevantes, sem enviar segredos |
| **Entender relações no código** | [Graphify](docs/tools/07-graphify.md) | Grafo consultável com cobertura, atualidade e limites registrados |
| **Guardar decisões úteis** | [Memória do cliente](docs/tools/09-claude-memory-system.md) · [Obsidian opcional](docs/tools/08-obsidian-memory.md) | Índice enxuto e conhecimento detalhado sob demanda |
| **Usar especialização existente** | [Skills Vercel](docs/tools/16-vercel-skills.md) · [Skills de artefatos](docs/tools/13-anthropics-skills.md) | Instruções pertinentes à tarefa e ao cliente, descobertas e verificadas |

### Cada documento tem uma função

O [manifesto de documentos](templates/project-docs/manifest.json) liga os templates aos nove destinos do bootstrap:

```text
seu-projeto/
├── README.md                 Como entrar e executar
├── PRODUCT.md                Problema, escopo e aceite
├── AGENTS.md                 Comandos e acordos compartilhados
├── CLAUDE.md                 Ponte para as instruções compartilhadas
└── docs/
    ├── architecture.md       Estrutura, fronteiras e decisões
    ├── design.md             Direção visual e acessibilidade
    ├── onboarding.md         Preparação local e primeiro fluxo
    ├── quality.md            Checks, revisão e limites
    └── setup.md              Fontes, versões, evidências e pendências
```

Em projeto existente, preserve documentos equivalentes já canônicos e registre o mapeamento. Mudar comportamento, comando, schema ou configuração também atualiza o documento responsável. Detalhes ficam na fonte correta, sem transformar `AGENTS.md` em uma enciclopédia.

### Skills disponíveis, ações sob demanda

Para Next/React, o [catálogo Vercel](docs/tools/16-vercel-skills.md) cobre boas práticas, composição, UI, escrita, transições, otimização e operações Vercel, além de `find-skills`. React Native/Expo entra conforme a plataforma. Os nomes vêm do `SKILL.md` e são conferidos no upstream durante o setup.

Instalar uma skill de deploy não publica. Instalar uma skill de transições não exige animações. Skills, MCPs e memória externa entram no fluxo quando existe tarefa pertinente e autorização.

<a id="quality"></a>

## 04 / Troque “parece pronto” por evidência

<p align="center">
  <picture>
    <source media="(prefers-reduced-motion: reduce)" srcset="docs/assets/readme/quality-still.svg" />
    <img src="docs/assets/readme/quality.svg" alt="Lint, tipos, testes e build formam uma esteira de verificação com revisão, correção e nova evidência. A imagem ilustra etapas, não resultados medidos." width="1600" loading="lazy" />
  </picture>
</p>

O toolkit separa **arquivo presente**, **configuração concluída** e **integração testada**. Cada check prova uma parte do resultado; pendências e falhas preexistentes continuam visíveis.

| Frente | Como verificar | Referência |
|---|---|---|
| **Estrutura e fronteiras** | Presets do framework, regras locais, teto de 350 linhas e imports ajustados à base | [ESLint e quality gates](docs/tools/06-eslint-biome-quality-gates.md) |
| **Comportamento** | Tipos, testes relevantes, regressões, tratamento de erros e build | [Padrões do projeto](docs/06-project-defaults.md) |
| **Interface em uso** | Navegação local, teclado, foco, estados, console, rede e desempenho quando pertinente | [agent-browser](docs/tools/11-agent-browser.md) · [Chrome DevTools MCP](docs/tools/14-chrome-devtools-mcp.md) |
| **Integrações do agente** | Descoberta real de skills, consulta ao Context7, RTK sem duplicação e grafo pertinente | [Setup de projeto existente](docs/prompts/12-existing-project-setup.md) |
| **Comportamento do harness** | Tarefas descartáveis para autorização, handoff desatualizado, revisão sem alterações e recuperação observável | [Avaliação do harness](docs/07-harness-evaluation.md) |
| **O próprio toolkit** | Links, âncoras, manifesto, JSON e base Next em projeto temporário | [Validação reproduzível](docs/05-toolkit-validation.md) |

Regras novas em código legado recebem medição e adoção progressiva. Proteções existentes não são enfraquecidas para obter um relatório verde. O perfil de lint acompanha a stack; instalar regras não justifica trocar ORM ou introduzir dependências sem uso.

### Revisão depois de implementar ou corrigir

As instruções compartilhadas definem a revisão por **risco e evidência**. Mudanças relevantes recebem revisão independente quando disponível, cobrindo o diff exato, chamadores, contratos e testes relacionados.

A revisão termina com achados relevantes resolvidos ou com destino explícito, checks afetados passando, cobertura e riscos residuais registrados. Rodadas adicionais precisam de nova evidência, risco pendente ou pedido explícito. Quantidades solicitadas são respeitadas sem reiniciar após correções internas. O [prompt de segurança](docs/prompts/13-security-review.md) cobre repositório e diff, sem alterações por padrão e com relatório privado.

### Evidências e limites

A base possui [validação documentada em macOS, Linux e Windows](docs/05-toolkit-validation.md), com checks automatizados também em [Ubuntu e Windows](.github/workflows/validate.yml). O relatório distingue testes de fronteiras, SQL, build, HTTP e integrações reais, além de registrar advisories e limites conhecidos. Instalação em outro ambiente precisa de verificação própria.

Checks são explícitos. O toolkit não instala bloqueios de push em `main`, não exige branch/worktree e não acrescenta hooks de commit/push. [Hooks do cliente](docs/tools/10-hooks-best-practices.md) usam integrações suportadas e verificadas, sem duplicação.

<a id="ready-to-use-prompts"></a>
<a id="prompts"></a>

## 05 / Uma biblioteca de prompts por objetivo

Escolha a tarefa, abra o prompt e copie o bloco indicado. O [catálogo completo](docs/prompts/README.md) reúne instruções de uso e adaptação.

| Objetivo | Prompts | Quando usar |
|---|---|---|
| **Preparar tudo** | [10 · Máquina](docs/prompts/10-development-environment-setup.md) · [11 · Projeto novo](docs/prompts/11-next-project-bootstrap.md) · [12 · Projeto existente](docs/prompts/12-existing-project-setup.md) | Instalação inicial, adoção completa ou atualização |
| **Entender e planejar** | [04 · Brainstorm até plano](docs/prompts/04-brainstorm-to-plan.md) | Transformar pedido ambíguo em trabalho com aceite |
| **Organizar a base** | [01 · Sanitização](docs/prompts/01-project-sanitation.md) · [09 · Arquivos grandes](docs/prompts/09-file-size-refactor.md) | Medir problemas e refatorar por responsabilidade |
| **Evoluir o lint** | [07 · ESLint completo](docs/prompts/07-eslint-complete-setup.md) · [08 · Quality gates](docs/prompts/08-eslint-quality-gates-install.md) · [02 · Warnings](docs/prompts/02-eslint-warning-burndown.md) | Instalar regras, medir legado e reduzir violações |
| **Revisar segurança** | [13 · Revisão de segurança](docs/prompts/13-security-review.md) | Repositório ou diff exato, evidências e relatório privado |
| **Avaliar o harness** | [14 · Avaliação do harness](docs/prompts/14-harness-evaluation.md) | Verificar comportamento após setup ou mudanças de instruções/ferramentas |
| **Melhorar o harness** | [15 · Melhoria do harness](docs/prompts/15-harness-improvement.md) | Método nativo inspirado no Harness2 por padrão no setup novo/existente; laboratório isolado com CLI oficial opcional |
| **Revisar e coordenar** | [03 · Code review](docs/prompts/03-multi-agent-code-review.md) · [05 · Ondas paralelas](docs/prompts/05-parallel-wave-dispatch.md) | Revisão especializada e execução independente |
| **Manter contexto** | [06 · Memória](docs/prompts/06-memory-bootstrap.md) | Guardar conhecimento útil sem inflar a sessão |

### Auditoria avançada de segurança (opcional)

O [guia de uso](docs/08-security-audit.md) ensina a executar o [prompt 16](docs/prompts/16-security-audit.md) no projeto alvo, ler os quatro artefatos privados, retomar pelo checkpoint e solicitar correções por achado ou lote. Ele se adapta à stack do projeto e separa revisão de código de evidências de execução.

**Execute como tarefa separada, somente por solicitação explícita.** Preparação da máquina, onboarding, bootstrap e configuração de projetos existentes não executam essa auditoria automaticamente. O padrão é `AUDIT`; correções e testes ativos exigem autorização própria. Publique o prompt reutilizável; mantenha os relatórios privados.

<a id="eslint-in-one-line"></a>

### Adote uma peça por vez

Para instalar somente os quality gates:

```text
Leia https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/docs/prompts/08-eslint-quality-gates-install.md e execute o prompt neste projeto. Use MAX_LINES=350.
```

Depois da medição, o [prompt 09](docs/prompts/09-file-size-refactor.md) orienta refatoração de arquivos grandes. Para apenas skills Vercel, use o [catálogo e a instalação local](docs/tools/16-vercel-skills.md). A adoção modular continua disponível sem executar o setup inteiro.

## 06 / Entenda o que pertence a cada lugar

### Global e local

| Máquina e cliente | Projeto |
|---|---|
| Runtime, Git e gerenciador de pacotes | Dependências da aplicação e lockfile |
| Agente, autenticação e plugins existentes | Produto, instruções e documentação específica |
| RTK e integração funcional | Skills locais e `skills-lock.json` |
| Ponytail, Caveman e Superpowers já disponíveis | Regras de qualidade e comandos canônicos |
| CLI Graphify e conexão Context7 existente | Exclusões do grafo e configuração local quando necessária |

Claude Code e Codex têm descoberta e configurações próprias. Uma integração global funcional é reutilizada; conteúdo pessoal e credenciais não são copiados para templates. Instalação e atualização usam o menor escopo suportado, com limites de autorização explícitos.

### Stack de partida e compatibilidade

| Contexto | Como o toolkit se adapta |
|---|---|
| **Projeto web novo** | Next.js estável, App Router, TypeScript, Tailwind, ESLint, Vitest e núcleo servidor conforme o produto |
| **Projeto existente** | Preserva framework, gerenciador, banco, ORM, testes e equivalentes funcionais; mede antes de mudar |
| **Monorepo** | Identifica workspaces, fronteiras e configurações compartilhadas antes de escolher alvos |
| **Outro cliente ou stack** | Usa capacidades e formatos compatíveis; registra componentes inaplicáveis e bloqueios |
| **Sem credenciais ou serviços** | Executa checks seguros e independentes; distingue configuração de integração real |

O toolkit não é um gerador próprio nem uma aplicação pronta. O scaffold novo vem de `create-next-app`; os templates complementam a base. Versões e APIs são conferidas durante o setup. Publicação, serviços pagos e migrações incompatíveis dependem da autorização pertinente.

<a id="full-documentation"></a>
<a id="complete-documentation"></a>
<a id="index"></a>
<a id="references"></a>

## 07 / Explore a documentação

```text
vibe-coding-toolkit/
├── README.md                 Você está aqui
├── docs/                     Guias, padrões e evidências
│   ├── tools/                Ferramentas por função
│   └── prompts/              Receitas copiáveis
├── templates/                Arquivos para adaptar no destino
└── scripts/                  Validação do próprio toolkit
```

<a id="fundamentals"></a>

### Guias

| Documento | Para quê |
|---|---|
| [Visão geral](docs/00-overview.md) | Princípios e caminhos de adoção |
| [Instalação](docs/01-installation.md) | Comandos, distribuição e escopos |
| [Playbook Claude](docs/02-playbook-onboarding.md) | Fluxo narrado de trabalho dentro do projeto |
| [Setup da máquina](docs/03-environment-setup.md) | Preparação, retomada e reprodução do ambiente |
| [Bootstrap Next](docs/04-project-bootstrap.md) | Produto até base configurada |
| [Projeto existente](docs/prompts/12-existing-project-setup.md) | Adoção completa, atualização e harness |
| [Validação do toolkit](docs/05-toolkit-validation.md) | O que foi comprovado e quais limites permanecem |
| [Padrões do projeto](docs/06-project-defaults.md) | Stack, documentação e critérios de adaptação |
| [Auditoria avançada de segurança](docs/08-security-audit.md) | Auditoria opcional separada, artefatos privados e correções por etapas |

### Ferramentas

O [catálogo de ferramentas](docs/tools/README.md) mantém o índice completo, os links de instalação e a [matriz de escopo de máquina/projeto](docs/tools/README.md#select-by-scope).

| Capacidade | Quando usar |
|---|---|
| [next-dev-loop / next-bundle-optimizer](docs/tools/17-nextjs-runtime-and-performance.md) | Projeto Next.js compatível precisa de feedback de execução ou análise de bundles |
| [Orientação PostgreSQL](docs/tools/18-postgresql-skills.md) | Trabalho em SQL, schema, migrações, conexões ou segurança do banco |
| [Correção de CI no GitHub](docs/tools/19-github-ci-repair.md) | Investigar checks de PR que falham no GitHub Actions |
| [Revisão diferencial de segurança](docs/tools/20-security-review.md) | Mudança afeta dados sensíveis ou fronteiras de confiança |
| [shadcn](docs/tools/21-shadcn-ui.md) | Projeto usa ou escolhe shadcn/ui |
| [Sentry MCP](docs/tools/22-sentry-mcp.md) | Investigar erros e desempenho de um serviço escolhido, com acesso autorizado |
| [Harness2](docs/tools/23-harness2.md) | Comparar mudanças no harness com evidências, distinguindo adaptação nativa, demo oficial e resultados de benchmarks |

Avalie todas as opções no setup; ative as que atendem ao projeto. Cada guia cobre requisitos, instalação, uso, verificação e manutenção.

### Templates

O [catálogo de templates](templates/README.md) reúne documentação, núcleo Next, perfis ESLint, configurações Context7 por cliente, exclusões Graphify e exemplos de hooks. Copie e adapte apenas os arquivos usados; valide no destino. O [manifesto](templates/project-docs/manifest.json) é a referência para os documentos gerados.

### Verifique esta cópia

```bash
node --test scripts/validate-docs.test.mjs
node scripts/validate-docs.mjs
node scripts/validate-next.mjs
```

Os primeiros comandos testam o validador e conferem links, âncoras, destinos e JSON. O último exige **Node.js 24, npm e rede**; cria um projeto temporário, executa os checks da base e remove os recursos criados. Dependências do produto não entram na raiz deste repositório. Veja [escopo e evidências](docs/05-toolkit-validation.md) antes de interpretar os resultados.

<a id="community"></a>

## 08 / Acompanhe a evolução

Se o toolkit ajudou a preparar um projeto ou melhorar seu fluxo, uma estrela facilita encontrá-lo novamente e dá visibilidade ao trabalho.

<a href="https://www.star-history.com/?repos=soumatheusgomes%2Fvibe-coding-toolkit&amp;type=date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=soumatheusgomes/vibe-coding-toolkit&amp;type=date&amp;theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=soumatheusgomes/vibe-coding-toolkit&amp;type=date" />
    <img src="https://api.star-history.com/chart?repos=soumatheusgomes/vibe-coding-toolkit&amp;type=date" alt="Histórico de estrelas do repositório soumatheusgomes/vibe-coding-toolkit, fornecido pelo Star History." width="1000" loading="lazy" />
  </picture>
</a>

[Abrir o histórico de estrelas](https://www.star-history.com/?repos=soumatheusgomes%2Fvibe-coding-toolkit&type=date) · [Reportar um problema](https://github.com/soumatheusgomes/vibe-coding-toolkit/issues) · [Propor uma melhoria](https://github.com/soumatheusgomes/vibe-coding-toolkit/pulls)

O gráfico é fornecido pelo [Star History](https://www.star-history.com/blog/how-to-use-github-star-history/) e depende da disponibilidade desse serviço. Para contribuir, descreva o problema, preserve caminhos públicos e inclua validação pertinente. Prompts e templates precisam continuar portáveis, sem segredos ou configurações pessoais.

<a id="credits"></a>
<a id="license"></a>
<a id="build-together"></a>
<a id="acknowledgments"></a>
<a id="licensing"></a>

## Créditos e licença

Construído a partir de [Superpowers](https://github.com/obra/superpowers), [RTK](https://github.com/rtk-ai/rtk), [Ponytail](https://github.com/DietrichGebert/ponytail), [Caveman](https://github.com/JuliusBrussee/caveman), [Graphify](https://github.com/Graphify-Labs/graphify), [Context7](https://github.com/upstash/context7), [agent-browser](https://github.com/vercel-labs/agent-browser), [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) e [Skills CLI](https://github.com/vercel-labs/skills). Cada projeto mantém sua licença e distribuição.

Toolkit sob [MIT](LICENSE). Por [Matheus Gomes](https://instagram.com/matheusgomes).

<p align="center">
  <strong>BUILD WITH INTENT. SHIP WITH FLOW.</strong>
  <br />
  <a href="#top">Voltar ao topo ↑</a>
</p>
