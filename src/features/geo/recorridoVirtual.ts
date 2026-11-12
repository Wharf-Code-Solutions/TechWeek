// M6 · Lógica pura del recorrido virtual (estilo Street View): avanzar por una ruta sin GPS.
import along from '@turf/along'
import bearing from '@turf/bearing'
import { lineString } from '@turf/helpers'
import { distanciaM } from './distancia'
import type { Punto } from './tipos'

export interface PuntoRecorrido extends Punto {
  /** Rumbo en grados (0 = norte) hacia donde mira el turista. */
  rumbo: number
}

export interface Recorrido {
  totalM: number
  /** Posición y rumbo a `metros` desde el inicio (se limita a la ruta). */
  en: (metros: number) => PuntoRecorrido
  /** Metros desde el inicio hasta el vértice `indice` (una parada). */
  metrosDeParada: (indice: number) => number
  /** Índice de la parada más cercana por detrás o en `metros`. */
  paradaActual: (metros: number) => number
}

/**
 * `puntos` son las paradas. Con `tramos` (un trazado [lng, lat] entre cada par de paradas, p. ej. por calles)
 * el recorrido sigue ese trazado en vez de la línea recta; pasa siempre por las paradas.
 */
export function crearRecorrido(puntos: Punto[], tramos?: [number, number][][]): Recorrido {
  if (puntos.length < 2) throw new Error('El recorrido necesita al menos 2 puntos')
  const camino: Punto[] = [puntos[0]]
  const idxParada = [0]
  for (let i = 1; i < puntos.length; i++) {
    const tramo = tramos?.[i - 1] ?? []
    for (const [lng, lat] of tramo) camino.push({ lat, lng })
    camino.push(puntos[i])
    idxParada.push(camino.length - 1)
  }
  const linea = lineString(camino.map((p) => [p.lng, p.lat]))
  const metrosCamino = [0]
  for (let i = 1; i < camino.length; i++) {
    metrosCamino.push(metrosCamino[i - 1] + distanciaM(camino[i - 1], camino[i]))
  }
  const acumulado = idxParada.map((i) => metrosCamino[i])
  const totalM = acumulado[acumulado.length - 1]
  const limitar = (m: number) => Math.min(Math.max(m, 0), totalM)

  return {
    totalM,
    en(metros) {
      const d = limitar(metros)
      const aqui = along(linea, d, { units: 'meters' })
      // Rumbo: hacia un punto 5 m adelante (o desde 5 m atrás al final de la ruta).
      const [desde, hacia] = d + 5 <= totalM ? [d, d + 5] : [Math.max(d - 5, 0), d]
      const rumbo = bearing(
        along(linea, desde, { units: 'meters' }),
        along(linea, hacia, { units: 'meters' }),
      )
      const [lng, lat] = aqui.geometry.coordinates
      return { lat, lng, rumbo: (rumbo + 360) % 360 }
    },
    metrosDeParada: (indice) => acumulado[Math.min(Math.max(indice, 0), acumulado.length - 1)],
    paradaActual(metros) {
      const d = limitar(metros)
      let actual = 0
      acumulado.forEach((a, i) => {
        if (a <= d) actual = i
      })
      return actual
    },
  }
}
