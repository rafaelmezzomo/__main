---
name: jornada
description: >
  Gera a "jornada" de um app: uma página HTML única, local e sem rede, com o user flow em raias
  (service blueprint) no topo e as telas reais do app em sequência abaixo, num canvas com zoom e
  pan no formato de um board de design. As telas são o app de verdade em iframes, abertos num
  estado fixo por um modo ?demo=<id> que nunca grava. Use quando o Rafael pedir "jornada do app",
  "user flow com as telas", "board das telas", "visualizar o app como na Stalo", ou "/jornada".
---

# /jornada — user flow + telas num canvas

Referência pronta (ler antes de construir, para copiar o comportamento do canvas e do flow):
`~/Documents/GitHub/__main/repositories/_me/routine/journey/index.html` (jornada do Routine) e o
modo demo em `~/Documents/GitHub/__main/repositories/_me/routine/app/index.html` (`runDemo`).
Essa pasta não é versionada; se não existir na máquina, siga só a especificação abaixo.

O que o Rafael quer: uma página que mostra o user flow em raias e, abaixo, as telas reais do app
em sequência, num canvas com zoom e pan, no formato de um board de design.

## Antes de construir
1. Leia o app e liste as telas e os estados que importam (vazio, erro, carregando, modais,
   passos de um fluxo). Agrupe em 3 a 5 seções na ordem de uso real (ex.: abrir, fazer a
   tarefa principal, acompanhar, fechar). Mostre essa lista e o esboço do flow ao Rafael antes
   de codar.
2. Descubra como abrir cada tela num estado fixo sem tocar em dados reais (ver "Modo demo").
3. Diga onde a página vai morar e como abrir. Se o app tiver dado pessoal ou de cliente, a
   página fica local, sem rede, e não sobe para lugar nenhum sem ele pedir.

## Página
- Um arquivo HTML, JS e CSS vanilla, sem build e sem dependência externa, que abre por
  file:// com dois cliques. Nenhuma requisição de rede; CSP com connect-src 'none'.
- Segue claro/escuro do sistema. Tokens de cor em :root, fonte do sistema.
- Conteúdo da jornada num bloco <script type="application/json" id="journey"> (seções,
  pranchas, cards e setas do flow). Acrescentar uma prancha ou um card = uma entrada ali.

## Canvas
- Fundo neutro e um "mundo" posicionado com transform translate + scale.
- Pan arrastando o fundo ou com scroll/trackpad; zoom com ⌘/Ctrl + roda (pinça), centrado no
  cursor, entre 5% e 200%.
- Barra fixa no topo, em pílulas com blur: título "<Projeto> · jornada", atalhos de seção
  (Flow + uma por seção, cada um enquadra a seção) e controles − / 100% / + / Ajustar.
  Abre em "Ajustar". Atalhos ⌘= ⌘- ⌘0.
- Título grande do canvas com uma linha de subtítulo; cada seção tem título grande e um
  subtítulo cinza curto na mesma linha.

## User flow (topo do canvas)
- Estilo service blueprint: colunas de fase com fundo em faixa (as fases mais importantes
  num tom quente), cada uma com nome em caixa alta e uma frase do objetivo.
- Três raias com rótulo na margem esquerda: "<usuário> NA FRENTE", "LINHA DE VISIBILIDADE"
  (linha tracejada horizontal) e "BACKSTAGE" (o que o sistema faz sem o usuário ver).
- Cards com título curto em negrito e uma linha de detalhe; borda esquerda vermelha na frente,
  azul no backstage; cards "fora do app" com borda tracejada, sem fundo.
- Cards posicionados por coluna e linha (c, r) dentro da fase, em zigue-zague; as setas se
  desenham sozinhas a partir de pares [de, para, tipo, rótulo].
- Legenda no topo: vermelho = caminho principal, cinza tracejado = desvios e atalhos,
  azul = automático no backstage, pontilhado = fora do app.
- Setas ortogonais com ponta, desenhadas por baixo dos cards; desvios contornam por cima e
  pela direita; rótulos curtos com contorno da cor do fundo. Nenhuma seta pode atravessar
  card nem sobrepor rótulo: confira no screenshot e ajuste as posições.

## Telas
- Cada prancha é o app real num iframe, interativo, no tamanho de um celular (ex.: 390–430 ×
  844–900; paisagem quando a tela for paisagem), com cantos arredondados e sombra.
- Rótulo acima: código cinza (J01, J02…) + nome curto em português, ex. "J07 School · terça".
- Pranchas de uma seção numa linha, com espaço generoso; uma linha por seção.
- Iframes carregam quando ficam perto da área visível. Durante o arrasto do canvas, iframes
  ignoram o ponteiro.
- App nativo (não roda em iframe): troque o iframe por um screenshot de cada estado, gerado
  por script.

## Modo demo (o app abre no estado pedido)
- O app aceita ?demo=<id> e, depois de carregar, vai direto ao estado: aba, zoom, modal
  aberto, passo de fluxo. Use as funções que o app já tem (navegar, abrir sheet, avançar passo)
  em vez de redesenhar telas, para a jornada não desatualizar quando o app mudar.
- Dados de exemplo plausíveis, em português, só em demo.
- Demo nunca grava: nem banco, nem arquivo, nem localStorage, nem API. Sem ?demo o app fica
  idêntico.

## Verificação (antes de entregar)
- Abra a página num navegador ou Electron e confirme que todas as pranchas carregam no estado
  certo, sem erro de console e sem requisição de rede.
- Interaja numa prancha (adicionar, marcar, completar um fluxo) e confirme que nada foi gravado.
- Rode os testes do app sem ?demo para garantir que nada mudou.
- Tire screenshots do flow e de cada seção e corrija sobreposições antes de dizer que acabou.
- Diga ao Rafael como abrir e como acrescentar uma prancha.
