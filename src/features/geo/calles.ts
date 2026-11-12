// Caminos por las calles (Mapbox Directions, perfil walking). Los usan la línea azul de la ruta y el tramo hacia la
// siguiente parada cuando el turista se desvía. Sin token o si falla la red, quien llama dibuja una línea recta.
import type { Punto } from './tipos'

export type Coord = [number, number]

export const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
/** Límite de Directions por petición: las rutas con más puntos se piden por tramos que se pegan. */
export const MAX_PUNTOS = 25

const enMemoria = new Map<string, Coord[]>()
const clave = (puntos: Punto[]) => puntos.map((p) => `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`).join(';')

async function pedirTramo(puntos: Punto[], señal?: AbortSignal): Promise<Coord[]> {
  const coords = puntos.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&overview=full&access_token=${TOKEN}`
  const r = await fetch(url, { signal: señal })
  if (!r.ok) throw new Error(`Directions ${r.status}`)
  const datos = (await r.json()) as { routes?: { geometry: { coordinates: Coord[] } }[] }
  const linea = datos.routes?.[0]?.geometry.coordinates
  if (!linea?.length) throw new Error('Directions sin ruta')
  return linea
}

/** Parte los puntos en grupos de MAX_PUNTOS que comparten el punto de unión, para no cortar la ruta en las calles. */
export function dividirPuntos<T>(puntos: T[]): T[][] {
  const grupos: T[][] = []
  for (let i = 0; i < puntos.length - 1; i += MAX_PUNTOS - 1) grupos.push(puntos.slice(i, i + MAX_PUNTOS))
  return grupos
}

/** Línea [lng, lat] que sigue las calles por todos los puntos, en orden. Lanza si no se pudo. */
export async function pedirCalles(puntos: Punto[], señal?: AbortSignal): Promise<Coord[]> {
  if (!TOKEN) throw new Error('Sin token de Mapbox')
  const k = clave(puntos)
  const guardada = enMemoria.get(k)
  if (guardada) return guardada
  const partes = await Promise.all(dividirPuntos(puntos).map((g) => pedirTramo(g, señal)))
  // Cada tramo termina donde empieza el siguiente: se quita el punto repetido.
  const linea = partes.flatMap((p, i) => (i === 0 ? p : p.slice(1)))
  if (enMemoria.size > 60) enMemoria.clear()
  enMemoria.set(k, linea)
  return linea
}
