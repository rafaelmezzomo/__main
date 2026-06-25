import { formatDuration, formatDistance, riskTier } from '../lib/geo'

export default function RoutePanel({ ranked, selectedIndex, onSelect }) {
  return (
    <section className="card">
      <h2>Rotas ({ranked.length})</h2>
      <div className="routes">
        {ranked.map((r, displayRank) => (
          <div
            key={r.index}
            className={`route${r.isBest ? ' best' : ''}${r.index === selectedIndex ? ' sel' : ''}`}
            onClick={() => onSelect(r.index)}
          >
            <div className="rtop">
              <span className="rname">
                <span className="swatch" style={{ background: r.color }} />
                {displayRank === 0 ? 'Recomendada' : `Alternativa ${displayRank}`}
              </span>
              {r.isBest && <span className="badge">menor custo</span>}
            </div>
            <div className="metrics">
              <div className="metric">
                <div className="m-lab">Tempo</div>
                <div className="m-val">{formatDuration(r.seconds)}</div>
              </div>
              <div className="metric">
                <div className="m-lab">Distância</div>
                <div className="m-val">{formatDistance(r.meters)}</div>
              </div>
              <div className="metric">
                <div className="m-lab">Risco</div>
                <div className={`m-val ${riskTier(r.riskScore)}`}>
                  {Math.round(r.riskScore * 100)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
