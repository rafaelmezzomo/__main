# Changelog Diário

## 2026-06-04 (quinta)

### Clube da Memória — `memory-club` (5 commits, branch `release/v1.0-unificacao`)

**Daily Training backend + home polish (Planos #40, #41, #42):**
- Backend sync cross-device do treino diário com 2 lambdas novos (`get-daily-training-progress` + `post-daily-training-progress`) sobre DynamoDB `progress-daily-training` (PK userId, plays como map aninhado)
- `apiService` ganha `getDailyTrainingProgress` + `postDailyTrainingComplete`; `dailyTraining.js` agora tem `recordCompletionRemote` e `syncDailyTrainingFromServer` que reconciliam local ↔ server no login
- Lambdas criadas, IAM policies, recursos criados no API Gateway `ram-score` (`ima1zyk1j2`) com GET/POST + OPTIONS + Cognito authorizer. Validado em produção (cross-device sync funcionando)
- Fix de race condition em `getRamScore` que lia `idToken` do localStorage antes do write — agora usa `authService.getIdToken()` (lê do OIDC user store)
- Remove gate `if (!hasRam)` em `HomePage` que forçava "RAM Score primeiro" mesmo com daily training sincronizado (Plano #41)
- Bottom nav: aba "Perfil" → "Stats" (abre HistoryDrawer com radar + bars + evolução). Ícone de Preferências volta no header mobile. RAM pill escondido no mobile (acesso via Stats)
- Dossiê competitivo do Impulse Brain Training recuperado de sessão anterior do Claude Code e arquivado em `Plannings/#42` (research extraído do log da conversa, nunca tinha sido salvo em disco apesar do log dizer que sim)

**Light mode fix em telas de resultado (Plano #39):**
- Resultados de jogos (Stroop, SART, Token Search, Digit Span, Feature Match, PAL), RAM Score final e History Drawer ficavam com fundo cinza escuro em light mode
- Causa raiz: SART aliases (`--bg-surface`, `--bg-surface-highlight`, `--border-subtle`, etc.) só definidos em `:root` com literais `rgba(255,255,255,...)` e cadeias `var()` que não re-resolviam consistentemente em `body.light`
- Adicionados blocos explícitos `body.light` e `body.dark` em `tokens.css` redefinindo todos os aliases
- Body theme class agora gerenciado globalmente em `App.jsx` (era só em `HomePage` e `ChatFlow`); reloads em `/ram` ou `/treino-diario` mantêm o tema correto
- `RamFinalResults` weight modal: `#1a1a1a` hardcoded substituído por `var(--mc-surface-2)`

**Treino Diário: sequência fixa semanal (Plano #38):**
- Card refatorado: 1 linha de 7 bolinhas (era 2 linhas de 14), sequência fixa em vez de jogo aleatório por dia
- Ordem semanal: Stroop → PAL → Feature Match → Digit Span → Token Search → SART → RAM (slot 7)
- Bolinha pintada é clicável → modal "Refazer X?" — replay incrementa `plays[N]` sem mexer em `completedSlots`
- Catch-up natural: user pode jogar slots pendentes em sequência no mesmo dia
- Novo módulo `dailyTraining.js` centraliza sequência, helpers (`getWeekSlots`, `recordCompletion`) e schema localStorage `{ completedSlots, lastCompletedAt, plays }`
- Schema antigo (`completedDays/lastCompletedDate`) é descartado silenciosamente na 1ª leitura
- TestSimulator atualiza `daily_training` idempotentemente ao concluir RAM (cobre acesso via card ou via `/ram` direto)
- HomePage usa `gameIdForSlot` pra decidir entre `DailyTrainingCard` e `RamScoreCard variant="retake"`
- Anexo no plano #38: PM-spec de backend (tabelas `user_daily_training_progress` + `_plays`, endpoints, sync strategy)

**Auth flow fix — login preserva URL de destino (Plano #37 Fase 1):**
- `AuthenticatedApp` agora salva `pathname+search` em `sessionStorage.post_login_redirect` antes de `signinRedirect()`. User clica "Acessar App" → login → volta pra `/academia` (não landing). Deep links (`/digit-span` etc.) voltam pra URL exata.
- `TestSimulator` auth gate: `post_login_redirect = '/ram'` (era `/`). Quem compartilha `memoria.club/ram` e loga no final volta pra home do RAM, não landing.
- Plano #37 cobre também Fase 2 (subdomínios `app.memoria.club` + `ram.memoria.club`) — no backlog, envolve Amplify + Cognito + DNS.

**Palace flashcard overlay polish:**
- Recall header alinhamento (`flex-start` com `margin-left: auto` nas actions)
- Flip button agora também visível no verso do card
- Progress nav centralizado dentro do max-width

## 2026-06-01 ~ 2026-06-02 (domingo/segunda)

### Clube da Memória — `memory-club` (7 commits, branch `release/v1.0-unificacao`)

**Clarity Analytics redesign (42 eventos):**
- 16 eventos renomeados para convencao `{area}_{action}`, props padronizadas
- 26 novos: landing (CTA, section views, FAQ), navegacao, abandono, level-up, Palace, RAM Score, settings

**HomePage Academia redesign:**
- Streak badge no DailyTrainingCard, game cards com gradiente verde-celeste
- Bottom nav mobile (Inicio/Palacio/Perfil), settings escondido no mobile
- Loading spinner durante fetch do RAM Score
- Header fixed com margin-top no content, centralizado no desktop

**Fix sistemico de icon buttons:**
- `mc-btn--icon` com especificidade alta (40x40, padding 0)
- Aplicado em trophy, share, settings, back em 8+ arquivos
- Footer digit-span: `:not(.mc-btn--icon)` pra nao inflar icon buttons
- Palace expand/flip/recall OK: CSS proprio self-contained

**Modals e popups:**
- History modal: backdrop overlay, close on click outside, fix width overflow mobile
- Preferences modal: X alinhado a direita

**Migracao SART → memory-club:**
- 6 planning docs (#31-#36): RAM-COMPLETO, Feature Match PRD, PAL PRD, Medical View, Backend V1, Prompt Refactor
- 12 papers academicos + analises (Stroop, Feature Match, CANTAB, etc.)
- 5 docs tecnicos por teste (sart, tokenSearch, digitSpan, ramScore, STABILITY_METRIC)
- ARCHITECTURE-SART.md e PROJECT-SART.md
- 3 lambdas: ram-get-sessions, ram-get-session-detail, ram-post-session
- Rotas sem auth: /docs, /ram-completo, jogos individuais (/tokenSearch, /sart, etc.)
- DocsPage layout fix (display:block no .content, fixed overlay)

**CSS fixes diversos:**
- `.card` legacy restaurado com reset pra poker cards (nao vazar background cinza)
- Digit ordering grid: minmax pra nao estourar mobile
- RAM pill: fit-content, padding reduzido
- Speed cards: sticky header posicionado abaixo do logo (top: 73px)

**TODO:** Jogos individuais standalone (ex: /digitSpan) renderizam tela preta, funcionam apenas via /ram ou /ram-completo

---

## 2026-06-01 (domingo)

### Clube da Memória — `memory-club` (2 commits, branch `release/v1.0-unificacao`)

**Clarity Analytics redesign (42 eventos):**
- Renomeou 16 eventos existentes para convencao padronizada `{area}_{action}` (ex: `signed_in` → `auth_login`, `finish_memorizing` → `cards_memorize_done`)
- Fix typo `show_porgress_history` → `ui_history_open`
- Props padronizadas: `timeMs`, `correct`, `digitCount`
- 26 eventos novos: landing page (CTA clicks, section views via IntersectionObserver, FAQ, social), navegacao (page views, game switch), abandono de jogo, level-up, Memory Palace (onboarding, entry save, recall), RAM Score (start, test lifecycle, completion, history), settings (theme)

**HomePage Academia redesign:**
- Streak badge (fogo + dias) no card Treino Diario
- Game cards estilizados: gradiente verde-celeste, digits inclinados preto/vermelho com box-shadow, botao JOGAR amarelo pill
- Bottom nav mobile (Inicio/Palacio/Perfil), settings escondido no mobile
- Fix sistemico de icon buttons: `mc-btn--icon` com especificidade alta (40x40, padding 0), aplicado em trophy/settings/back buttons em 5+ arquivos
- Palace button (castelo) movido inline com Memorizar + trophy, CSS legado `username-icon-btn` removido
- Recall OK button e expand button com CSS proprio (nao herdam mc-btn)
- Secao renomeada para "palacio da memoria"

---

## 2026-05-28 (quarta)

### Yang Planet — `yang-gps` (2 commits)
- **PRD: Email allow-list no sign-up** — Cognito Pre-SignUp Lambda trigger com DynamoDB (`yang-gps-allowlist`), suporte a email exato e domínio, 3 endpoints novos em `/admin/allowlist`, cobertura de email/password e Google IdP. Inclui plano de rollout com grandfather script para membros existentes
- **IDE docs** — documentação do IDE mode

### Clube da Memória — `memory-club` (4 commits, branch `release/v1.0-unificacao`)

**RAM Score conversacional (experimentação + rollback):**
- `RamChatFlow` — UI conversacional onde tutorial é entregue como mensagens de bot, games abrem em fullscreen overlay, fases completadas mostram result cards clicáveis. Progress indicator R·A·M com 3 fases
- Melhorias gerais na experiência de chat
- **Rollback**: rota `/ram` voltou para TestSimulator (fluxo de produção). RamChatFlow mantido no código

**Homepage (`/academia`) redesenhada com 3 estados:**
- **Sem RAM Score**: card grande "RAM Score" com animação zoom-in que navega para `/ram`
- **Com RAM Score, treinando**: card "Treino Diário" com grid de bolinhas (2 semanas/13 dias + 1 RAM), streak visual por mês, descrição do desafio do dia, CTA amarelo
- **13 treinos completos**: bolinha RAM acende, CTA "Refazer RAM Score"
- RAM pill no header (direita, ao lado de preferências) abre HistoryDrawer
- Label "palácio da memória" acima dos cards de jogos (Cartas + Números)

**Componentes criados:**
- `RamScoreCard` (variantes: first/retake, animação zoom-in)
- `DailyTrainingCard` (grid de dots, streak mensal, localStorage persistence)

**Outros ajustes:**
- Fix duplicação de sessão no banco (guard ref em saveAndShowResults)
- Botão "Ver resultado completo" no HistoryDrawer (fetch snapshot da API)
- Header unificado com padrão do StartScreen (logo esquerda, settings direita)
- Botão "Continuar →" fixo no bottom da tela de resultados com gradient fade

### Stalo Labs — `stalolabs-meetings` (2 commits)
- **v0.3.5**: fix ffmpeg PATH no app empacotado (faltava `/opt/homebrew/bin`) + race condition onde `finalizeTranscript` retornava antes dos chunks terminarem
- **v0.3.6**: diagnostic logging + health check no startup — verifica ffmpeg e whisper no boot, logs step-by-step em `transcribeChunk`

---

## 2026-05-27 (terça)

### Yang Planet — `yang-gps-frontend` (6 commits)
Desenvolvimento completo do **IDE Mode v0.6.0** — view estilo VSCode para estruturação de projetos:
- **IDE Mode base** — toggle Report/IDE no AnalisePage (quando status = `matched`), editor com section cards (Overview, Financial, Technical, Compliance, Legal, Impact), validação client-side, star/tier progression (Bronze→Diamond)
- **Matching tab** — fund matches com tier badges, instrument fit, score %. Dropdown expandível com detalhes de cada match
- **Strategy tab** — recommended fund, alternatives, blended capital stack, WACC card, compliance roadmap
- **Split editor** — contentEditable rich text view ao lado do editor estruturado
- **IDE como overlay fixo** — removeu sections sidebar, IDE virou fixed-position overlay com rich text editor + agent panel redimensionável
- **Full viewport** — report header hidden em IDE mode, IDE ocupa viewport inteira

### Stalo Labs — `stalolabs-growth` (1 commit)
- **Decks for prospects** — material de apresentação para prospecção de clientes

---

## 2026-05-26 (segunda)

### Clube da Memória — Protótipos de redesign conversacional
- **Protótipo v2** (`prototype-homepage-v2.html`): homepage com companion AI (🧠), speech bubbles, challenge cards gamificados, path horizontal, game tiles com achievements
- **Protótipo v3** (`prototype-homepage-v3.html`): fluxo progressivo conversacional — conteúdo aparece conforme o usuário interage. Simula: onboarding → RAM Score → path de treinos → victory overlays → desbloqueio de reteste → Palácio da Memória. Clicável para testar toda a jornada
- **Protótipo v4** (`prototype-homepage-v4.html`): scroll unificado — chat se transforma no app. Sticky header (logo + RAM pill + path) gruda no topo após RAM Score. Histórico de chat acessível rolando pra cima. Bot fab 🧠 no canto. Epic victory com contagem animada + triângulo comparativo. Path selection para Palácio da Memória (Cartas vs Números)
- **Decisão**: homepage vai mudar de dashboard para experiência conversacional com companion AI, conteúdo revelado progressivamente. Após onboarding, vira app com sticky path + bot acessível

---

## 2026-05-25 (domingo)

### __main (Central de Planejamento)
- Criada a central de planejamento semanal na pasta `__main`
- Definido sistema de prioridades Eisenhower (🔴🟡🟢⚪) e budget de 40h/semana
- Criado `projects.json` com registry dos 3 projetos (Yang Planet, Stalo Labs, Clube da Memória + SART)
- Criados scripts `generate.sh` e `stats.sh` para gerar markdowns e estatísticas cross-semanas
- Criadas skills: `/planning`, `/retro`, `/daily-log`
- Criado board visual Trello-like (`__planning-layout/index.html`) com drag & drop, filtros por projeto, modal de detalhes, changelog panel e persistência via localStorage
- Retro W21 completa: 17/17 tarefas, 53h reais vs 40h budget (133%)
- Planning W22 definida: 40.5h — Yang Planet 22.5h, Clube da Memória 16h, Stalo Labs 2.5h
- Repos movidos para `repositories/`, scripts atualizados

### Clube da Memória — Homepage v1.0 (branch `release/v1.0-unificacao`)
- **RAM Score donut badge**: substituiu banner horizontal por anel SVG centralizado (proporcional ao score/1000), clique abre popup de histórico
- **HistoryDrawer redesign**: radar chart (chart.js) com triângulo R/A/M, gráfico de evolução (d3), accordion em 2 níveis (item → radar + barras de dimensão → breakdown de pesos por teste)
- **RamRadarChart**: componente portado do sart, react-chartjs-2 Radar com labels R/A/M
- **Training Path horizontal**: 13 nós (RAM → 5 minigames → RAM → 5 minigames → RAM), scroll lateral com scrollbar invisível, D3 com gradientes coloridos, auto-scroll para nó atual
- **Layout mobile-first**: hero + donut sempre side-by-side (flex), donut 80px mobile / 120px desktop, game cards 50/50 grid, overflow-x controlado
- **Label dinâmico**: "Dia N: Treino de [tipo]" baseado no nó atual
- **Redux slice**: `trainingPath` com persistência localStorage, lógica de unlock (RAM só libera após 5 minigames)
- **3 commits**: `99cd76a`, `fa03227`, `e566704`

### Decisões
- Planning semanal deve ser high-level (overview) primeiro, sem entrar em detalhes de implementação
- Retro e planning sempre salvam versão consolidada na raiz do `__main`
- Formato JSON + Markdown para plannings (JSON para dados, MD para leitura)
- Declaração de IR adicionada como task crítica para terça (Yang Planet + Clube da Memória)
