import { useEffect, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'

// Pede rotas reais (com alternativas) ao Directions Service do Google.
export function useDirections(origin, destination) {
  const routesLib = useMapsLibrary('routes')
  const [resolved, setResolved] = useState({ key: null, routes: [], status: 'idle' })

  const key = `${origin.lat},${origin.lng}->${destination.lat},${destination.lng}`

  useEffect(() => {
    if (!routesLib) return
    let active = true
    const service = new routesLib.DirectionsService()
    service.route(
      {
        origin,
        destination,
        travelMode: routesLib.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      },
      (result, reqStatus) => {
        if (!active) return
        if (reqStatus === 'OK' && result?.routes?.length) {
          setResolved({ key, routes: result.routes, status: 'ok' })
        } else {
          setResolved({ key, routes: [], status: 'error' })
        }
      },
    )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesLib, key])

  // status derivado: 'loading' até a resposta da chave atual chegar
  const matches = resolved.key === key
  const status = !routesLib ? 'idle' : matches ? resolved.status : 'loading'
  const routes = matches ? resolved.routes : []

  return { routes, status }
}
