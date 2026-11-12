// ¿El turista está en el Centro Histórico o lejos de él? Si está lejos, la app lo coloca en el Zócalo
// y se mueve tocando el mapa (ver posicionManual.ts).
import { distanciaM } from './distancia'
import type { Punto } from './tipos'

/** El Zócalo, corazón del Centro Histórico. */
export const ZOCALO: Punto = { lat: 19.20023, lng: -96.13853 }
/**
 * Dónde sale quien no está en el Centro: ~85 m al norte del Zócalo, a más de 45 m del radio de llegada de cualquier
 * lugar. Salir justo en el Zócalo abría su pantalla "¡Llegaste!" al instante y no dejaba ver el mapa.
 */
export const SALIDA_MANUAL: Punto = { lat: 19.20099, lng: -96.13863 }
/** Más lejos que esto del Zócalo se considera "lejos del Centro": no se puede llegar a los lugares a pie. */
export const RADIO_CENTRO_M = 2000

export const distanciaAlCentro = (pos: Punto) => distanciaM(pos, ZOCALO)

export const estaLejosDelCentro = (pos: Punto | null) => !!pos && distanciaAlCentro(pos) > RADIO_CENTRO_M
