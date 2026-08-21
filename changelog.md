# Changelog Diário

## 2026-08-21 (sexta)

### Stalo Labs — `stalolabs-MOAI` (branch `feat/granola-listing`, commits `b55e793` e `8d84b70`, sem push)

**Auditoria de custo de LLM (`cockpit-llm-logs`, us-east-1, `--profile stalolabs`):**
- 57 chamadas / 14 dias: US$ 2,88 · 2,76M tokens de input · 23k de output · 1 erro (12/08, sem crédito na Anthropic)
- Tudo em Haiku 4.5 — Sonnet nunca foi usado em prod
- **99,2% do custo é input.** Output são 23k tokens no total: a conta é inteiramente "reenviar transcript"
- Por skill: `resumir-reuniao-ato` US$ 1,95 (29 chamadas) · `extrair-empresas` US$ 0,72 (12) · `resumir-reuniao` US$ 0,16 (3) · `gerar-encaminhamento-cs` US$ 0,06 (13)
- Causa estrutural: num conselho de 4h30 o transcript (~87k tokens) é mandado **9 vezes** — 1× pra `extrair-empresas` + 8× pra `resumir-reuniao-ato`, um agente por empresa

**Prompt caching no `resumir-reuniao` (a correção):**
- `blocoUserMsg()` deixou de devolver string e passou a devolver **dois blocos de conteúdo**: `[0]` resumo do Granola + transcript (com `cache_control: ephemeral`), `[1]` empresa · roster · escopo · pedido do JSON. O cache casa por **prefixo**, então o nome da empresa — que antes aparecia no meio da mensagem, no `escopo` — teve que ir pro fim
- O `system` (SKILL.md) renderiza antes das mensagens e entra no prefixo cacheado sem custo extra
- **A primeira empresa passou a rodar sozinha, de propósito:** o cache só fica legível depois que a primeira resposta começa, então o `Promise.allSettled` de N faria as N pagarem o prompt inteiro. Virou `1 gravação → (N−1) leituras em paralelo`. Custa ~7s de latência a mais
- Cache **só liga com N > 1** (`empresas.length > 1`): gravar custa 1,25× o input, então numa empresa só seria 25% de prejuízo. `/api/resumir` (bloco único) segue sem cache
- Espelhado nos dois runtimes (`vite.config.ts` e `lambdas/resumir/index.mjs`), como manda o invariante do núcleo puro

**Contabilidade de tokens (o efeito colateral que quase passou):**
- Com cache ligado, `input_tokens` da API passa a ser só o **resto não-cacheado**. Sem mexer no cálculo, o contador do CX mostraria ~500 tokens num conselho de 145k e o custo apareceria ~60% menor do que a economia real
- `models.ts`: `costOfUsage()` / `promptTokens()` / `usoDe()` + `CACHE_WRITE_MULT` (1,25) e `CACHE_READ_MULT` (0,1). `costOf()` (que só somava in/out) foi removido e os 4 call sites do front migrados
- Lambda: `custoUsd()` passou a receber o objeto `usage` inteiro; telemetria agora grava `cache_write_tokens` e `cache_read_tokens` em `cockpit-llm-logs`

**Verificação (medida, não estimada):**
- End-to-end no middleware dev, 4 empresas, transcript de 92k chars: `input=550 · cache_write=38.148 · cache_read=114.444 · output=412`, 4/4 empresas ok → 1 gravação + 3 leituras, **60% de economia** nesse cenário
- Com 8 empresas e o ratio real (output minúsculo perto do input) fica em **~70%**: `resumir-reuniao` sai de US$ 0,70 pra ~US$ 0,21 por conselho; o conselho inteiro de ~US$ 0,83 pra ~US$ 0,35
- `/api/resumir` (bloco único) testado: 5 campos corretos e zero tokens de cache, como esperado
- `tsc --noEmit` limpo, `vite build` limpo, `node --check` na Lambda OK

**Bug lateral corrigido:** a Lambda não mandava `temperature: 0` — só o `resumir-core.ts` mandava. Prod estava rodando com o default da API, violando o invariante documentado de que "dev e prod resumem idêntico". Alinhado.

