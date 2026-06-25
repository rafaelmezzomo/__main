import { PLACES } from '../config'

function Select({ label, value, exclude, onChange }) {
  return (
    <label className="field">
      <span className="field-lab">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {PLACES.map((p) => (
          <option key={p.id} value={p.id} disabled={p.id === exclude}>
            {p.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function TripPicker({ originId, destId, onChange, onInvert }) {
  return (
    <div className="trip-picker">
      <Select
        label="De"
        value={originId}
        exclude={destId}
        onChange={(id) => onChange(id, destId)}
      />
      <button className="btn invert" type="button" onClick={onInvert} title="Inverter">
        ⇄
      </button>
      <Select
        label="Para"
        value={destId}
        exclude={originId}
        onChange={(id) => onChange(originId, id)}
      />
    </div>
  )
}
