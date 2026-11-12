// Guía hacia la siguiente parada. Sigue la línea de la ruta; si el turista se desvía de verdad (más de
// DESVIO_M durante DESVIO_MS seguidos) se pide un camino nuevo por calles desde donde está hasta esa parada,
// y la guía lo sigue. La línea azul de la ruta y el tramo ya recorrido no cambian.
import { useEffect, useMemo, useRef, useState } from 'react'
import { TOKEN, pedirCalles, type Coord } from './calles'
import { distanciaALinea, tramoRestante } from './tramo'
import type { Punto } from './tipos'

/** Más lejos que esto (m) de la línea que guía cuenta como desviarse: ~media cuadra, por encima del ruido del GPS. */
export const DESVIO_M = 60
/** Tiempo (ms) que hay que seguir fuera antes de recalcular: un brinco suelto del GPS no lo dispara. */
export const DESVIO_MS = 5000
/** Si el camino nuevo no se pudo pedir (sin red), se vuelve a intentar pasado este tiempo. */
const REINTENTO_MS = 15_000

type Destino = Punto & { slug: string }
const SIN_GUIA: Coord[] = []

export function useGuia(linea: Coord[], pos: Punto | null, destino: Destino | null): Coord[] {
  // Camino alterno por calles hacia la parada `slug`, pedido al desviarse.
  const [alterno, setAlterno] = useState<{ slug: string; linea: Coord[] } | null>(null)
  const [intento, setIntento] = useState(0)
  const actual = useRef(pos)
  actual.current = pos

  const guiaBase = alterno && alterno.slug === destino?.slug ? alterno.linea : linea
  const fuera = !!pos && !!destino && !!TOKEN && guiaBase.length > 1 && distanciaALinea(guiaBase, pos) > DESVIO_M

  useEffect(() => {
    if (!fuera || !destino) return
    const control = new AbortController()
    let reintento: number | undefined
    const id = window.setTimeout(() => {
      const p = actual.current
      if (!p) return
      pedirCalles([p, destino], control.signal)
        .then((nueva) => setAlterno({ slug: destino.slug, linea: [[p.lng, p.lat], ...nueva] }))
        .catch(() => {
          if (!control.signal.aborted) reintento = window.setTimeout(() => setIntento((n) => n + 1), REINTENTO_MS)
        })
    }, DESVIO_MS)
    return () => {
      window.clearTimeout(id)
      window.clearTimeout(reintento)
      control.abort()
    }
    // destino se compara por su slug: el objeto puede cambiar de identidad sin cambiar de parada.
  }, [fuera, destino?.slug, intento]) // eslint-disable-line react-hooks/exhaustive-deps

  return useMemo(() => {
    if (!pos || !destino || guiaBase.length < 2) return SIN_GUIA
    return tramoRestante(guiaBase, pos, destino)
  }, [guiaBase, pos, destino])
}