**UX do cockpit — as 5 fricções dos CSs (commit `b55e793`):**
- **Home** era só uma barra de busca que não listava nada sem filtro, com a lista do Granola atrás de um botão no canto. Virou duas abas abrindo em "Reuniões", com a lista inline (`GranolaLista`, extraída do dialog); a aba "Conselhos" mostra o histórico sem exigir filtro
- **Fim do wizard:** o CTA da lista cria o conselho e navega direto (`registrar-conselho.ts`, um só lugar pros dois caminhos). Tipo, conselheiro, CS e modelo de ata foram pras propriedades da página, que se auto-salvam com debounce de 800ms. De ~6 cliques pra 2
- **Revisão sem sanfona:** os 5 campos ficam todos abertos em textareas que crescem (`AutoTextarea`) e o CTA confirma a empresa inteira — de ~40 cliques por conselho pra 1 por empresa. A tela de confirmação das empresas também passou a listar todas de uma vez
- **Feedback de cópia:** `ToastProvider` próprio (sem dependência nova). Toda cópia termina em aviso, **inclusive a que falha** — antes `copyText` devolvia `false` e não acontecia nada na tela
- **PDF no lugar do `.md`:** `window.print()` sobre um documento dedicado (`resumo-imprimivel.tsx` + `@media print`), da empresa ou do conselho inteiro. O `.md` (frontmatter YAML, serve pra versionar ata) foi pro menu "⋯"
- Da carta da Luana (19/08) entraram só os itens de jornada: senha do time persiste em `localStorage` com "Sair" nos Ajustes, e o encaminhamento virou editável/persistido (`Empresa.encaminhamento`) com seletor dos 4 formatos da skill
- Sidebar colapsável no desktop (faixa de 48px, **no fluxo**, nunca `fixed`) e, no mobile, o título saiu de baixo do botão de menu

**Bug do erro invisível:** `gerarResumos` setava `status='resumos'` **antes** do `setErro`, então o estágio desmontava e o banner nunca aparecia — com a chave sem crédito o CX caía numa tela de resumos vazia sem explicação. Agora só avança se ao menos uma empresa voltou ok.

**Regressão própria, corrigida na mesma leva:** matar o wizard deixou o modelo de ata inalcançável (todo conselho da lista nascia no padrão). Voltou como dialog de confirmação antes de gerar, e **trava** a partir de `resumos` — `CAMPOS` e `CAMPOS_ATO` não compartilham nenhum id, então trocar depois esconderia as notas e um "Re-transcrever" (`e.notas = {}`) as apagaria de vez.

**Recall do resumo — o bloco se acha pela PESSOA, não pela empresa (commit `8d84b70`):**
- Sintoma: 4 das 8 empresas de um conselho real voltaram vazias. Não era dado faltando — **duas rodadas do mesmo transcript, mesmo modelo, deram resultados diferentes pra mesma empresa**
- Causa numa frase do `blocoUserMsg`: *"Encontre e use SÓ o trecho da empresa X. Se ela não aparecer, retorne os N campos vazios."*
- Medido no transcript (964 falas): **"Reproduzindo Talentos" aparece 0 vezes**, EcoFesta 2, Estalo Leves 1 — enquanto Alan aparece 20, Marcela 9, Wellington 5. Ninguém diz razão social numa reunião. O agente procurava a empresa, não achava e **obedecia**. As 4 empresas que nunca falharam eram as com a pessoa bem citada
- Correções: (1) localizador vira o roster, com aviso de que a empresa pode não ser citada; (2) o resumo do Granola vira **ÍNDICE** e não "contexto de apoio" — ele já vem `### Marcela: Escala 6x1 e NR1 Psicossocial`, um mapa pronto de quem apresentou o quê; (3) os timestamps, que vinham **todos iguais** (964 segmentos, 1 valor distinto → `[00:00:00]` em toda linha), viram âncora `[#n]`; (4) o prompt avisa que os falantes vêm anônimos (`Speaker A`…`I`)
- **Verificado rodando contra o transcript real**, mesmo Haiku e mesmo `ataModelo: 'ato'`: Reproduzindo Talentos 0 → 4 campos, EcoFesta 1 → 4, Dinamismo 4 → 5. **De 4/6 blocos pra 6/6.** Estalo Leves e MOAI seguem vazias e está certo — o índice do Granola lista 6 apresentações e nenhuma é deles
- Conteúdo conferido contra os fatos do resumo (340 leads, R$4k de fixo, supervisor a R$9k, ClickUp) — não é preenchimento inventado. Custo do teste: **US$ 0,15**

**Debug do Granola (dados medidos, úteis pra próxima):**
- Reunião `not_RDN1CTxRb8Katj` "MOAI: Conselho Marcos Cunha": 173k chars, 964 falas, **~43k tokens**, 9 vozes
- **Diarização existe mas é anônima:** `Speaker A`…`Speaker I`, todos `source: microphone`, nenhum com `name`. Confirma o item 1 da carta da Luana — só o gravador resolve, não é problema de prompt
- **Vocabulário do modelo ATA 2 ato não existe na reunião:** "big deal" 0 ocorrências, "ponto forte" 0, "poderia melhorar" 0, "feedback" 1. Por isso `bigDeal` volta vazio em quase todas — é o modelo de ata errado pro rito Fast Track, não falha de extração

