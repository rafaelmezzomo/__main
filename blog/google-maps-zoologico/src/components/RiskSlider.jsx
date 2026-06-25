export default function RiskSlider({ value, onChange }) {
  const pct = Math.round(value * 100)
  return (
    <section className="card">
      <h2>Otimizar por</h2>
      <div className="ctrl">
        <label>
          Critério
          <span className={`v ${value >= 0.5 ? 'risco' : 'tempo'}`}>
            {value <= 0.15
              ? 'tempo'
              : value >= 0.85
                ? 'segurança'
                : `${100 - pct}% tempo · ${pct}% risco`}
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={pct}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          aria-label="Otimizar por tempo ou segurança"
        />
        <div className="ends">
          <span>⏱ tempo</span>
          <span>segurança 🛡</span>
        </div>
      </div>
    </section>
  )
}
