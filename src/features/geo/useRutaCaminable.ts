// Línea azul de la ruta: sigue las calles (Mapbox Directions, perfil walking) y cae a línea recta si falla.
import { useEffect, useMemo, useState } from 'react'
import type { Punto } from './tipos'

import { TOKEN, pedirCalles, type Coord } from './calles'

type ConSlug = Punto & { slug: string }

/** Clave estable de una ruta: los slugs en orden (y el origen, si lo hay, redondeado a ~10 m). */
export const claveRuta = (paradas: { slug: string }[], origen?: Punto | null) =>
  (origen ? `${origen.lat.toFixed(4)},${origen.lng.toFixed(4)}>` : '') + paradas.map((p) => p.slug).join('|')

export const lineaRecta = (paradas: Punto[]): Coord[] => paradas.map((p) => [p.lng, p.lat])


function leerCache(clave: string): Coord[] | null {
  try {
    const crudo = sessionStorage.getItem(`jarana.calles.${clave}`)
    return crudo ? (JSON.parse(crudo) as Coord[]) : null
  } catch {
    return null
  }
}

function guardarCache(clave: string, linea: Coord[]) {
  try {
    sessionStorage.setItem(`jarana.calles.${clave}`, JSON.stringify(linea))
  } catch {
    /* sin almacenamiento: se vuelve a pedir en la próxima visita */
  }
}

/** Devuelve la línea [lng, lat] de la ruta por calles; mientras llega (o si falla) es la línea recta. */
export function useRutaCaminable(paradas: ConSlug[], origen: Punto | null = null): Coord[] {
  const clave = claveRuta(paradas, origen)
  // La línea arranca donde estaba el turista al armar la ruta (si no se conoce, en la primera parada).
  const puntos = useMemo<Punto[]>(() => (origen ? [origen, ...paradas] : paradas), [origen, paradas])
  const recta = useMemo(() => lineaRecta(puntos), [puntos])
  const [calles, setCalles] = useState<{ clave: string; linea: Coord[] } | null>(null)

  useEffect(() => {
    if (puntos.length < 2 || !TOKEN) return
    const guardada = leerCache(clave)
    if (guardada) {
      setCalles({ clave, linea: guardada })
      return
    }
    const control = new AbortController()
    pedirCalles(puntos, control.signal)
      .then((linea) => {
        guardarCache(clave, linea)
        setCalles({ clave, linea })
      })
      .catch(() => {})
    return () => control.abort()
    // `paradas` cambia de identidad en cada render del padre; la clave basta para saber si cambió la ruta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  if (puntos.length < 2) return []
  return calles?.clave === clave ? calles.linea : recta
}
