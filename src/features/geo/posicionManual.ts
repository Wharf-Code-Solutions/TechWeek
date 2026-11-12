// Posición por toque en el mapa, para quien usa la app lejos del Centro Histórico.
// Si el GPS dice que el turista está lejos (o no hay GPS), la app lo coloca en el Zócalo y moverse es tocar el mapa:
// esa posición es la que usan la ruta, la detección de llegada (40 m) y el resto, igual que un GPS normal.
// La ruta se arma siempre con el algoritmo real y las preferencias elegidas; aquí solo cambia de dónde sale.
import { ZOCALO, estaLejosDelCentro } from './centro'
import type { Posicion, Punto } from './tipos'

const CLAVE = 'jarana.posManual'

let actual: Punto = leer()
const oyentes = new Set<() => void>()

function leer(): Punto {
  try {
    const p = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null') as Punto | null
    if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) return { lat: p.lat, lng: p.lng }
  } catch {
    /* sin almacenamiento: se empieza en el Zócalo */
  }
  return { ...ZOCALO }
}

function publicar(p: Punto) {
  actual = p
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(p))
  } catch {
    /* vale solo mientras la pantalla esté abierta */
  }
  oyentes.forEach((o) => o())
}

export const obtenerManual = () => actual
export function suscribirManual(oyente: () => void) {
  oyentes.add(oyente)
  return () => void oyentes.delete(oyente)
}

/** Mueve al turista (toque en el mapa). */
export const moverManual = (p: Punto) => publicar({ lat: p.lat, lng: p.lng })
/** Vuelve a poner al turista en el Zócalo (al armar una ruta nueva). */
export const reiniciarManual = () => publicar({ ...ZOCALO })

/** ¿Hay que usar la posición por toque? Si el GPS está lejos del Centro o no hay GPS. */
export function usaPosicionManual(gps: Posicion | null, estado: string): boolean {
  return estado === 'no-disponible' || (!!gps && estaLejosDelCentro(gps))
}

/** La posición que ve el resto de la app: la del GPS, o la del toque cuando se está lejos. */
export function posicionEfectiva(gps: Posicion | null, estado: string, manual: Punto): Posicion | null {
  if (!usaPosicionManual(gps, estado)) return gps
  return { lat: manual.lat, lng: manual.lng, precision: 5, fuente: 'gps' }
}

/** Punto de salida de la ruta: donde está el turista; lejos del Centro, el Zócalo (y se reinicia su posición ahí). */
export function salidaDeLaRuta(gps: Posicion | null, estado: string): Punto | null {
  if (usaPosicionManual(gps, estado)) {
    reiniciarManual()
    return { ...ZOCALO }
  }
  return gps ? { lat: gps.lat, lng: gps.lng } : null
}
