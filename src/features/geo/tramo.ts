// Tramo de la línea azul que falta recorrer: de donde está el turista hasta la siguiente parada.
// Se resalta y pulsa en el mapa para ubicar de un vistazo hacia dónde seguir.
import { distanciaM } from './distancia'
import type { Punto } from './tipos'

type Coord = [number, number]

/** Índice del vértice de la línea más cercano al punto. */
function verticeMasCercano(linea: Coord[], p: Punto): number {
  let mejor = 0
  let mejorD = Infinity
  linea.forEach(([lng, lat], i) => {
    const d = distanciaM(p, { lat, lng })
    if (d < mejorD) {
      mejorD = d
      mejor = i
    }
  })
  return mejor
}

/**
 * Puntos [lng, lat] desde `desde` hasta `hasta` siguiendo la línea. Si la parada ya quedó atrás en la línea
 * (o la línea es muy corta), devuelve el segmento recto entre los dos puntos.
 */
export function tramoRestante(linea: Coord[], desde: Punto, hasta: Punto): Coord[] {
  const a: Coord = [desde.lng, desde.lat]
  const b: Coord = [hasta.lng, hasta.lat]
  if (linea.length < 2) return [a, b]
  const i = verticeMasCercano(linea, desde)
  const j = verticeMasCercano(linea, hasta)
  if (j <= i) return [a, b]
  return [a, ...linea.slice(i, j + 1), b]
}

/** Distancia (m) del punto a la línea más cercana de la ruta, contando los segmentos, no solo los vértices. */
export function distanciaALinea(linea: Coord[], p: Punto): number {
  if (!linea.length) return Infinity
  // Plano local en metros alrededor del punto (basta para distancias de unas cuadras).
  const mLat = 111_320
  const mLng = 111_320 * Math.cos((p.lat * Math.PI) / 180)
  const xy = ([lng, lat]: Coord) => [(lng - p.lng) * mLng, (lat - p.lat) * mLat] as const
  if (linea.length === 1) return Math.hypot(...xy(linea[0]))
  let min = Infinity
  for (let i = 1; i < linea.length; i++) {
    const [ax, ay] = xy(linea[i - 1])
    const [bx, by] = xy(linea[i])
    const dx = bx - ax
    const dy = by - ay
    const largo2 = dx * dx + dy * dy
    // Proyección del punto (el origen) sobre el segmento, recortada a sus extremos.
    const t = largo2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / largo2)) : 0
    min = Math.min(min, Math.hypot(ax + t * dx, ay + t * dy))
  }
  return min
}
