// M5 · Detección de llegada: al entrar al radio de un lugar se registra la visita una sola vez.
import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../lib/api'
import type { Lugar } from '../../types/contratos'
import { distanciaM } from './distancia'
import type { Posicion } from './tipos'

const REINTENTO_MS = 10_000

/** Lugar cuyo radio contiene la posición (el más cercano si hay varios), o null. */
export function lugarCercano(lugares: Lugar[], pos: Posicion | null): Lugar | null {
  if (!pos) return null
  let mejor: Lugar | null = null
  let mejorD = Infinity
  for (const l of lugares) {
    const d = distanciaM(pos, l)
    if (d <= l.radio_m && d < mejorD) {
      mejor = l
      mejorD = d
    }
  }
  return mejor
}

export function useLlegada(lugares: Lugar[], pos: Posicion | null) {
  const intentados = useRef(new Set<string>())
  const [registrados, setRegistrados] = useState<string[]>([])
  const cerca = useMemo(() => lugarCercano(lugares, pos), [lugares, pos])

  useEffect(() => {
    if (!cerca || !pos || intentados.current.has(cerca.slug)) return
    const slug = cerca.slug
    intentados.current.add(slug)
    api
      .registrarLlegada(slug, pos.fuente, pos.lat, pos.lng)
      .then(() => setRegistrados((r) => (r.includes(slug) ? r : [...r, slug])))
      // Si falla (sin red, GPS impreciso) se reintenta más tarde, no en cada actualización de posición.
      .catch(() => setTimeout(() => intentados.current.delete(slug), REINTENTO_MS))
  }, [cerca, pos])

  return { lugarActual: cerca, registrados }
}