### Decisões / Notas
- **O `.env` local aponta pro middleware do Vite, não pra produção:** `VITE_API_BASE` vazio → mesma origem; o CRUD dev grava em `.conselhos-dev.json` (gitignored) e não existe caminho de DynamoDB no `vite.config.ts`. Testar em localhost **não** toca o banco do cliente. O que é real em dev: as chamadas pagas à Anthropic e a leitura da conta de serviço do Granola
- `extrair-empresas` (US$ 0,72 no período) fica **sem** cache de propósito: roda com um SKILL diferente e é chamada única, então não compartilha prefixo com ninguém — cache ali seria só o custo de gravação
- Mínimo cacheável do Haiku 4.5 é **4096 tokens** (não 1024 como nos modelos Opus/Sonnet). Prefixo menor não cacheia e não dá erro — o `cache_creation_input_tokens` só volta zero
- AWS CLI: perfil `stalolabs` estava sem região; setado `us-east-1` (onde vive o stack `cockpit-moai`). Conta 662212752492, user `stalolabs-cli`
- `cockpit-llm-logs` tem TTL de 90 dias — é telemetria de protótipo, não arquivo histórico. Auditoria de custo tem que ser feita dentro dessa janela
- O trabalho de caching acabou entrando junto com o de UX nos commits `b55e793`/`8d84b70`: os dois mexem nos mesmos arquivos (`resumir-core.ts`, `index.mjs`, `Arquitetura.tsx`) e separar deixaria commit que não builda

## 2026-08-20 (quinta)

### Clube da Memória — `memory-club` (branch `release/v1.4.1-growth`, commits locais, sem push)

**Higiene de dados: telemetria vs teste cognitivo (commits `658d96f` e `1d471b4`):**
- Investigação partiu de 6 `ram_test_done` no `app-events` sem linha nova na `ram-sessions`: era o treino diário emitindo os mesmos nomes de evento do teste RAM real, diferenciando só por `props.source` — invisível no GSI `byDay`, que não projeta `props`
- `658d96f`: `DailyGameRunner` agora emite `daily_game_start`/`daily_game_done` em vez de `ram_test_*`. Forward-only; antes de 2026-08-20 os `ram_test_*` misturam teste real e treino
- `1d471b4`: os três leitores da `ram-sessions` checavam `gameType === 'ramCompleto'`, mas a tabela sempre gravou `'ram_completo'` (`RamHistoryContent.tsx`, `apiService.ts`, `admin-api/index.mjs`). Leitura alinhada ao dado; nenhuma escrita ou migração
- Verificada a separação prova × treino: RAM Score só entra na `ram-sessions` pelo fluxo do teste real (mesmo quando o slot do dia é o RAM); score de miniteste do treino fica no `progress-daily-training`; minigames na `minigame-sessions`

**⚠️ Ficar atento após o deploy (possíveis bugs pra alguém):**
- Filtros/funis salvos no Clarity que usem `ram_test_start`/`ram_test_done` param de contar o treino diário (é o desejado, mas séries vão cair) — conferir se algum dashboard depende disso
- O ponto diferenciado de "bateria completa" no histórico (`isFullRam`) passa a aparecer pra quem tem sessão `ram_completo` — 3 usuários afetados, conferir se a curva renderiza bem com o ponto novo
- A lambda `admin-api` precisa de deploy junto com o front; se só o front subir, o cockpit segue contando `ram_completo` pelo fallback `ramScore != null` (funciona, só fica inconsistente)
- Análises ad hoc por dia no `app-events`: emendar `ram_test_*` (pré-20/08) com `daily_game_*` (pós) antes de comparar série de treino

### Decisões / Notas
- 68 linhas legadas de minigame (19–26/06) dentro da `ram-sessions` ficam onde estão: todos os leitores filtram por `gameType`/`ramScore`, só documentado (CLAUDE.md do memory-pulse `d702954`)
- Consultas de operação agora vão direto no DynamoDB (`--profile rafaelmezzomo`, us-east-2): ~5x mais barato e ~3x mais rápido que ler o cockpit pelo browser; GA4 segue só via cockpit (WIF sem chave estática, decisão de manter)

## 2026-08-18 (terça)

### Clube da Memória — `memory-club` + `memory-pulse`

