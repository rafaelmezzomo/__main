import { useEffect, useMemo, useState } from 'react'
import { APIProvider } from '@vis.gl/react-google-maps'
import MapView from './components/MapView'
import RoutePanel from './components/RoutePanel'
import RiskSlider from './components/RiskSlider'
import TripPicker from './components/TripPicker'
import { useDirections } from './hooks/useDirections'
import { useRiskScoring } from './hooks/useRiskScoring'
import { minMax, formatDuration } from './lib/geo'
import {
  placeById,
  DEFAULT_ORIGIN_ID,
  DEFAULT_DEST_ID,
  DEFAULT_RISK_WEIGHT,
  ROUTE_BEST_COLOR,
} from './config'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const GRAYS = ['#8A95A6', '#B0B8C4', '#C8D0DA', '#D5DBE4']

function Header() {
  return (
    <header className="app-header">
      <p className="eyebrow">Mobilidade urbana · São Paulo · Rota segura</p>
      <h1>Pela rota de menor risco</h1>
      <p className="lede">
        O Google Maps otimiza só <b>tempo e distância</b> — e às vezes te espreme entre
        comunidades pedindo pra “cortar caminho”. Aqui as rotas são <b>reais</b> (Directions
        API), mas re-ranqueadas por <b>risco</b> usando dados da SSP-SP por distrito. Escolha o
        trajeto e arraste o controle entre tempo e segurança.
      </p>
    </header>
  )
}

function SetupNotice() {
  return (
    <div className="app">
      <Header />
      <div className="card map-missing" style={{ minHeight: 280 }}>
        <div className="box">
          <h2 style={{ marginBottom: 12 }}>Falta a chave do Google Maps</h2>
          <p className="lede" style={{ marginBottom: 12 }}>
            Crie uma chave no Google Cloud (Maps JavaScript API + Directions API, com billing
            ativo), copie <code>.env.example</code> para <code>.env.local</code> e preencha:
          </p>
          <p>
            <code>VITE_GOOGLE_MAPS_API_KEY=sua_chave</code>
          </p>
          <p className="lede" style={{ marginTop: 12 }}>
            Depois rode <code>npm run dev</code> de novo.
          </p>
        </div>
      </div>
    </div>
  )
}

function RotaApp() {
  const [riskWeight, setRiskWeight] = useState(DEFAULT_RISK_WEIGHT)
  const [originId, setOriginId] = useState(DEFAULT_ORIGIN_ID)
  const [destId, setDestId] = useState(DEFAULT_DEST_ID)
  const [selected, setSelected] = useState(null)
  const [geojson, setGeojson] = useState(null)
  const [riskIndex, setRiskIndex] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/sp-districts.geojson').then((r) => r.json()),
      fetch('/risk-index.json').then((r) => r.json()),
    ]).then(([geo, risk]) => {
      setGeojson(geo)
      setRiskIndex(risk.index || risk)
    })
  }, [])

  const origin = placeById(originId)
  const destination = placeById(destId)

  const { routes, status } = useDirections(origin, destination)
  const { scored } = useRiskScoring(routes, geojson, riskIndex)

  // Ranqueia por custo ponderado. A recomendada é sempre o rank 0 (menor custo).
  const ranked = useMemo(() => {
    if (!scored.length) return []
    const nt = minMax(scored.map((s) => s.seconds))
    const nr = minMax(scored.map((s) => s.riskScore))
    const withCost = scored
      .map((s, i) => ({ ...s, cost: (1 - riskWeight) * nt[i] + riskWeight * nr[i] }))
      .sort((a, b) => a.cost - b.cost)
    let g = 0
    return withCost.map((s, rank) => {
      const isBest = rank === 0
      return {
        ...s,
        isBest,
        color: isBest ? ROUTE_BEST_COLOR : GRAYS[Math.min(g++, GRAYS.length - 1)],
      }
    })
  }, [scored, riskWeight])

  const insight = useMemo(() => {
    if (!ranked.length) return null
    const rec = ranked[0]
    const fastest = [...scored].sort((a, b) => a.seconds - b.seconds)[0]
    const safest = [...scored].sort((a, b) => a.riskScore - b.riskScore)[0]
    const extraMin = Math.round((rec.seconds - fastest.seconds) / 60)
    return {
      rec,
      fastest,
      extraMin,
      sameAsFastest: rec.index === fastest.index,
      sameAsSafest: rec.index === safest.index,
    }
  }, [ranked, scored])

  const changeTrip = (o, d) => {
    setOriginId(o)
    setDestId(d)
    setSelected(null)
  }

  return (
    <div className="app">
      <Header />
      <div className="grid">
        <section className="card map-card">
          <div className="map-shell">
            <MapView
              origin={origin}
              destination={destination}
              routesData={ranked}
              selectedIndex={selected}
              geojson={geojson}
              riskIndex={riskIndex}
              onSelect={setSelected}
            />
          </div>
        </section>

        <div className="sidecol">
          <section className="card">
            <h2>Trajeto</h2>
            <TripPicker
              originId={originId}
              destId={destId}
              onChange={changeTrip}
              onInvert={() => changeTrip(destId, originId)}
            />
            {status === 'loading' && <div className="loading">Calculando rotas…</div>}
            {status === 'error' && (
              <div className="error">
                Não foi possível obter rotas. Verifique a chave / billing / Directions API.
              </div>
            )}
          </section>

          <RiskSlider
            value={riskWeight}
            onChange={(v) => {
              setRiskWeight(v)
              setSelected(null)
            }}
          />

          {ranked.length > 0 && (
            <RoutePanel ranked={ranked} selectedIndex={selected} onSelect={setSelected} />
          )}
        </div>
      </div>

      {insight && (
        <div className="read">
          <b>Leitura.</b> A rota recomendada (risco {Math.round(insight.rec.riskScore * 100)}/100)
          {insight.sameAsFastest
            ? ' também é a mais rápida — sorte rara.'
            : ` custa +${insight.extraMin} min em relação à mais rápida (${formatDuration(insight.fastest.seconds)}), mas evita os trechos de maior risco.`}
          {!insight.sameAsSafest &&
            ' Puxe o controle todo pra “segurança” pra ver a rota de menor risco absoluto.'}{' '}
          O algoritmo do Maps sozinho nunca faria essa troca: pra ele, segurança não é uma variável.
        </div>
      )}

      <p className="disclaimer">
        <b>Limitação honesta.</b> O índice mede <b>densidade de roubo por km²</b> por distrito
        (furto entra com peso menor, por inflar zona comercial e dizer pouco sobre risco a quem
        atravessa de carro). É agregado por <b>distrito</b> (não rua-a-rua, sem hora do dia) e o
        mapeamento DP↔distrito é aproximado. O valor atual usa um <b>snapshot ilustrativo</b> —
        substitua por <code>data/ssp-capital.csv</code> com o export oficial da SSP-SP e rode{' '}
        <code>npm run build:risk</code>. É indicativo, não medição. Rotas e mapa: Google Directions
        API. Distritos: codigourbano/distritos-sp.
      </p>
    </div>
  )
}

export default function App() {
  if (!API_KEY) return <SetupNotice />
  return (
    <APIProvider apiKey={API_KEY}>
      <RotaApp />
    </APIProvider>
  )
}
