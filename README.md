# Vibe Coding Toolkit

Um guia prático (e testado no dia a dia) de como programar com IA sem virar
refém dela: os plugins que uso, por que uso cada um, como instalar, e os
prompts prontos pra copiar e colar. Nada aqui é teoria — é o fluxo que uso de
verdade, todo santo dia, em código de produção.

Cansei de ver gente instalando um MCP atrás do outro sem saber o porquê, ou
colando prompt gigante sem entender o que ele resolve. Esse repositório é o
oposto disso: cada ferramenta tem um motivo pra estar aqui, e você pode
adotar peça por peça.

## Quem sou eu

Sou o Matheus Gomes ([@soumatheusgomes](https://github.com/soumatheusgomes)
no GitHub), e no Instagram ([@soumatheusgomes](https://instagram.com/soumatheusgomes))
dou dicas de prompt e IA pra devs. Esse repositório é a versão organizada e
sem enrolação de tudo que venho ensinando por lá.

## Comece por aqui

- [Visão geral](docs/00-overview.md) — a filosofia por trás do fluxo inteiro, antes de instalar qualquer coisa.
- [Guia de instalação](docs/01-installation.md) — passo a passo, do zero ao ambiente completo.

## Ferramentas

| Doc | O que é |
|---|---|
| [Superpowers](docs/tools/01-superpowers.md) | Skill que impõe o fluxo brainstorm → plano → implementação → review antes de qualquer código. |
| [Orquestração de subagentes](docs/tools/02-subagent-orchestration.md) | A sessão principal não implementa nada: ela planeja e delega pra subagentes especialistas. |
| [RTK — proxy de tokens](docs/tools/03-rtk-token-proxy.md) | Padrão de proxy que reescreve comandos de dev pra economizar 60-90% dos tokens em sessões longas. |
| [Ponytail](docs/tools/04-ponytail.md) | Persona "engenheiro sênior preguiçoso": YAGNI e simplicidade aplicados ao que é construído. |
| [Caveman](docs/tools/05-caveman.md) | Persona de comunicação: respostas curtas, densas em fatos, sem enrolação. |
| [Quality gates ESLint/Biome](docs/tools/06-eslint-biome-quality-gates.md) | Como subir regras de lint de warning pra erro como uma migração rastreada, não de um dia pro outro. |
| [Graphify](docs/tools/07-graphify.md) | Grafo de conhecimento do código, pra orientação rápida e barata em bases grandes. |
| [Obsidian como memória](docs/tools/08-obsidian-memory.md) | MCP server que transforma um vault do Obsidian em memória de longo prazo pro agente. |
| [Sistema de memória do Claude](docs/tools/09-claude-memory-system.md) | Índice sempre carregado + vault estruturado de longo prazo, pra lição não se perder entre sessões. |
| [Hooks — boas práticas](docs/tools/10-hooks-best-practices.md) | Como escrever hooks do Claude Code que falham de forma segura em vez de quebrar a sessão. |
| [agent-browser](docs/tools/11-agent-browser.md) | CLI de automação de navegador pra agentes. |

## Prompts prontos

| Doc | O que é |
|---|---|
| [Sanitização de projeto](docs/prompts/01-project-sanitation.md) | Prompt pra limpar e organizar a memória/estrutura de um projeto. |
| [ESLint warning burndown](docs/prompts/02-eslint-warning-burndown.md) | Prompt pra zerar warnings de lint de forma sistemática, sem quebrar nada. |
| [Code review multi-agente](docs/prompts/03-multi-agent-code-review.md) | Prompt pra disparar vários revisores especialistas em paralelo num mesmo diff. |
| [Brainstorm até plano](docs/prompts/04-brainstorm-to-plan.md) | Prompt pra sair de uma ideia solta até um plano de implementação de verdade. |
| [Parallel wave dispatch](docs/prompts/05-parallel-wave-dispatch.md) | Prompt pra quebrar um plano em ondas paralelas de subagentes sem conflito de arquivo. |
| [Memory bootstrap](docs/prompts/06-memory-bootstrap.md) | Prompt pra configurar o sistema de memória em dois níveis num projeto novo. |

## Como usar

Tudo aqui foi escrito pensando no [Claude Code](https://docs.claude.com/en/docs/claude-code),
mas boa parte dos prompts e das regras (`templates/rules/`) não dependem de
ferramenta nenhuma — funcionam também no OpenAI Codex ou qualquer outro
agente que leia um arquivo de instruções e execute comandos. Onde um
conceito é específico do Claude Code (plugins, hooks, skills), o doc deixa
isso explícito.

Fluxo sugerido:

1. Leia [Visão geral](docs/00-overview.md) pra entender o porquê antes do como.
2. Siga o [Guia de instalação](docs/01-installation.md) e monte seu ambiente.
3. Copie `templates/CLAUDE.md.template` pro seu projeto e preencha os placeholders.
4. Use os prompts em [`docs/prompts/`](docs/prompts/) como ponto de partida — copie, cole, ajuste pro seu contexto.

## Por que a documentação está em inglês

O README está em português porque é pra você, que me acompanha por aqui. Mas
toda a documentação (`docs/`) e todos os prompts estão em inglês de
propósito: é o que dá alcance além do público de língua portuguesa.

## Créditos

Esse toolkit se apoia em cima de trabalho de outras pessoas. Vale a pena
conhecer os projetos originais:

- [Superpowers](https://github.com/anthropics/claude-plugins-official) — Anthropic
- [Ponytail](https://github.com/DietrichGebert/ponytail) — Dietrich Gebert
- [Caveman](https://github.com/JuliusBrussee/caveman) — Julius Brussee
- [aia-harness](https://github.com/leandrosilvaferreira/claude-plugins-registry) — Leandro Silva Ferreira

## Licença

[MIT](LICENSE).
