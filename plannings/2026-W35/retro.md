# Retro Sprint 2026-W35 (19/08 - 28/08) — A cauda do lançamento e a fábrica de jogos

> Retro escrita em 17/09, com atraso, reconstruída a partir do git. É a segunda metade de agosto —
> o sprint que veio depois do lançamento do Pro (11/08) e antes do congelamento da main. Cobre as
> semanas W34+W35.

## Métricas

- Tarefas: **14/23 concluídas (61%)** — 9 abertas
- Horas: **85h concluídas de 133h estimadas**, sobre 56h disponíveis
- Utilização: **≥152% do budget** — e o número é piso, nenhuma tarefa teve `actual_hours` registrado

| Projeto | Concluídas | Horas done / est. | Commits |
|---------|-----------|-------------------|---------|
| **Clube da Memória** | 7/14 (50%) | 39h / 78h | 79 |
| **Yang Planet** | 5/6 (83%) | 39h / 42h | 23 |
| **Stalo Labs** | 2/3 (67%) | 7h / 13h | 52 |
| **Total** | **14/23** | **85h / 133h** | **154** |

---

## Highlights por projeto

### Clube da Memória — a fábrica de jogos girou

Três minigames novos no mesmo sprint: **Espelho Oculto, Cores Velozes e Cromofila** (span
visuoespacial com tom por cor), todos entrando em beta visível só para admin antes de abrir. A
pipeline da fábrica de jogos foi revisada com as lições de duas rodadas e documentada.

E duas rodadas de polimento que merecem destaque pelo **método**: `#95` diagnosticou a interface dos
minigames e virou uma lista de correções rastreáveis (E1 a E10 no Espelho Oculto, V1/V2/V4/V5 no
Cores Velozes); `#96` fez o mesmo com o fluxo do RAM Score (R1 a R4). Diagnóstico escrito primeiro,
correção depois, cada fix apontando para o item que fecha.

Também saíram: o modo revisão do RAM renderizando sessão sem snapshot, aberturas e cliques por
e-mail na rota `/admin/emails`, o fix do rubber-band do iOS que vazava para o body, e os guard-rails
do callback do Cognito — que virou a pasta `Plannings/aprendizados`.

**E a landing nova.** Design system de marketing, e em seguida **três variantes** — A, B (pitch de
comunidade, v1.5.2) e C (objetivo único, v1.5.3) —, com a variante C mudando o funil: passou a levar
para a aula grátis do Hotmart em vez da compra, e o funil grátis passou a começar no signup do app
em vez do teste RAM.

### Yang Planet — 5 de 6, e a Fase 2 destravada
Rastreabilidade dos fundos com schema de proveniência e lifecycle (migração de 300 registros dos 32
`_inventory.md`), re-verificação web dos 51 fundos em 6 batches paralelos com evidência datada
(resultado: 44 ativos, 2 pausados, 3 fechados para novos, 2 encerrados), badges de status e KPI de
"ativas" real no frontend, e a Fase 2 das 8 novas fontes.

Ficou aberto o `yp-027`: o match estourando o teto de 400KB do item no Dynamo, bug real encontrado
no projeto Courageous Land. Foi corrigido na W36.

### Stalo Labs — 52 commits e o padrão de auth da casa
O maior volume de commits da Stalo em muito tempo. Saiu o **prompt caching no resumir-reunião**
(`sl-012`), que não estava planejado: uma auditoria da tabela de logs mostrou 99,2% do custo em
input, e transformar o transcript em bloco com `cache_control` derrubou o custo em ~70% num conselho
de 8 empresas (US$ 0,70 → ~US$ 0,21).

E em **28/08, o último dia do sprint**, saiu a v0.4 do MOAI: login individual com Clerk, allowlist,
passwordless, sessão de 7 dias e trilha de auditoria com "editado por".

---

## Reflexão

### O que foi bem

**O sprint entregou continuamente.** Três versões foram para a main em dois dias — v1.5.1, v1.5.2,
v1.5.3 — além da landing nova e dos três minigames. Nada ficou esperando outra coisa para subir.

