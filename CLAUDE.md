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

## Board sincronizado

Para acompanhar o status das tarefas, rodar `node scripts/serve.js` e abrir `http://localhost:4321`. Arrastar um card entre as colunas (Todo / Doing / Done) grava o `status` direto no `plannings/<week>/planning.json` e regenera os markdowns — então o `planning.json` é a **fonte de verdade do status** que o Claude lê. Aberto via `file://` o board funciona offline (status só no navegador, não sincroniza).

## Daily Log

Na **primeira interação do dia** neste projeto, gerar proativamente o daily log do dia anterior usando `/daily-log`. O log fica em `changelog.md` na raiz (entradas mais recentes no topo). Também pode ser chamado manualmente a qualquer momento.

## Blog

Todo post de blog vive em `blog/<slug>/`. Quando Rafael pedir pra escrever um post, usar a skill `/blogpost`.

- **Índice:** `blog/index.html` — lista os posts, lido a partir do manifesto `blog/blog.json` (**fonte de verdade do índice**). Sempre editar o `blog.json` primeiro e regenerar o `index.html`. Abre offline via `file://`.
- **Design:** `blog/assets/blog.css` — tokens estilo shadcn + tema Apple, mobile-first, claro/escuro.
- **Datas:** cada post tem `blog/<slug>/post.json` com `created` + `updated[]` (**fonte de verdade das datas** da assinatura).
- **Pesquisa:** o texto original de cada referência é salvo em `blog/<slug>/references/` e citado com footnotes numerados.
- **Tom de voz:** `_contexto/copysystem.md` — perfil de voz do Rafael; a skill revisa a cada 3 posts e o empurra a achar a própria voz.

## Skills disponíveis

- `/planning <semana>` — ritual de planning semanal
- `/retro <semana>` — retrospectiva semanal
- `/daily-log [data]` — gerar entrada no changelog diário
- `/blogpost` — escrever um post de blog (pesquisa, fotos, render, índice)
