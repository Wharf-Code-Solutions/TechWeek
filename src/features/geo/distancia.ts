import type { Punto } from './tipos'

const RADIO_TIERRA_M = 6_371_000
const rad = (grados: number) => (grados * Math.PI) / 180

/** Distancia en metros entre dos coordenadas (haversine). */
export function distanciaM(a: Punto, b: Punto): number {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h))
}
