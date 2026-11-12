// Contrato 2 · usePosition(). Mapa, llegada y recorrido virtual solo hablan con este hook.
// Devuelve null si no hay permiso de ubicación: la app entra en modo explorador.
// Con ?demo=1 la posición viene del recorrido virtual (fuente 'demo'), sin tocar el GPS.
import { useMemo, useSyncExternalStore } from 'react'
import { esModoDemo, metrosDemo, suscribirDemo } from './demoStore'
import { esExplorador } from './explorador'
import { obtenerGps, suscribirGps } from './gpsStore'
import { obtenerManual, posicionEfectiva, suscribirManual, usaPosicionManual } from './posicionManual'
import { RECORRIDO_DEMO } from './rutaDemo'
import type { EstadoUbicacion, Posicion } from './tipos'

export type { EstadoUbicacion, FuentePosicion, Posicion } from './tipos'

const sinSuscripcion = () => () => {}

function useGps() {
  // En demo o en modo explorador no se pide permiso de ubicación.
  const sinGps = esModoDemo() || esExplorador()
  return useSyncExternalStore(sinGps ? sinSuscripcion : suscribirGps, obtenerGps)
}

export function usePosition(): Posicion | null {
  const demo = esModoDemo()
  const gps = useGps()
  const metros = useSyncExternalStore(suscribirDemo, metrosDemo)

  const posDemo = useMemo<Posicion>(() => {
    const { lat, lng } = RECORRIDO_DEMO.en(metros)
    return { lat, lng, precision: 5, fuente: 'demo' }
  }, [metros])

  const manual = useSyncExternalStore(suscribirManual, obtenerManual)
  const efectiva = useMemo(
    () => posicionEfectiva(gps.posicion, gps.estado, manual),
    [gps.posicion, gps.estado, manual],
  )

  if (demo) return posDemo
  return esExplorador() ? null : efectiva
}

/** ¿Se usa la posición por toque (GPS lejos del Centro o sin GPS)? Entonces tocar el mapa mueve al turista. */
export function useModoManual(): boolean {
  const gps = useGps()
  return !esModoDemo() && !esExplorador() && usaPosicionManual(gps.posicion, gps.estado)
}

/** Para las pantallas de permiso y el modo explorador. */
export function useEstadoUbicacion(): EstadoUbicacion {
  const gps = useGps()
  if (esModoDemo()) return 'demo'
  return esExplorador() ? 'denegado' : gps.estado
}
