# Retro Semana 2026-W24 (08/06 - 14/06)

## Métricas
- Tarefas: 4/8 concluídas (50%)
- Horas: 25h real vs 27h estimado (precisão 93%)
- Utilização: 25h / 40h disponíveis (63%)

| Projeto | Est. | Real | % Tempo | Conclusão |
|---------|------|------|---------|-----------|
| **Yang Planet** | 16h | 12h | 48% | 1/5 (IDE sem mock — objetivo macro da semana) |
| **Clube da Memória** | 7h | 8h | 32% | 2/2 (bugs v1.0 + minigame bônus) |
| **Stalo Labs** | 4h | 5h | 20% | 1/1 (Stalinho/Hermes) |

## Highlights por projeto

### Yang Planet — **IDE GPS sem mock data entregue** 🎯
O objetivo macro da semana saiu. 23 commits entre yang-gps e yang-gps-frontend (v0.6.1 → v0.9.3):
- IDE como home, project picker, pipeline visibility
- Manual mode com re-runs seletivos (analyze / match / strategy)
- Frontend integrado com endpoints reais — fim do mock data
- Backend: swap `/projects/{id}/text` → `/pdf`, in-place PDF replace, projetos persistentes
- Kill long-polling, per-agent rerun buttons, tabs como nav primário
- **Carryover (não saiu):** yp-007 interface Courageous, yp-010 entrevista, yp-011 onboarding, yp-008 conversa Breno

### Clube da Memória — bugs v1.0 + minigame bônus
- mc-009: fixes RAM (selector digitSpan, pill no header, subdomínio `ram.memoria.club` abre direto), exclusão da rodada de treino no PAL
- mc-010 (bônus 🟡, era "só se sobrar tempo"): minigame **Torre de Controle** v1 + v2 construído

### Stalo Labs — Stalinho como fork do Hermes
- sl-005: Hermes como submodule, `cerebro/` como HERMES_HOME + runtime (ADR-002)
- README com guia de instalação/uso, KB de Product-Led Growth, skill criar-carousel
- **Não planejado:** landing interativa da Stalo Labs (disc page, mobile vertical, glassy hints)

## Reflexão

### O que foi bem
Ampla execução — Yang Planet, Clube da Memória e Stalinho/Hermes avançaram na mesma semana. O foco em Yang decidido na W23 se concretizou: o IDE GPS sem mock data (objetivo macro) foi entregue com 23 commits.

### O que travou
O onboarding (yp-011, a maior tarefa da semana com 6h) ficou pra trás — todo o esforço de frontend foi pro IDE. As tarefas no-code do Yang (interface Courageous, entrevista com usuária, conversa com Breno) também não saíram.

### O que mudar em W25
Manter o foco em Yang e fechar o onboarding (yp-011) que ficou, junto com o carryover de tarefas no-code.

## Carryover → 2026-W25
- **yp-007** Definir interface GPS Carbono para Courageous Land (3h)
- **yp-010** Entrevista com usuária — prep + sessão (2h)
- **yp-011** Repensar onboarding do usuário + esconder KB no footer (6h)
- **yp-008** Conversa com Breno sobre vídeos públicos (1h)

## Tokens Claude da semana

| Projeto | Input | Output | Cache | Total |
|---------|-------|--------|-------|-------|
| Yang Planet | 15.9k | 991.4k | 394.3M | 395.3M |
| Clube da Memória | 8.4k | 569.8k | 86.6M | 87.1M |
| Stalo Labs | 805 | 166.5k | 18.7M | 18.9M |
| outros | 9.5k | 765.4k | 120.4M | 121.2M |
| **Total** | **34.6k** | **2.5M** | **620.0M** | **622.5M** |

*63% do consumo foi no Yang Planet — inverteu a W23 (onde Yang foi ~1%) e bate com o foco da semana.*