**Caso Tainara (CX ao vivo):**
- Usuária fez as 3 fases do RAM em 11min e travou no gate: código de login enviado e nunca visto; reenvio aos 32s caiu no cooldown de 5min do servidor com a UI dizendo "reenviado" sem enviar nada
- Resultado dela recuperável: o gate salva tudo em `localStorage['ram_session']` (sem TTL) antes do login — email de resgate enviado do Gmail pessoal com o caminho "Entrar com Google"
- Varredura achou o 2º caso: `marcelo@aristeuonline.com.br` (13/08), domínio NXDOMAIN — SES contou Send sem Delivery, sem bounce, sem alarme
- Aprendizado registrado (memória + planning): resultado do usuário se grava antes do gate, nunca depois → mc-026/027/028

**Mailer de CX (`./mailer` no memory-pulse, gitignored):**
- Templates JSON na voz do Clube (revisada com tom "Oi X, tudo bem?"), render HTML igual aos transacionais, guardas (dry-run default, dedupe, destinatário precisa existir no Cognito), ledger local + espelho na tabela `cx-emails` (criada hoje)
- Enviados: #004 nickolassouza23 e #005 vilacaduds (template treino-de-hoje); CTA corrigida pra `/academia` nos próximos

**Memory Pulse (commits `ce01d8e` no memory-club, `0145f65` no memory-pulse):**
- Rota `GET /admin/emails`: todo envio do SES numa lista (transacionais via logs de auditoria + CX via `cx-emails`), aba Emails com busca, filtro automático/CX e accordion com corpo + link 360
- Rota `GET /admin/product` + aba Produto v2: período livre (presets + datas, dias em BRT), séries padronizadas em usuários únicos, primeiro RAM nominal, minigames por jogo com score médio, treino do Palácio por baralho, associações PO, treino diário real (carimbos por slot do `plays` — melhor que o proxy de 48h)
- Fix de fuso que deslocava os gráficos em 1 dia (front pedia período em UTC + `fmtDate` parseava dia puro como meia-noite UTC)

### Decisões / Notas
- Descoberto que `plays[slot].lastPlayedAt` existe no `progress-daily-training`: "quem treinou hoje" agora é real
- 13 usuários fizeram RAM na semana e os 13 eram primeiro teste (zero recorrentes) — dado a acompanhar
- Sessões de RAM gravam `durationMs = 0`; o cockpit mostra 0s honesto em vez de fallback
- Plano aprovado da skill de exceções (11 detectores E1-E11) ficou pendente de implementação → mc-031

## 2026-08-09 (domingo)

### Clube da Memória — `memory-club` (17 commits)

**Modo PRO + Hotmart (kickoff do lançamento de 3ª feira):**
- Gate server-side `member-pro` no Palácio da Memória + capítulo Hotmart
- Badge PRO no header (preto) + página `/pro` com os benefícios
- Planning em cima da API do Hotmart: leitura completa da API, definição do fluxo de venda (comprar → role `pro` no Cognito), espelhar dados do Hotmart localmente, e migração dos ~80 alunos já pagantes para PRO
- Retomada da planning de risco de cópia dos jogos: mover lógica sensível pra server side

**RAM Score / Stats:**
- Redesenho da página de stats focada no RAM Score; pill do header com ícone de cérebro e tokens de tema
- Revisão de resultado antigo pelo histórico funciona de ponta a ponta (busca sessão pelo id da URL)
- Cor do gráfico ajustada de amarelo pro roxo da marca; clicar no score leva pro detalhe do resultado

**Jogos / Navegação:**
- Homes de jogo (`/cartas`, `/numeros-jogo`) com título e MainNav; home do Números Livre no estilo do Cartas (sem streak semanal)
- Aba Palácio abre direto na trilha de Cartas; hub vira mini item no header; título "Aprendendo o Palácio da Memória" no topo da trilha
- Leque do Cartas mostra 3 cartas válidas da fase com rank novo na frente; aba Ranking no histórico do Speed Cards; cérebro de progresso como ícone das fases do Números
- Fixes mobile: editor deslocado no eixo x, chip do castelo quebrando linha, pause do Encaixe-Sombra centralizado

### __main
- Nova prioridade na sprint atual: ver certificado digital do Memory Club

### Decisões / Notas
- Lançamento definido: 3ª feira (2026-08-11) sai o primeiro vídeo compartilhando o app, já pronto pra vender — o essencial é habilitar o modo PRO no Cognito após pagamento; cancelamento fica pra um segundo passo
- Credenciais do Hotmart guardadas como env vars na AWS (nada salvo localmente)

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
