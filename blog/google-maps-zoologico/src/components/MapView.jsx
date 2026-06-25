import { useEffect } from 'react'
import { Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { MAP_CENTER, MAP_ZOOM, MAP_ID } from '../config'
import { ringsFromFeature } from '../lib/geo'

// Overlay dos distritos: preenchimento vermelho proporcional ao índice de risco.
function DistrictOverlay({ geojson, riskIndex }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !geojson || !window.google) return
    const polys = []
    geojson.features.forEach((f) => {
      const risk = riskIndex?.[f.properties.ds_codigo] ?? 0
      ringsFromFeature(f).forEach((ring) => {
        polys.push(
          new window.google.maps.Polygon({
            paths: ring,
            strokeColor: '#B42318',
            strokeOpacity: 0.3,
            strokeWeight: 1,
            fillColor: '#B42318',
            fillOpacity: 0.05 + 0.32 * risk,
            clickable: false,
            map,
          }),
        )
      })
    })
    return () => polys.forEach((p) => p.setMap(null))
  }, [map, geojson, riskIndex])
  return null
}

// Polylines das rotas. Recomendada (verde) e selecionada vão por cima.
function RoutePolylines({ routesData, selectedIndex, onSelect }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !window.google) return
    const z = (rd) => (rd.isBest ? 10 : rd.index === selectedIndex ? 8 : 1)
    const ordered = [...routesData].sort((a, b) => z(a) - z(b))
    const lines = ordered.map((rd) => {
      const isSel = rd.index === selectedIndex
      const line = new window.google.maps.Polyline({
        path: rd.route.overview_path,
        strokeColor: rd.color,
        strokeOpacity: rd.isBest ? 0.95 : isSel ? 0.85 : 0.5,
        strokeWeight: rd.isBest ? 6 : isSel ? 5 : 4,
        zIndex: z(rd),
        map,
      })
      line.addListener('click', () => onSelect(rd.index))
      return line
    })
    return () => lines.forEach((l) => l.setMap(null))
  }, [map, routesData, selectedIndex, onSelect])
  return null
}

// Ajusta o enquadramento aos dois extremos quando eles mudam.
function FitBounds({ origin, destination }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !window.google) return
    const bounds = new window.google.maps.LatLngBounds()
    bounds.extend(origin)
    bounds.extend(destination)
    map.fitBounds(bounds, 64)
  }, [map, origin, destination])
  return null
}

export default function MapView({
  origin,
  destination,
  routesData,
  selectedIndex,
  geojson,
  riskIndex,
  onSelect,
}) {
  return (
    <Map
      defaultCenter={MAP_CENTER}
      defaultZoom={MAP_ZOOM}
      mapId={MAP_ID}
      gestureHandling="greedy"
      disableDefaultUI={false}
      clickableIcons={false}
      style={{ width: '100%', height: '100%' }}
    >
      <DistrictOverlay geojson={geojson} riskIndex={riskIndex} />
      <RoutePolylines
        routesData={routesData}
        selectedIndex={selectedIndex}
        onSelect={onSelect}
      />
      <FitBounds origin={origin} destination={destination} />
      <Marker position={origin} label="A" title={origin.label} />
      <Marker position={destination} label="B" title={destination.label} />
    </Map>
  )
}
