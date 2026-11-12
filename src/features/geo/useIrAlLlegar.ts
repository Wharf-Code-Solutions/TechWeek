// M5 · Al llegar a un lugar, la app avisa y abre su pantalla "¡Llegaste!" una sola vez por lugar.
// Dev 2: úsalo en Mapa.tsx con los lugares de la ruta: const { llegando } = useIrAlLlegar(lugares)
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Lugar } from '../../types/contratos'
import { useLlegada } from './useLlegada'
import { usePosition } from './usePosition'

/** Pausa entre el aviso "¡Llegaste a …!" y la pantalla del lugar: el cambio no debe sentirse como un salto. */
export const PAUSA_LLEGADA_MS = 1400

// A nivel de módulo: sobrevive a que el mapa se desmonte al abrir la pantalla del lugar,
// así no se vuelve a abrir en bucle mientras el turista sigue dentro del radio.
const avisados = new Set<string>()

/** ¿Ya se llegó a este lugar en esta visita? (el mapa lo usa para saber cuál es la siguiente parada) */
export const haLlegado = (slug: string) => avisados.has(slug)

export function useIrAlLlegar(lugares: Lugar[]) {
  const pos = usePosition()
  const { lugarActual } = useLlegada(lugares, pos)
  const navegar = useNavigate()
  const [llegando, setLlegando] = useState<Lugar | null>(null)
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!lugarActual || avisados.has(lugarActual.slug)) return
    avisados.add(lugarActual.slug)
    setLlegando(lugarActual)
    // Sin cancelar al volver a dibujar: aunque el turista se aleje un paso, la pantalla del lugar se abre.
    temporizador.current = window.setTimeout(() => navegar(`/lugar/${lugarActual.slug}`), PAUSA_LLEGADA_MS)
  }, [lugarActual, navegar])

  // Solo se cancela si el mapa se cierra antes (por ejemplo, el turista abre otra pantalla).
  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  return { llegando }
}
