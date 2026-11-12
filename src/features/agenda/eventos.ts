// M11 · Lógica pura de la agenda.
import type { Evento } from '../../types/contratos'

/** Eventos que no han terminado, del más próximo al más lejano. */
export function eventosVigentes(eventos: Evento[], ahora = Date.now()): Evento[] {
  return eventos
    .filter((e) => Date.parse(e.fin) > ahora)
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))
}

export const enCurso = (e: Evento, ahora = Date.now()) => Date.parse(e.inicio) <= ahora && ahora < Date.parse(e.fin)
