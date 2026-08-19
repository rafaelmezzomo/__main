# Retro Sprint 2026-W33 (10/08 - 16/08) — Lançamento do Clube da Memória Pro

> Esta retro **reconciliou o `planning.json` com o git** antes de calcular as métricas. Metade do que
> saiu na semana nunca tinha virado tarefa no board — cinco entregas foram reconstruídas a partir dos
> commits e adicionadas ao planning (`mc-033` a `mc-036`, `sl-015`). Os números abaixo já são os
> reconciliados.

## Métricas
- Tarefas: **23/27 concluídas (85%)** — 4 abertas
- Horas: **59h com horas registradas vs 75h estimado** — 31h dessas 59h nunca foram estimadas (não estavam no planning), e 6 tarefas foram fechadas sem horas registradas
- Utilização: **≥59h / 40h disponíveis (≥148%)**

| Projeto | Est. | Real | % Tempo | Conclusão |
|---------|------|------|---------|-----------|
| **Clube da Memória** | 46h | 52h | 88% | 16/18 |
| **Yang Planet** | 15h | 4h | 7% | 3/4 |
| **Stalo Labs** | 14h | 3h | 5% | 4/5 |
| **Total** | **75h** | **59h** | 100% | **23/27** |

> Em 19/08, na sessão de planning, seis tarefas foram fechadas no board sem horas registradas
> (`mc-016`, `mc-019`, `mc-024`, `mc-030`, `yp-020`, `yp-021`), levando a conclusão de 63% para 85%.
> O real de 59h é portanto um piso, não o número final.

**Commits na janela 10–16/08:** memory-club 83 · memory-pulse 3 · stalolabs-MOAI 2 · yang-gps 0 · yang-gps-frontend 0 · stalolabs 0 · stalinho 0

---

## Highlights por projeto

### Clube da Memória — **o Pro foi ao ar** 🚀
A semana tinha uma data marcada: terça, 11/08, sai o vídeo e o app precisa estar pronto pra vender.
Estava.

**O lançamento (planejado):**
- `mc-017` fluxo Pro Hotmart em produção — deploy SAM com hottok, Webhook 2.0 registrado no painel
  (produto X100979240S), teste ponta a ponta: compra → `hotmart-purchases` → `/pro/verify` → Palácio
  liberado.
- `mc-025` **sandbox e2e isolado** — stack SAM paralelo (`-sbx`) que validou compra → role → paywall →
  chargeback → revogação **sem tocar nas 79 compras reais**. Foi o que deu confiança pra apertar o
  botão, e ainda gerou os tickets #79–#82 — todos fechados na mesma semana.
- Segurança tratada como feature, não como dívida pós-lançamento: `mc-020` gate `member-pro`
  server-side em 5 endpoints do Palácio, `mc-027` gate duro de UI (o X do paywall não libera mais a
  trilha, corrigido no hub **e** na rota direta), `mc-026` prova de posse do email via OTP de 6
  dígitos com rate limit atômico e teto diário, `mc-028` webhook que não regride `approved → pending`.
- `mc-030` SES: domínio `memoria.club` verificado, DKIM, MAIL FROM, SPF/DMARC — production access
  submetido e ainda na fila da AWS.
- `mc-031` polish de UI com causa raiz achada: um `button{}` cru no `sart/legacy.css` vazava pra
  qualquer botão do Clube, explicando três bugs de uma vez.

