// M5 · Al llegar a un lugar, la app abre su pantalla "¡Llegaste!" una sola vez por lugar.
// Dev 2: úsalo en Mapa.tsx con los lugares de la ruta: useIrAlLlegar(lugares)
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Lugar } from '../../types/contratos'
import { useLlegada } from './useLlegada'
import { usePosition } from './usePosition'

// A nivel de módulo: sobrevive a que el mapa se desmonte al abrir la pantalla del lugar,
// así no se vuelve a abrir en bucle mientras el turista sigue dentro del radio.
const avisados = new Set<string>()

export const yaAvisado = (slug: string) => avisados.has(slug)

export function useIrAlLlegar(lugares: Lugar[]) {
  const pos = usePosition()
  const { lugarActual } = useLlegada(lugares, pos)
  const navegar = useNavigate()

  useEffect(() => {
    if (!lugarActual || avisados.has(lugarActual.slug)) return
    avisados.add(lugarActual.slug)
    navegar(`/lugar/${lugarActual.slug}`)
  }, [lugarActual, navegar])
}
