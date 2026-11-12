// Línea azul de la ruta: sigue las calles (Mapbox Directions, perfil walking) y cae a línea recta si falla.
// La ruta de la demo ya trae su trazado guardado (rutaDemoCalles.ts) y no consulta la red.
import { useEffect, useMemo, useState } from 'react'
import type { Punto } from './tipos'
import { LINEA_DEMO, PARADAS_DEMO } from './rutaDemo'

type Coord = [number, number]
type ConSlug = Punto & { slug: string }

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
const MAX_PUNTOS = 25 // límite de Directions por petición

/** Clave estable de una ruta: los slugs en orden. */
export const claveRuta = (paradas: { slug: string }[]) => paradas.map((p) => p.slug).join('|')

export const lineaRecta = (paradas: Punto[]): Coord[] => paradas.map((p) => [p.lng, p.lat])

const esDemo = (paradas: { slug: string }[]) => claveRuta(paradas) === claveRuta(PARADAS_DEMO)

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

async function pedirCalles(paradas: Punto[], señal: AbortSignal): Promise<Coord[]> {
  const coords = paradas.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&overview=full&access_token=${TOKEN}`
  const r = await fetch(url, { signal: señal })
  if (!r.ok) throw new Error(`Directions ${r.status}`)
  const datos = (await r.json()) as { routes?: { geometry: { coordinates: Coord[] } }[] }
  const linea = datos.routes?.[0]?.geometry.coordinates
  if (!linea?.length) throw new Error('Directions sin ruta')
  return linea
}

/** Devuelve la línea [lng, lat] de la ruta por calles; mientras llega (o si falla) es la línea recta. */
export function useRutaCaminable(paradas: ConSlug[]): Coord[] {
  const clave = claveRuta(paradas)
  const recta = useMemo(() => lineaRecta(paradas), [paradas])
  const [calles, setCalles] = useState<{ clave: string; linea: Coord[] } | null>(null)

  useEffect(() => {
    if (paradas.length < 2 || paradas.length > MAX_PUNTOS || esDemo(paradas) || !TOKEN) return
    const guardada = leerCache(clave)
    if (guardada) {
      setCalles({ clave, linea: guardada })
      return
    }
    const control = new AbortController()
    pedirCalles(paradas, control.signal)
      .then((linea) => {
        guardarCache(clave, linea)
        setCalles({ clave, linea })
      })
      .catch(() => {})
    return () => control.abort()
    // `paradas` cambia de identidad en cada render del padre; la clave basta para saber si cambió la ruta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  if (paradas.length < 2) return []
  if (esDemo(paradas)) return LINEA_DEMO
  return calles?.clave === clave ? calles.linea : recta
}
