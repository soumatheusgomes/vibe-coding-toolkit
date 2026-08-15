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

Linhas com `/plugin` rodam de dentro de uma sessão `claude`. Graphify e
agent-browser não são plugins — são CLIs independentes, instaladas fora da
sessão, com o gerenciador de pacote de cada um.

| Ferramenta | Fonte | Instalação |
|---|---|---|
| Superpowers | `anthropics/claude-plugins-official` | `/plugin marketplace add anthropics/claude-plugins-official` → `/plugin install superpowers@claude-plugins-official` |
| Ponytail | `DietrichGebert/ponytail` | `/plugin marketplace add DietrichGebert/ponytail` → `/plugin install ponytail@ponytail` |
| Caveman | `JuliusBrussee/caveman` | `/plugin marketplace add JuliusBrussee/caveman` → `/plugin install caveman@caveman` |
| aia-harness | `leandrosilvaferreira/claude-plugins-registry` | `/plugin marketplace add leandrosilvaferreira/claude-plugins-registry` → `/plugin install aia-harness@leandro-plugins-registry` |
| hookify, pr-review-toolkit, commit-commands, claude-code-setup, feature-dev, code-review, claude-md-management | `anthropics/claude-plugins-official` | `/plugin install <nome>@claude-plugins-official` |
| ui-ux-pro-max | `nextlevelbuilder/ui-ux-pro-max-skill` | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` → `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| Graphify | pacote Python `graphifyy` (não é plugin) | `pip install graphifyy` ou `uv tool install graphifyy` |
| agent-browser | CLI npm (não é plugin) | `npm i -g agent-browser && agent-browser install` |

A linha `hookify, pr-review-toolkit, ...` reaproveita a mesma marketplace do
Superpowers (`anthropics/claude-plugins-official`) — se você já rodou aquele
`/plugin marketplace add` lá em cima, não precisa rodar de novo, é só trocar
`<nome>` pelo plugin desejado.

## Quer o passo a passo completo?

Essa página é só o cheat sheet. Para entender o motivo de cada peça, ver
exemplo de uso, e configurar hooks, memória de longo prazo e o template de
projeto com calma, vá para o
[Playbook de onboarding](02-playbook-onboarding.md).
