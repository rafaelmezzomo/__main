# Central de Planejamento Semanal

Mesa de trabalho central para planejamento semanal dos projetos.

## Projetos

| ID | Nome | Repos |
|----|------|-------|
| yangplanet | Yang Planet | yang-gps, yang-gps-frontend, yang-dashboard-eda |
| stalolabs | Stalo Labs | stalolabs, stalolabs-growth |
| memory-club | Clube da Memória | memory-club, sart |

Repos ficam em `repositories/` (cada um tem seu próprio git, ficam fora deste repositório).

## Estrutura

```
__main/
├── plannings/              # Planning + retro semanal (JSON + MD)
├── templates/              # Templates dos MDs gerados
├── scripts/                # generate.sh, stats.sh
├── projects.json           # Definição central dos projetos
├── changelog.md            # Daily log
├── __planning-layout/      # Viewer atual (HTML/JS single-file)
├── planning-dashboard/     # React app em construção (substituirá o viewer)
├── .claude/commands/       # Skills: planning, retro, daily-log
└── repositories/           # Repos dos projetos (gitignored)
```

## Ritual Semanal (segunda de manhã / domingo à noite)

### 1. Retro da semana anterior
- Atualizar `actual_hours` e `status` das tarefas no JSON da semana anterior
- Rodar `./scripts/generate.sh <semana-anterior>` para gerar a retro
- Responder as 3 perguntas de reflexão

### 2. Planning da semana atual
- Editar `plannings/<semana>/planning.json` com as tarefas
- Cada tarefa tem: id, título, repo, horas estimadas, prioridade (Eisenhower)
- Rodar `./scripts/generate.sh <semana>` para gerar os Markdowns

## Prioridades (Eisenhower)

| Prioridade | Significado |
|-----------|-------------|
| `red` 🔴 | Urgente + Importante → fazer agora |
| `yellow` 🟡 | Importante, não urgente → agendar |
| `green` 🟢 | Urgente, não importante → quick win |
| `white` ⚪ | Nem urgente nem importante → backlog |

## Scripts

```bash
# Gerar Markdowns da semana
./scripts/generate.sh 2026-W22

# Estatísticas de todas as semanas
./scripts/stats.sh

# Últimas N semanas
./scripts/stats.sh --weeks 4
```
