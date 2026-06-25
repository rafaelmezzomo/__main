// Lugares pré-definidos (v1 sem Places autocomplete). Coordenadas aproximadas.
export const PLACES = [
  { id: 'moema', lat: -23.5985, lng: -46.6636, label: 'Moema' },
  { id: 'zoologico', lat: -23.6437, lng: -46.6195, label: 'Zoológico de São Paulo' },
  { id: 'morumbi', lat: -23.6228, lng: -46.6997, label: 'Shopping Morumbi' },
]

export const DEFAULT_ORIGIN_ID = 'zoologico'
export const DEFAULT_DEST_ID = 'morumbi'

export function placeById(id) {
  return PLACES.find((p) => p.id === id)
}

// Centro inicial do mapa (o FitBounds reenquadra nos extremos depois) e zoom.
export const MAP_CENTER = { lat: -23.621, lng: -46.655 }
export const MAP_ZOOM = 12

// Map ID opcional para estilo vetorial; vazio usa o estilo raster padrão.
export const MAP_ID = undefined

// Cores das rotas alternativas (a recomendada usa ROUTE_BEST_COLOR).
export const ROUTE_BEST_COLOR = '#0E7C66'

// Peso default do slider: 0 = só tempo, 1 = só risco.
export const DEFAULT_RISK_WEIGHT = 0.5
