// Transición de olas entre el mapa y la pantalla de un lugar: en vez de abrir la pantalla de golpe, una ola sube y la
// cubre, y al abrirse el lugar la ola sigue de largo y lo descubre. El estado vive fuera de React para que sobreviva
// al cambio de pantalla (el mapa se desmonta y ¡Llegaste! se monta mientras las olas siguen cubriendo).
import { useSyncExternalStore } from 'react'

export type EstadoOlas = 'oculto' | 'cubriendo' | 'descubriendo'

/** Lo que tarda la ola en subir y cubrir la pantalla, y en irse (ms). */
export const DURACION_OLAS_MS = 700
/** Si la pantalla nueva no avisa, las olas se retiran solas para no dejar la app tapada. */
const SEGURO_MS = 4000

let estado: EstadoOlas = 'oculto'
const oyentes = new Set<() => void>()
let seguro: number | undefined
let retirada: number | undefined

function cambiar(nuevo: EstadoOlas) {
  estado = nuevo
  oyentes.forEach((o) => o())
}

export const estadoOlas = () => estado
export const suscribirOlas = (o: () => void) => {
  oyentes.add(o)
  return () => oyentes.delete(o)
}

/** Sube la ola y cubre la pantalla. Resuelve cuando ya cubre (momento de cambiar de pantalla). */
export function cubrirConOlas(): Promise<void> {
  window.clearTimeout(retirada)
  window.clearTimeout(seguro)
  cambiar('cubriendo')
  // Si la pantalla nueva nunca llama a descubrirOlas, se retiran solas.
  seguro = window.setTimeout(descubrirOlas, SEGURO_MS)
  return new Promise((resolver) => window.setTimeout(resolver, DURACION_OLAS_MS))
}

/** La ola sigue de largo y deja ver la pantalla nueva. Sin efecto si no estaban cubriendo. */
export function descubrirOlas() {
  window.clearTimeout(seguro)
  if (estado !== 'cubriendo') return
  cambiar('descubriendo')
  retirada = window.setTimeout(() => cambiar('oculto'), DURACION_OLAS_MS)
}

export const useEstadoOlas = () => useSyncExternalStore(suscribirOlas, estadoOlas)
