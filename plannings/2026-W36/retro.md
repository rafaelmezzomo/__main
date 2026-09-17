# Retro Sprint 2026-W36 (29/08 - 12/09) — O sprint que produziu tudo e entregou nada

> Retro escrita em 17/09, com atraso, reconstruída a partir do git. Agosto fechou sem retrospectiva
> e a W36 passou sem daily log (o `changelog.md` para em 21/08). Os números abaixo saem do
> `planning.json` reconciliado e do histórico dos repositórios.

## Métricas

- Tarefas: **15/24 concluídas (63%)** — 9 abertas
- Horas: **100h concluídas de 170h estimadas**, sobre 80h disponíveis
- Utilização: **≥125% do budget**, e o número é piso — nenhuma tarefa teve `actual_hours` registrado

| Projeto | Concluídas | Horas done / est. | Commits |
|---------|-----------|-------------------|---------|
| **Clube da Memória** | 6/15 (40%) | 36h / 106h | 88 |
| **Yang Planet** | 7/7 (100%) | 54h / 54h | 55 |
| **Stalo Labs** | 2/2 (100%) | 10h / 10h | 1 |
| **Total** | **15/24** | **100h / 170h** | **144** |

**O número que resume o sprint:** o Clube teve **88 commits — mais que os outros dois projetos
somados — e a pior taxa de conclusão do board (40%)**. Não foi falta de trabalho. Foi trabalho que
não chegou a lugar nenhum.

---

## Highlights por projeto

### Yang Planet — o sprint que funcionou
7 de 7 tarefas fechadas. Rastreabilidade dos fundos com proveniência e lifecycle, re-verificação dos
51 fundos com evidência datada, badges de status no frontend, o fix do teto de 400KB do Dynamo que
vinha derrubando match de cliente, admin alocando usuário a projeto, variante `/abdi` sobre catálogo
isolado, e o bloco grande de match e strategy (tipo de crédito como eixo, histórico append-only,
dois WACCs calculados em código e nunca confiados ao LLM).

Três trials ao vivo foram conduzidos. **Nenhum seguiu no funil, e não há registro do motivo de
nenhum deles** — virou pendência vermelha na W37 (`yp-039`).

### Stalo Labs — uma entrega, no primeiro dia
A v0.4 do MOAI saiu em 28/08, no dia seguinte ao planning que a criou: login individual com Clerk,
allowlist, passwordless, trilha de auditoria com "editado por", ata geral em PDF. Fechou o `sl-016`
e resolveu a rastreabilidade que o termo de LGPD exigia. Depois disso a Stalo ficou parada o sprint
inteiro — **1 commit em duas semanas**.

### Clube da Memória — 88 commits, zero em produção
O que foi construído: checkout próprio no Mercado Pago com Brick, carteira e reembolso self-service
na garantia de 7 dias; aulas tocando no app via Mux com `/curso` virando hub de trilhas e trilha
freemium de 2 aulas grátis; redesign interno com o Victor (design system, layout desktop,
superfícies de conversão Pro); mapa de trilhas na home; app iOS com Capacitor.

Foi ao ar: o Memory Pulse em `pulse.memoria.club`, a sessão persistente com claim atômico do RAM, o
onboarding do Fuji e o polimento dos minigames.

**A última coisa que entrou na main foi em 08/09** (`5cc7927`, fix de sessão). Tudo o mais continua
em branch.

---

## Reflexão

### O que foi bem

O Yang provou que o método funciona quando o trabalho é fatiado em entregas que fecham sozinhas.
Sete tarefas, sete merges, nenhuma dependendo da outra — e no meio delas um bug de produção real
(o teto de 400KB) foi achado, corrigido e fechado dentro do mesmo sprint.

No Clube, a qualidade do que foi construído não está em questão. O checkout tem reembolso
self-service com fluxo de dois e-mails e header de contingência do Pix; a trilha freemium tem
progresso persistido; o redesign passou por revisão de tech lead que registrou 12 débitos por
escrito em vez de deixar passar. Isso é trabalho bem feito.

### O que travou — e o mecanismo exato

Três entregas ficaram amarradas uma na outra, e o git mostra **como** isso aconteceu. As branches
não eram frentes paralelas: eram uma **pilha**.

```
develop (design system / v1.6.0)
 └─ feat/checkout-mercado-pago     nasceu de develop
     └─ adeus-hotmart              nasceu do checkout
         └─ feat/trilhas-zoom-out  nasceu do adeus-hotmart
```

