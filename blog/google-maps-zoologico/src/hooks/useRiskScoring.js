import { useMemo } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { ringsFromFeature } from '../lib/geo'

// Constrói os polígonos dos distritos uma vez e pontua cada rota pela
// média de risco ponderada por comprimento dos trechos que a atravessam.
export function useRiskScoring(routes, geojson, riskIndex) {
  const geometryLib = useMapsLibrary('geometry')
  const mapsLib = useMapsLibrary('maps')

  const districtPolys = useMemo(() => {
    if (!mapsLib || !geojson) return []
    return geojson.features.flatMap((f) =>
      ringsFromFeature(f).map((ring) => ({
        code: f.properties.ds_codigo,
        poly: new mapsLib.Polygon({ paths: ring }),
      })),
    )
  }, [mapsLib, geojson])

  const medianRisk = useMemo(() => {
    const vals = Object.values(riskIndex || {}).sort((a, b) => a - b)
    if (!vals.length) return 0
    return vals[Math.floor(vals.length / 2)]
  }, [riskIndex])

  const scored = useMemo(() => {
    if (!geometryLib || !routes.length) return []

    const findRisk = (point) => {
      const hit = districtPolys.find((d) =>
        geometryLib.poly.containsLocation(point, d.poly),
      )
      const code = hit?.code
      return code != null && riskIndex?.[code] != null
        ? riskIndex[code]
        : medianRisk
    }

    return routes.map((route, index) => {
      const path = route.overview_path
      let meters = 0
      let weighted = 0
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1]
        const b = path[i]
        const seg = geometryLib.spherical.computeDistanceBetween(a, b)
        // amostra o trecho pelo ponto inicial (já é um google.maps.LatLng)
        weighted += seg * findRisk(a)
        meters += seg
      }
      const legs = route.legs || []
      const seconds = legs.reduce((s, l) => s + (l.duration?.value || 0), 0)
      return {
        index,
        route,
        meters,
        seconds,
        riskScore: meters > 0 ? weighted / meters : 0,
      }
    })
  }, [geometryLib, routes, districtPolys, riskIndex, medianRisk])

  return { scored, ready: !!geometryLib && !!mapsLib }
}
