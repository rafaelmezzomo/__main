# Planning Semanal

Ritual de planning semanal para a semana $ARGUMENTS (ex: 2026-W22). Se não informada, calcular a semana atual.

## Passo 1: Retro da semana anterior (se não foi feita)
- Checar se existe `plannings/<semana-anterior>/retro.md`
- Se não existe: puxar git logs de todos os projetos da semana anterior, montar o JSON e gerar retro
- Perguntar as 3 perguntas de reflexão

## Passo 2: Overview da semana
- Perguntar ao Rafael: quais são os objetivos macro de cada projeto essa semana?
- Para cada projeto perguntar: deadline e estimativa de esforço em horas
- Montar tabela geral:

```
| Projeto | Objetivo | Horas | Deadline | Prioridade |
```

- Validar se cabe nas 40h disponíveis
- Se estourar: perguntar o que cortar ou mover para backlog

## Passo 3: Refinamento por projeto
- Para cada projeto, listar 2-5 tarefas macro com:
  - Título curto
  - Horas estimadas
  - Prioridade Eisenhower (🔴🟡🟢⚪)
- NÃO entrar em detalhes de implementação (componentes, arquivos, código)
- Isso fica para quando abrir o projeto separadamente

## Passo 4: Salvar
- Criar `plannings/<semana>/planning.json` com as tarefas
- Rodar `./scripts/generate.sh <semana>` para gerar os MDs
- Confirmar que `plannings/<semana>/planning.md` e os per-project files foram gerados

## Regras
- Manter conversa rápida e focada — o planning não deve levar mais que 30min
- Overview primeiro, detalhe depois
- Sempre salvar versão consolidada na raiz do __main
