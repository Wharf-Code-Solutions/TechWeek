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
