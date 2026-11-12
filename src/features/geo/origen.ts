// Punto de partida de la ruta: donde estaba el turista al armarla. Se guarda en la sesión para que la línea azul
// del mapa arranque ahí (y no en la primera parada) aunque se recargue la página.
import { estaLejosDelCentro } from './centro'
import type { Punto } from './tipos'

const CLAVE = 'jarana.origen'

export function guardarOrigen(p: Punto | null) {
  try {
    if (p) sessionStorage.setItem(CLAVE, JSON.stringify({ lat: p.lat, lng: p.lng }))
    else sessionStorage.removeItem(CLAVE)
  } catch {
    /* sin almacenamiento: la línea arranca en la primera parada */
  }
}

/** Origen guardado, o null si no hay, es inválido o está lejos del Centro (no tiene sentido dibujar esa línea). */
export function leerOrigen(): Punto | null {
  try {
    const p = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null') as Punto | null
    if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return null
    return estaLejosDelCentro(p) ? null : { lat: p.lat, lng: p.lng }
  } catch {
    return null
  }
}
