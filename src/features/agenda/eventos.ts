// M11 · Lógica pura de la agenda.
import type { Evento } from '../../types/contratos'

/** Eventos que no han terminado, del más próximo al más lejano. */
export function eventosVigentes(eventos: Evento[], ahora = Date.now()): Evento[] {
  return eventos
    .filter((e) => Date.parse(e.fin) > ahora)
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))
}

export const enCurso = (e: Evento, ahora = Date.now()) => Date.parse(e.inicio) <= ahora && ahora < Date.parse(e.fin)

const ZONA = 'America/Mexico_City'
const fechaVeracruz = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' })

/** Día en Veracruz como "AAAA-MM-DD", aunque el celular esté en otra zona. */
export const diaVeracruz = (fecha: string | number | Date) => fechaVeracruz.format(new Date(fecha))

/** Los próximos `n` días (hoy incluido) en Veracruz. */
export function proximosDias(n = 5, ahora = Date.now()) {
  return Array.from({ length: n }, (_, i) => diaVeracruz(ahora + i * 86_400_000))
}
