// Estado compartido del recorrido virtual (?demo=1). Vive fuera de React para que el mapa,
// las flechas y usePosition() vean la misma posición.
import { useSyncExternalStore } from 'react'
import { PARADAS_DEMO, RECORRIDO_DEMO } from './rutaDemo'

const CLAVE = 'jarana.demo'
const PASO_M = 15

/** True si la URL trae ?demo=1. Se recuerda en la sesión por si la navegación pierde el parámetro. */
export function esModoDemo(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get('demo') === '1') {
      sessionStorage.setItem(CLAVE, '1')
      return true
    }
    return sessionStorage.getItem(CLAVE) === '1'
  } catch {
    return new URLSearchParams(window.location.search).get('demo') === '1'
  }
}

/** Activa el modo demo sin tocar la URL (la bandera se recuerda en la sesión). Quien llama debe volver a dibujar. */
export function activarDemo() {
  try {
    sessionStorage.setItem(CLAVE, '1')
  } catch {
    /* sin almacenamiento: solo funciona con ?demo=1 */
  }
}

let metros = 0
const oyentes = new Set<() => void>()

const emitir = () => oyentes.forEach((o) => o())
export const suscribirDemo = (o: () => void) => {
  oyentes.add(o)
  return () => oyentes.delete(o)
}
export const metrosDemo = () => metros

function mover(destino: number) {
  const nuevo = Math.min(Math.max(destino, 0), RECORRIDO_DEMO.totalM)
  if (nuevo !== metros) {
    metros = nuevo
    emitir()
  }
}

/** Flechas del recorrido: positivo avanza, negativo retrocede. */
export const avanzarDemo = (delta = PASO_M) => mover(metros + delta)
export const retrocederDemo = (delta = PASO_M) => mover(metros - delta)
/** Salta directo a una parada (índice dentro de PARADAS_DEMO). */
export const irAParadaDemo = (indice: number) => mover(RECORRIDO_DEMO.metrosDeParada(indice))
export const reiniciarDemo = () => mover(0)

export function useRecorridoDemo() {
  const m = useSyncExternalStore(suscribirDemo, metrosDemo)
  const punto = RECORRIDO_DEMO.en(m)
  return {
    metros: m,
    ...punto,
    totalM: RECORRIDO_DEMO.totalM,
    parada: RECORRIDO_DEMO.paradaActual(m),
    paradas: PARADAS_DEMO,
    avanzar: avanzarDemo,
    retroceder: retrocederDemo,
    irAParada: irAParadaDemo,
  }
}
