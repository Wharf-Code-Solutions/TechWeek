// Tramo que falta hasta la siguiente parada, siguiendo las calles desde donde está el turista (no en línea recta).
// Se pide a Directions al cambiar de parada o cuando el turista sale del camino; mientras camina se va recortando.
import { useEffect, useMemo, useState } from 'react'
import { TOKEN, pedirCalles, type Coord } from './calles'
import { distanciaM } from './distancia'
import { tramoRestante } from './tramo'
import type { Punto } from './tipos'

type Destino = Punto & { slug: string }
const SIN_TRAMO: Coord[] = []
/** Más lejos que esto del camino guardado (m) se vuelve a pedir el camino. */
const LEJOS_DEL_CAMINO_M = 60

const distanciaAlCamino = (linea: Coord[], p: Punto) =>
  linea.reduce((min, [lng, lat]) => Math.min(min, distanciaM(p, { lat, lng })), Infinity)

export function useTramoCalles(pos: Punto | null, destino: Destino | null): Coord[] {
  const [camino, setCamino] = useState<{ slug: string; linea: Coord[] } | null>(null)
  const slug = destino?.slug
  const mismoDestino = camino?.slug === slug
  const fuera = !!pos && !!camino && mismoDestino && distanciaAlCamino(camino.linea, pos) > LEJOS_DEL_CAMINO_M
  const necesita = !!pos && !!destino && !!TOKEN && (!mismoDestino || fuera)
  const lat = pos?.lat
  const lng = pos?.lng
  const dLat = destino?.lat
  const dLng = destino?.lng

  useEffect(() => {
    if (!necesita || lat === undefined || lng === undefined || dLat === undefined || dLng === undefined || !slug) return
    const control = new AbortController()
    // Un respiro: si el turista sigue moviéndose no se pide en cada paso.
    const id = window.setTimeout(() => {
      pedirCalles([{ lat, lng }, { lat: dLat, lng: dLng }], control.signal)
        .then((linea) => setCamino({ slug, linea }))
        .catch(() => {})
    }, 350)
    return () => {
      window.clearTimeout(id)
      control.abort()
    }
    // Se repite al cambiar de parada o de posición solo mientras hace falta un camino nuevo.
  }, [necesita, slug, necesita ? lat : 0, necesita ? lng : 0, dLat, dLng]) // eslint-disable-line react-hooks/exhaustive-deps

  return useMemo(() => {
    if (!pos || !destino) return SIN_TRAMO
    if (camino && camino.slug === destino.slug) return tramoRestante(camino.linea, pos, destino)
    // Con token se espera el camino por calles (no se dibuja una línea recta que corte entre ellas).
    return TOKEN ? SIN_TRAMO : [[pos.lng, pos.lat] as Coord, [destino.lng, destino.lat] as Coord]
  }, [pos, destino, camino])
}