**O que saiu além do planejado (31h que o board não via):**
- `mc-033` **login próprio sem senha** (#85/#88) — Cognito custom auth com código por email, apelido
  público obrigatório, aceite de termos, rede de proteção do login antigo, resgate de conta errada na
  tela de resultado do RAM. Três merges (#59, #60, #61).
- `mc-034` **funil de aquisição do RAM antes do signup** (#78), já com leitura no cockpit.
- `mc-035` **Memory Pulse** — cockpit admin read-only v1 + aba de aquisição, em repo separado.
  (Continua no W34 como `mc-025`; as horas estão contabilizadas aqui.)
- `mc-036` **consolidação do design system + release v1.4** — texto em preto/branco a 70%, light como
  tema default persistido no Dynamo, estrelas de qualidade por fase, cache de request, polish do paywall.
- `mc-021` (log bruto dos webhooks Hotmart) foi antecipado pro dia do lançamento, mas está registrado
  no W34.

### Yang Planet — parado
Só `yp-019` (Courageous Land) fechou, e é trabalho de reunião. **Zero commits** em `yang-gps` e
`yang-gps-frontend` na janela — os commits de landscape de financiamento são de 17/08, já W34.
`yp-018` (novo fundo), `yp-020` (kickoff cliente) e `yp-021` (framework de reunião) não se moveram.

### Stalo Labs — só o MOAI
`sl-012`, `sl-013` e `sl-014` estão marcadas done mas sem commit na janela e sem horas registradas —
provavelmente executadas antes do sprint. O que de fato saiu foi `sl-015`: lista de reuniões do
Granola no MOAI (scroll, multi-seleção, check de já transcrita) e a documentação dos requests na
Anthropic. `sl-011` (export PDF) segue aberta.

---

## Reflexão

### O que foi bem
O lançamento saiu no prazo e inteiro. Não foi "subir o pagamento e arrumar depois": o gate
server-side, o gate duro de UI, o OTP de posse de email e a ordenação de eventos do webhook entraram
como tarefas de primeira classe, antes do vídeo. O sandbox e2e isolado foi a decisão que sustentou
isso — validar o ciclo completo, inclusive chargeback, sem risco nenhum pras 79 compras reais, e
transformar o resultado em quatro tickets fechados na mesma semana. E ainda sobrou velocidade: em
cima do lançamento saíram o login próprio sem senha, o funil de aquisição do RAM, o Memory Pulse e a
release v1.4.

### O que travou
Duas coisas, e são a mesma. **Yang Planet e Stalo Labs pararam** — zero commits em sete dias. A
atenção inteira foi pro Clube, o que fazia sentido numa semana de lançamento, mas as duas frentes
ficaram sem nenhum avanço e o Yang só voltou a se mexer no dia 17.

E **o planning descolou da execução**. O board dizia 24h e 12 tarefas; o git dizia 83 commits e ~59h.
Quatro entregas grandes do Clube e a única atividade real do Stalo nunca viraram card. Sem essa
reconciliação, a retro teria contado uma semana que não aconteceu — e pior, teria concluído que o
sprint rendeu pouco, quando ele rendeu 148% do budget.

### O que mudar
**Registrar o que nasce no meio.** Trabalho não planejado que come o sprint entra no `planning.json`
no mesmo dia, com horas, mesmo que a decisão de fazer tenha sido tomada na hora. Não é burocracia:
é o que separa "o Clube consumiu tudo" de "o Clube consumiu tudo *e olha o que saiu*". Enquanto o
board não registra, a retro vira arqueologia de git e as decisões de priorização da semana seguinte
são tomadas em cima de um número errado.

---

## Carryover → Sprint 19/08–28/08

Sobraram quatro, todas absorvidas pelo sprint 2026-W35 (19/08–28/08) montado em 19/08:

- **`mc-018`** Email/WhatsApp de boas-vindas (4h) — 🔴, entra na frente "cauda do lançamento"
- **`mc-032`** Redesign da landing: vitrine do produto (spec fechada em #87) — vira a frente "crescimento", 10h
- **`yp-018`** Adicionar novo fundo — scrap + processamento (6h) — ⚪ backlog, provavelmente absorvida pelo método do `yp-023`
- **`sl-011`** Exportar relatório em PDF (4h) — ⚪ backlog, Stalo Labs ficou fora do sprint por decisão

As outras seis que estavam abertas no fim da semana (`mc-016`, `mc-019`, `mc-024`, `mc-030`,
`yp-020`, `yp-021`) foram fechadas no board em 19/08.

⚠️ **Colisão de IDs:** `mc-026` a `mc-031` existem no W33 **e** no W34 apontando pra tarefas
diferentes (W33 `mc-026` = OTP no link-email; W34 `mc-026` = salvar o RAM fase a fase). Isso quebra
o rastreamento de carryover por ID. Correção sugerida: renumerar as tarefas novas do W34 pra faixa
`mc-037+`.

---

## Tokens Claude da semana

| Projeto | Input | Output | Cache | Total |
|---------|-------|--------|-------|-------|
| Clube da Memória | 48k | 5.6M | 1687.3M | **1.69B** |
| Yang Planet | 8k | 537k | 41.1M | 41.6M |
| Stalo Labs | 437 | 179k | 25.8M | 26.0M |
| __main (planner) | 233 | 98k | 27.6M | 27.7M |
| outros | 1k | 784k | 79.1M | 79.9M |
| **Total** | **58k** | **7.2M** | **1860.9M** | **1.87B** |

90% do consumo foi Clube da Memória — o mesmo formato da distribuição de commits e de horas.
