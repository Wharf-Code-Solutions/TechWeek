// Modo ligero del mapa: sin edificios 3D, con menos inclinación y sin animaciones continuas, para celulares modestos.
// Se activa solo (equipo modesto o fotogramas lentos) o a mano desde el menú del mapa; se recuerda en la sesión.
import { useSyncExternalStore } from 'react'

const CLAVE = 'jarana.mapa.ligero'

/** Inclinación del mapa normal y del modo ligero (grados). */
export const INCLINACION = 55
export const INCLINACION_LIGERA = 30

/** Por debajo de estos cuadros por segundo (promedio) el mapa se pasa solo al modo ligero. */
export const FPS_MINIMOS = 24

interface NavegadorExtra {
  deviceMemory?: number
  connection?: { saveData?: boolean; effectiveType?: string }
}

/** ¿El equipo o la conexión parecen modestos? (poca memoria, pocos núcleos, ahorro de datos o red 2G/3G) */
export function equipoModesto(nav: (Navigator & NavegadorExtra) | undefined = typeof navigator === 'undefined' ? undefined : navigator): boolean {
  if (!nav) return false
  const c = nav.connection
  return (
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
    (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) ||
    !!c?.saveData ||
    /^(slow-2g|2g|3g)$/.test(c?.effectiveType ?? '')
  )
}

/** Promedio de cuadros por segundo según los milisegundos entre cuadros (null si no hay datos). */
export function fpsPromedio(deltas: number[]): number | null {
  if (!deltas.length) return null
  return 1000 / (deltas.reduce((a, b) => a + b, 0) / deltas.length)
}

type Preferencia = 'auto' | 'si' | 'no'

function leer(): Preferencia {
  try {
    const v = sessionStorage.getItem(CLAVE)
    return v === 'si' || v === 'no' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

let preferencia: Preferencia = leer()
// Decisión automática de esta visita (equipo modesto o fps bajos); la preferencia manual manda sobre ella.
let automatico = preferencia === 'auto' && equipoModesto()
const oyentes = new Set<() => void>()

const calcular = () => (preferencia === 'si' ? true : preferencia === 'no' ? false : automatico)
let valor = calcular()

function publicar() {
  const nuevo = calcular()
  if (nuevo === valor) return
  valor = nuevo
  oyentes.forEach((o) => o())
}

export const esLigero = () => valor
const suscribir = (o: () => void) => {
  oyentes.add(o)
  return () => void oyentes.delete(o)
}
export const useModoLigero = () => useSyncExternalStore(suscribir, esLigero)

/** El turista lo pide o lo quita desde el menú. */
export function fijarLigero(activo: boolean) {
  preferencia = activo ? 'si' : 'no'
  try {
    sessionStorage.setItem(CLAVE, preferencia)
  } catch {
    /* vale solo mientras la pantalla esté abierta */
  }
  publicar()
}

/** Lo activa la medición de fps; no pisa lo que el turista ya eligió a mano. */
export function activarLigeroAuto() {
  if (preferencia !== 'auto') return
  automatico = true
  publicar()
}

/** Solo para pruebas. */
export function reiniciarLigero() {
  preferencia = 'auto'
  automatico = false
  valor = false
}