Isso merece ser dito com todas as letras porque é o **contraste exato com a W36**: mesmo
desenvolvedor, mesmo código, mesma velocidade de commit (79 commits aqui, 88 lá). A W35 colocou tudo
no ar e a W36 não colocou nada. A diferença não foi esforço nem competência — foi que na W35 cada
entrega saía de uma base já mergeada, e na W36 cada uma começou a partir da anterior ainda em
branch.

O outro acerto foi de método: **diagnosticar por escrito antes de corrigir**. Os documentos `#95` e
`#96` transformaram "a interface está ruim" numa lista numerada de defeitos, e cada commit fechou um
item específico. É o oposto de polir no olho, e foi o que permitiu tocar seis jogos sem regressão.

### O que travou

**O experimento das três landings nunca produziu um resultado.** As variantes A, B e C foram
construídas, a C mudou o funil de propósito (aula grátis em vez de compra direta), e o beta estava
registrado em `Plannings/#97`. Só que na W36 o redesign substituiu aqueles CTAs — a revisão de tech
lead registrou isso em `#109`, item 5: *"variante C morreu"*, com um pedido para confirmar se a
mudança de funil era intencional. **Até hoje ninguém confirmou.**

Ou seja: construiu-se três versões de uma página para escolher a melhor, e a escolha nunca foi
feita — a decisão foi tomada por acidente, pelo sprint seguinte. O trabalho não foi perdido, mas o
aprendizado foi.

**Metade do Clube não fechou.** 7 de 14, e algumas das que ficaram abertas são as mesmas de hoje.
O `mc-036` (fundação de rotas públicas) começou aqui o seu ciclo de **três sprints seguidos em
vermelho sem ser feito** — o que, na prática, é o board dizendo que ele nunca foi urgente. O
`mc-037` (separação de reputação de e-mail) também nasceu aqui e segue parado, com o `template.yaml`
editado e nada deployado.

**O board já estava descolando da execução.** O `sl-016` (login com Clerk) aparece como aberto neste
sprint, mas o trabalho foi feito em **28/08 — o último dia da janela**. Ele só foi registrado como
concluído no sprint seguinte, virando `sl-017`. É o mesmo diagnóstico que a retro da W33 já tinha
feito, repetido: o que é entregue no fim do sprint não vira registro, e a retro seguinte tem que ir
buscar no git.

### O que mudar

**Experimento precisa de data de decisão e de métrica, não só de variantes.** Três landings sem um
critério escrito de quem ganha e quando se decide não é um teste — é três páginas. Se não há volume
para decidir, o registro tem que dizer isso e o experimento tem que ser adiado, não construído.

**Tarefa entregue no último dia entra no board no último dia.** A v0.4 do MOAI foi um sprint inteiro
de trabalho que atravessou a fronteira sem registro. Isso não é burocracia: é o que separa "a Stalo
entregou pouco" de "a Stalo entregou a v0.4 inteira".

**Vermelho que sobrevive a dois sprints deixa de ser vermelho.** O `mc-036` provou na prática que
não era urgente. Ou ele vira quick win e sai numa tarde, ou desce para amarelo e para de ocupar o
topo da lista — o que foi feito na W37.

---

## Carryover → Sprint 2026-W36 (29/08-12/09)

Nove tarefas atravessaram:

- **`mc-036`** Fundação de rotas públicas (14h) — 🔴 em doing, carryover desde o W34
- **`mc-037`** Separação de reputação de e-mail (3h) — 🟡, nada deployado
- **`mc-031`** Skill de relatório diário (4h) — 🟡
- **`mc-033`**, **`mc-034`**, **`mc-035`** Growth: destino dos posts, funil C, share do RAM — 🟡/⚪
- **`mc-022`** Recalc SART server-side (8h) — ⚪ backlog crônico
- **`yp-027`** Fix do teto de 400KB no Dynamo (3h) — 🔴 **corrigido na W36**
- **`sl-016`** Login com Clerk (6h) — 🟡 **na verdade entregue em 28/08**, registrado na W36 como `sl-017`

⚠️ **Nota de rastreamento:** a retro da W33 já tinha alertado para colisão de IDs entre semanas
(`mc-026` a `mc-031` existem na W33 e na W34 apontando para tarefas diferentes). A faixa usada aqui
(`mc-026` a `mc-037`) segue a numeração corrigida. A partir da W37 o board gera IDs pelo servidor,
varrendo todas as semanas — a colisão não pode mais acontecer.