Cada feature nova começou **a partir da anterior ainda não mergeada**. A consequência é aritmética,
não opinião: para colocar o mapa de trilhas no ar, era obrigatório levar junto o Mux, o Mercado Pago
e o design system inteiro. Não existia caminho para entregar um sem os outros três. A landing e o
redesign ficaram presos ao fluxo de Mux/Mercado Pago não porque alguém decidiu acoplar, mas porque
foram construídos empilhados.

**O dia 08/09 foi a fatura dessa dívida chegando.** O PR #82 era para levar só o fix de sessão
(#112). Como a main estava atrás da develop desde a 1.6.0, o merge arrastou 317 arquivos junto — um
release inteiro não planejado, no meio da semana. Foi revertido no mesmo dia. A partir dali a main
congelou.

Ou seja: **na única vez em que se tentou entregar algo pequeno, o sprint acumulado veio junto e
forçou um rollback.** É o sintoma clássico de branch de vida longa, e custou o lançamento da W36.

Três consequências que só apareceram quando alguém foi olhar, em 17/09:
- as lambdas `course-progress` **nunca foram declaradas no `template.yaml`** — o front já as consome,
  então a trilha freemium quebraria em produção no primeiro clique;
- os playback IDs do Mux são os **públicos de teste**, e o gate do Pro é client-side — o curso de
  R$499 fica legível no bundle;
- o checkout **nunca rodou com dinheiro real**.

Nenhuma das três estava em card nenhum. Todas são filhas do mesmo problema: **código que não vai a
produção não é testado por ninguém**.

### O que mudar

**Uma branch, um merge, um sprint.** Nenhuma feature nova começa a partir de uma branch não
mergeada. Se precisar do que está na anterior, a anterior entra na main primeiro — mesmo incompleta,
atrás de flag. A regra não é estética: é o que impede que a quarta feature sequestre as três
primeiras.

**A main não pode ficar mais de uma semana atrás da develop.** O incidente do #82 não foi erro de
merge, foi consequência de distância acumulada. Se `develop → main` tivesse rodado em 03/09, o PR
#82 teria sido o que se esperava dele: um fix de sessão.

**Infra entra no `template.yaml` no mesmo commit que cria a lambda.** As `course-progress` passaram
duas semanas existindo em disco, sendo chamadas pelo front, sem nunca existir no IaC. Isso não é
descuido de quem escreveu — é a ausência de um passo obrigatório.

**Registrar prazo de terceiro como card, não como lembrança.** A liberação de 30 dias do Mercado
Pago e o DNS do SES têm relógio externo e nenhum dos dois tinha card. Descobrir isso na véspera do
lançamento é o mesmo padrão do caso Tainara: o problema só aparece quando alguém vai olhar.

---

## Carryover → Sprint 2026-W37 (14/09-27/09)

O lançamento público, que era para ter acontecido na W36, foi remarcado para a **segunda 21/09**, em
Brasília, com gravação do vídeo na casa do Fuji — o que coloca o prazo real de estar no ar em
**domingo 20/09 à noite**.

Seguem abertas, todas absorvidas pela W37:

- **`mc-038`** Checkout Mercado Pago (14h) — 🔴 em doing, ainda em branch
- **`mc-040`** Redesign com o Victor (20h) — 🟡 em doing, 12 débitos no #109
- **`mc-041`** Mapa de trilhas (8h) — 🟡 em doing, a branch com 47 commits
- **`mc-042`** App iOS com Capacitor (6h) — 🟡
- **`mc-046`** Merge train (2h) — 🔴 reescrito: é fast-forward de 5 commits, não 4 branches em conflito
- **`mc-037`** Separação de reputação de e-mail (3h) — 🔴 promovido, tem latência de DNS
- **`mc-031`**, **`mc-033`**, **`mc-022`** — carryover crônico

Abertos na W37 a partir do que esta retro encontrou: **`mc-047`** (course-progress fora do IaC,
bloqueador), **`mc-048`** (etapa 0 do Mercado Pago), **`mc-049`** (Mux público), **`mc-050`**
(unlock in-place do PalaceHub), **`mc-051`** (ligar o checkout na W38).

⚠️ **Decisão registrada em 17/09:** o checkout do Mercado Pago foi **cortado do dia do lançamento**.
Nunca processou venda real, e o modo de falha dele é a tela de compra — justamente no dia em que o
vídeo traz gente nova. O Hotmart continua vendendo como fallback, e o checkout entra na W38.
