# __main — Central de Planejamento Semanal

## Ritual Semanal

Sempre que Rafael pedir uma **retro** ou **planning**, salvar uma versão consolidada aqui na raiz do `__main`:

- **Retro:** salvar em `plannings/<semana>/retro.md` — métricas, distribuição por projeto, reflexão, carryover
- **Planning:** salvar em `plannings/<semana>/planning.md` — resumo, tarefas por prioridade Eisenhower
- Além disso, gerar os arquivos por projeto em `repositories/<repo>/weekly-plannings/<semana>.md`

Os três artefatos (retro.md, planning.md, e per-project .md) devem sempre ser gerados juntos.

## Projetos

| ID | Nome | Repos |
|----|------|-------|
| yangplanet | Yang Planet | yang-gps, yang-gps-frontend, yang-dashboard-eda, dashboard-vrod, vrod-dashboard |
| stalolabs | Stalo Labs | stalolabs, stalolabs-growth, stalolabs-meetings, stalinho |
| memory-club | Clube da Memória | memory-club, sart |

## Prioridades (Eisenhower)

- `red` 🔴 — Urgente + Importante → fazer agora
- `yellow` 🟡 — Importante, não urgente → agendar
- `green` 🟢 — Urgente, não importante → quick win
- `white` ⚪ — Nem urgente nem importante → backlog

## Tempo

- Budget semanal: 40h (seg a dom)
- Horas por tarefa estimadas (método de tracking real a definir)

## Daily Log

Na **primeira interação do dia** neste projeto, gerar proativamente o daily log do dia anterior usando `/daily-log`. O log fica em `changelog.md` na raiz (entradas mais recentes no topo). Também pode ser chamado manualmente a qualquer momento.

## Skills disponíveis

- `/planning <semana>` — ritual de planning semanal
- `/retro <semana>` — retrospectiva semanal
- `/daily-log [data]` — gerar entrada no changelog diário
