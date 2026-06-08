# Retro Semanal

Ritual de retrospectiva da semana $ARGUMENTS (ex: 2026-W21). Se não informada, calcular a semana anterior.

## Passo 1: Coletar dados
- Puxar git logs de todos os projetos da semana (commits, PRs, branches)
- Checar sessões do Claude da semana (projetos trabalhados)
- Coletar tokens das sessions Claude da semana (`~/.claude/projects/<slug>/*.jsonl`), filtrando por `timestamp` dentro do range da semana, somando `message.usage` por projeto conforme mapping do `CLAUDE.md`
- Se existe `plannings/<semana>/planning.json`: comparar planejado vs executado

## Passo 2: Métricas
- Tarefas concluídas / total
- Horas estimadas vs reais (estimativa baseada em commits)
- Distribuição % do tempo por projeto
- Tarefas em carryover (não concluídas)

## Passo 3: Reflexão
Perguntar ao Rafael:
1. O que foi bem?
2. O que me travou?
3. O que vou mudar na próxima semana?

## Passo 4: Tokens por projeto
- Para cada folder em `~/.claude/projects/*/`, ler todos `.jsonl` e somar `message.usage` das mensagens cujo `timestamp` cai dentro da semana
- Mapear o slug do folder → repo (último segmento após `repositories-`) → projeto via `CLAUDE.md`:
  - `yangplanet` ← yang-gps, yang-gps-frontend, yang-dashboard-eda, dashboard-vrod, vrod-dashboard
  - `stalolabs` ← stalolabs, stalolabs-growth, stalolabs-meetings, stalinho
  - `memory-club` ← memory-club, sart
  - Slugs sem match conhecido → linha `outros`
- Acumular por projeto: `input += input_tokens`, `output += output_tokens`, `cache += cache_creation_input_tokens + cache_read_input_tokens`
- Formatar números em k/M (ex: `2.3M`, `450k`) e preencher `{{TOKEN_ROWS}}` + totais no template

## Passo 5: Salvar
- Criar/atualizar `plannings/<semana>/planning.json` com actual_hours e status
- Gerar `plannings/<semana>/retro.md` consolidada
- Rodar `./scripts/generate.sh <semana>` para atualizar os per-project files
- Atualizar `__planning-layout/index.html` em **dois lugares** (o viewer não lê do disco):
  1. const `WEEKS`: preencher bloco `retro` (`completed`, `tasks_done`, `tasks_total`, `hours_estimated`, `hours_actual`, `what_went_well`, `what_blocked`, `what_to_change`) e adicionar `default_status: "done"` nas tasks concluídas
  2. const `RETROS_MD`: adicionar entrada com chave `"<semana>"` contendo o markdown completo do `retro.md` (usado pelo painel lateral "Retrospectivas")
- Identificar tarefas de carryover para a próxima semana

## Regras
- Manter conversa rápida — a retro não deve levar mais que 15min
- Sempre salvar versão consolidada na raiz do __main
