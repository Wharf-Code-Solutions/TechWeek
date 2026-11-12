// Contrato 2 · usePosition(). Mapa y llegada solo hablan con este hook.
// Devuelve null si no hay permiso de ubicación: la app entra en modo explorador.
// Lejos del Centro (o sin GPS) devuelve la posición por toque en el mapa (ver posicionManual.ts).
import { useMemo, useSyncExternalStore } from 'react'
import { esExplorador } from './explorador'
import { obtenerGps, suscribirGps } from './gpsStore'
import { obtenerManual, posicionEfectiva, suscribirManual, usaPosicionManual } from './posicionManual'
import type { EstadoUbicacion, Posicion } from './tipos'

export type { EstadoUbicacion, FuentePosicion, Posicion } from './tipos'

const sinSuscripcion = () => () => {}

function useGps() {
  // En modo explorador no se pide permiso de ubicación.
  return useSyncExternalStore(esExplorador() ? sinSuscripcion : suscribirGps, obtenerGps)
}

export function usePosition(): Posicion | null {
  const gps = useGps()
  const manual = useSyncExternalStore(suscribirManual, obtenerManual)
  const efectiva = useMemo(
    () => posicionEfectiva(gps.posicion, gps.estado, manual),
    [gps.posicion, gps.estado, manual],
  )
  return esExplorador() ? null : efectiva
}

/** ¿Se usa la posición por toque (GPS lejos del Centro o sin GPS)? Entonces tocar el mapa mueve al turista. */
export function useModoManual(): boolean {
  const gps = useGps()
  return !esExplorador() && usaPosicionManual(gps.posicion, gps.estado)
}

/** Para las pantallas de permiso y el modo explorador. */
export function useEstadoUbicacion(): EstadoUbicacion {
  const gps = useGps()
  return esExplorador() ? 'denegado' : gps.estado
}
