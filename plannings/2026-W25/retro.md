# Retro Sprint 2026-W25–W26 (15/06 - 28/06) — parcial em 25/06

> Sprint de 2 semanas (15/06–28/06). Esta retro consolida o progresso até **25/06** (quinta da W26). Tarefas ainda abertas (yp-014, yp-010, sl-006) seguem vivas até o fim do sprint.

## Métricas (parcial)
- Tarefas: 6/10 concluídas (60%) + 1 em andamento (yp-016 i18n)
- Horas: ~36h real vs 49h estimado (i18n ainda rodando, não contabilizado em real)

| Projeto | Est. | Real | Conclusão |
|---------|------|------|-----------|
| **Yang Planet** | 41h | ~25h | 5/8 (onboarding + entrada sem fricção + UX matching + interface CL + fix long polling) — **i18n (yp-016) em andamento** |
| **Clube da Memória** | 4h | ~9h | 1/1 (mc-011 fechado com sobra: 2 minigames novos) |
| **Stalo Labs** | 4h | ~2h | 0/1 (só assets de marketing) |

## Highlights por projeto

### Clube da Memória — **mc-011 fechado com sobra** 🎯
Não foi "Torre + 1" — foram **dois minigames novos** em dois dias:
- **Encaixe Sombra** (22/06) — rotação mental 3D (Shepard & Metzler), objeto grande responsivo + sombra-alvo, nota como medida de habilidade (qualidade × amostra).
- **Garçom Maluco** (23/06) — com contagem regressiva compartilhada e tela de pause reutilizável.
- Infra de arcade: kit visual reutilizável a partir da Torre, tela de pause em vez de bloquear o gesto de voltar, tela de resultado generalizada, jogos agrupados por foco cognitivo (Memória / Raciocínio / Atenção).
- Fixes: histórico do RAM filtra só sessões de RAM (minigames não poluem mais), highlight legível no light mode, header consistente nas telas da barra inferior.

### Yang Planet — fix do long polling + pivot pra i18n
- **yp-015 fechado** (22/06, PR #14): match/strategy paravam de girar pra sempre — agora superficializam a falha; backend persiste marker de falha pra o front capturar.
- **yp-016 (NOVO, em andamento):** internacionalização do GPS Carbono. **Pivot** — reverte a decisão de pt-BR-only (commit 02e6543 / yp-007). Feature grande, arquitetura no doc `2026-06-19-i18n-arquitetura.md`. Virou a prioridade do resto do sprint.
- (Semana 1, já registrado) onboarding yp-011/012, UX matching yp-013, interface CL yp-007, hardening de backend (créditos/bateria, approval gate, async match driblando o cap de 29s do API GW).
- **Não saiu:** yp-014 (loading centralizado) — empurrado pelo i18n; yp-010 (entrevista, Tiago).

### Stalo Labs — sem movimento novo
- Só os assets de growth da seg 15. sl-006 (pesquisa Hermes/Stalinho) não saiu.

## Reflexão

### O que foi bem
Memory deslanchou — dois minigames novos no mesmo par de dias fecharam o mc-011 com folga, e ainda sobrou infra de arcade reutilizável. No Yang, o bug crônico do long polling (yp-015) finalmente caiu.

### O que travou
Um pivot grande no meio do sprint: a internacionalização (yp-016) voltou a ser prioridade depois de já ter sido **descartada** (pt-BR-only). É uma feature grande e está consumindo o resto do sprint — empurrou o yp-014 pra trás. E a entrevista com usuária (yp-010) segue como carryover crônico, travada no Tiago.

### O que mudar
Bancar o pivot de i18n com foco — é a maior frente aberta e precisa fechar até 28/06. Aceitar que yp-014 e sl-006 provavelmente não saem nesse sprint. E reconhecer o padrão: a decisão de produto (drop i18n → retomar i18n) reabriu escopo grande no meio do caminho — da próxima, fechar i18n vs pt-BR-only **antes** de começar a tocar a UI.

## Em andamento / Carryover → próximo sprint
- **yp-016** Internacionalização (i18n) do GPS Carbono — *em andamento*, prioridade até 28/06
- **yp-014** Loading centralizado em /match e /strategy com tips por fase (3h)
- **yp-010** Entrevista com usuária — prep + sessão (2h) *(crônica W23/W24/W25)*
- **sl-006** Aprofundar Hermes/Stalinho — pesquisa (4h)
