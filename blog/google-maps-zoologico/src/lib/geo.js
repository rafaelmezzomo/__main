// Helpers puros (sem dependência do objeto google).

// Extrai os anéis externos de uma feature GeoJSON (Polygon ou MultiPolygon)
// como arrays de { lat, lng } prontos para virar google.maps.Polygon.
export function ringsFromFeature(feature) {
  const { type, coordinates } = feature.geometry
  const toRing = (ring) => ring.map(([lng, lat]) => ({ lat, lng }))
  if (type === 'Polygon') return [toRing(coordinates[0])]
  if (type === 'MultiPolygon') return coordinates.map((poly) => toRing(poly[0]))
  return []
}

export function midpoint(a, b) {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }
}

// Normaliza um array de números para 0..1 (min-max). Array vazio/uniforme -> zeros.
export function minMax(values) {
  if (!values.length) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min
  if (span === 0) return values.map(() => 0)
  return values.map((v) => (v - min) / span)
}

export function formatDuration(seconds) {
  const min = Math.round(seconds / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  return `${h}h${String(min % 60).padStart(2, '0')}`
}

export function formatDistance(meters) {
  return `${(meters / 1000).toFixed(1)} km`
}

export function riskTier(score) {
  if (score >= 0.66) return 'risk-hi'
  if (score >= 0.33) return 'risk-mid'
  return 'risk-lo'
}
