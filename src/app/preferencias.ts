// Preferencias del turista (pantalla 01). Viven en el celular; Dev 1 las usará para armar la ruta (M3).
import type { Categoria, Idioma } from '../types/contratos'

export const TIEMPOS_MIN = [30, 60, 120, 240] as const
export const INTERESES: Categoria[] = ['historia', 'leyendas', 'musica', 'comida', 'mar', 'artesania']

export interface Preferencias {
  idioma: Idioma
  tiempoMin: number
  intereses: Categoria[]
}

const CLAVE = 'jarana.preferencias'

export const PREFERENCIAS_INICIALES: Preferencias = { idioma: 'es', tiempoMin: 60, intereses: [] }

/** Acepta cualquier cosa guardada y devuelve preferencias válidas. */
export function normalizar(crudo: unknown): Preferencias {
  const p = (crudo ?? {}) as Partial<Preferencias>
  return {
    idioma: p.idioma === 'en' ? 'en' : 'es',
    tiempoMin: (TIEMPOS_MIN as readonly number[]).includes(p.tiempoMin ?? -1)
      ? (p.tiempoMin as number)
      : PREFERENCIAS_INICIALES.tiempoMin,
    intereses: Array.isArray(p.intereses) ? p.intereses.filter((i) => INTERESES.includes(i)) : [],
  }
}

export function cargarPreferencias(): Preferencias {
  try {
    return normalizar(JSON.parse(localStorage.getItem(CLAVE) ?? 'null'))
  } catch {
    return PREFERENCIAS_INICIALES
  }
}

export function guardarPreferencias(p: Preferencias) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(p))
  } catch {
    /* sin almacenamiento: se usan solo en esta visita */
  }
}
