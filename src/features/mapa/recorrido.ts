// Checkpoints de la ruta: el tramo ya recorrido (del inicio hasta la última parada pasada) se queda dibujado en otro
// color, en vez de desaparecer, y crece con cada parada que el turista va dejando atrás.
import type { Punto } from '../geo/tipos'

type Coord = [number, number]

const distancia2 = ([lng, lat]: Coord, p: Punto) => (lng - p.lng) ** 2 + (lat - p.lat) ** 2

/**
 * Parte de `linea` que va desde el inicio hasta la parada número `pasadas` (las primeras `pasadas` paradas, en
 * orden). Cada parada se ubica en el vértice más cercano que esté después de la anterior, así una ruta que cruza
 * sus propias calles no salta de un lado a otro. Vacío si todavía no se pasó ninguna.
 */
export function tramoRecorrido(linea: Coord[], paradas: Punto[], pasadas: number): Coord[] {
  const n = Math.min(pasadas, paradas.length)
  if (n <= 0 || linea.length < 2) return []
  let desde = 0
  for (let j = 0; j < n; j++) {
    let mejor = desde
    let mejorD = Infinity
    for (let i = desde; i < linea.length; i++) {
      const d = distancia2(linea[i], paradas[j])
      if (d < mejorD) {
        mejorD = d
        mejor = i
      }
    }
    desde = mejor
  }
  return desde >= 1 ? linea.slice(0, desde + 1) : []
}
