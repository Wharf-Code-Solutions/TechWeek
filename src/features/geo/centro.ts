// ¿El turista está en el Centro Histórico o lejos de él? Sirve para ofrecer el modo demo (recorrido virtual)
// a quien prueba la app desde otra parte de la ciudad, como en un hackatón.
import { distanciaM } from './distancia'
import type { Punto } from './tipos'

/** El Zócalo, corazón del Centro Histórico. */
export const ZOCALO: Punto = { lat: 19.20023, lng: -96.13853 }
/** Más lejos que esto del Zócalo se considera "lejos del Centro": no se puede llegar a los lugares a pie. */
export const RADIO_CENTRO_M = 2000

export const distanciaAlCentro = (pos: Punto) => distanciaM(pos, ZOCALO)

export const estaLejosDelCentro = (pos: Punto | null) => !!pos && distanciaAlCentro(pos) > RADIO_CENTRO_M
