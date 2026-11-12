// Contrato 2 · usePosition(). Mapa, llegada y recorrido virtual solo hablan con este hook.
// Devuelve null si no hay permiso de ubicación: la app entra en modo explorador.
// Con ?demo=1 la posición viene del recorrido virtual (fuente 'demo'), sin tocar el GPS.
import { useMemo, useSyncExternalStore } from 'react'
import { esModoDemo, metrosDemo, suscribirDemo } from './demoStore'
import { obtenerGps, suscribirGps } from './gpsStore'
import { RECORRIDO_DEMO } from './rutaDemo'
import type { EstadoUbicacion, Posicion } from './tipos'

export type { EstadoUbicacion, FuentePosicion, Posicion } from './tipos'

const sinSuscripcion = () => () => {}

function useGps() {
  const demo = esModoDemo()
  // En demo no se pide permiso de ubicación.
  return useSyncExternalStore(demo ? sinSuscripcion : suscribirGps, obtenerGps)
}

export function usePosition(): Posicion | null {
  const demo = esModoDemo()
  const gps = useGps()
  const metros = useSyncExternalStore(suscribirDemo, metrosDemo)

  const posDemo = useMemo<Posicion>(() => {
    const { lat, lng } = RECORRIDO_DEMO.en(metros)
    return { lat, lng, precision: 5, fuente: 'demo' }
  }, [metros])

  return demo ? posDemo : gps.posicion
}

/** Para las pantallas de permiso y el modo explorador. */
export function useEstadoUbicacion(): EstadoUbicacion {
  const gps = useGps()
  return esModoDemo() ? 'demo' : gps.estado
}
