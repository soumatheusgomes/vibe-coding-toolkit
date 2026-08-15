# Instalação

Referência rápida — comandos, sem enrolação. Para o passo a passo narrado,
com exemplo em cada etapa, veja o
[Playbook de onboarding](02-playbook-onboarding.md).

## 1. Claude Code

O Claude Code é o CLI (interface de linha de comando) que roda tudo daqui
pra frente — plugins, hooks, subagentes. É o pré-requisito antes de qualquer
outro passo abaixo.

```bash
npm install -g @anthropic-ai/claude-code
```

Confirme que ficou disponível no seu `PATH`:

```bash
claude --version
```

Detalhes completos de instalação e autenticação:
[documentação oficial do Claude Code](https://docs.claude.com/en/docs/claude-code).

## 2. Plugins e CLIs independentes

> 💬 **O jeito mais fácil: peça pro seu agente instalar.**
>
> ```
> Instale [nome da ferramenta] pra mim: rode `[comando 1]`[, depois `[comando 2]`].
> ```
>
> O Claude Code tem acesso a terminal (Bash) — ele roda os comandos por você e confirma que funcionou. Você não precisa abrir um terminal separado nem saber a diferença entre `pip`, `uv` e `npm`. Prefere fazer você mesmo? Os comandos abaixo são exatamente os mesmos, é só rodar direto no seu terminal.

Linhas com `/plugin` rodam de dentro de uma sessão `claude` — ou seja, já
são o pedido pro agente, direto. Graphify e agent-browser não são plugins
— são CLIs independentes, instaladas fora da sessão, com o gerenciador de
pacote de cada um.

| Ferramenta | Fonte | Instalação |
|---|---|---|
| Superpowers | `anthropics/claude-plugins-official` | `/plugin marketplace add anthropics/claude-plugins-official` → `/plugin install superpowers@claude-plugins-official` |
| Ponytail | `DietrichGebert/ponytail` | `/plugin marketplace add DietrichGebert/ponytail` → `/plugin install ponytail@ponytail` |
| Caveman | `JuliusBrussee/caveman` | `/plugin marketplace add JuliusBrussee/caveman` → `/plugin install caveman@caveman` |
| aia-harness | `leandrosilvaferreira/claude-plugins-registry` | `/plugin marketplace add leandrosilvaferreira/claude-plugins-registry` → `/plugin install aia-harness@leandro-plugins-registry` |
| hookify, pr-review-toolkit, commit-commands, claude-code-setup, feature-dev, code-review, claude-md-management | `anthropics/claude-plugins-official` | `/plugin install <nome>@claude-plugins-official` |
| ui-ux-pro-max | `nextlevelbuilder/ui-ux-pro-max-skill` | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` → `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| Graphify | pacote Python `graphifyy` (não é plugin) | `uv tool install graphifyy` → `graphify claude install` |
| agent-browser | CLI npm (não é plugin) | `npm i -g agent-browser && agent-browser install` |

A linha `hookify, pr-review-toolkit, ...` reaproveita a mesma marketplace do
Superpowers (`anthropics/claude-plugins-official`) — se você já rodou aquele
`/plugin marketplace add` lá em cima, não precisa rodar de novo, é só trocar
`<nome>` pelo plugin desejado.

O pacote no PyPI é `graphifyy`, com dois "y" — o comando instalado é
`graphify`, com um só. `uv` (ou `pipx`) é preferido a um `pip install`
solto: o próprio README do projeto avisa que `pip install` sozinho pode
instalar o pacote num Python diferente daquele que o comando `graphify`
resolve depois, causando erro de módulo não encontrado. Depois de instalar
o pacote, conecte ao agente: `graphify claude install` (grava a seção do
Graphify no `CLAUDE.md` e configura o hook, específico pro Claude Code) ou
`graphify install` (detecta e registra em qualquer agente de IA instalado).

> ⚡ **Atalho: deixe o aia-harness montar a base pra você.**
>
> O plugin `aia-harness` (linha acima) tem o comando `/aia-harness:init`, que escaneia o projeto e monta boa parte dessa estrutura sozinho — agentes especialistas, regras, hooks, memória, `settings.json`:
>
> ```
> /aia-harness:init
> ```
>
> Não quer montar tudo manualmente, peça por peça? Instale o plugin primeiro (tabela acima) e deixe ele fazer o trabalho pesado — depois use o resto deste repositório pra entender o que foi montado e por quê.

## Quer o passo a passo completo?

Essa página é só o cheat sheet. Para entender o motivo de cada peça, ver
exemplo de uso, e configurar hooks, memória de longo prazo e o template de
projeto com calma, vá para o
[Playbook de onboarding](02-playbook-onboarding.md).
