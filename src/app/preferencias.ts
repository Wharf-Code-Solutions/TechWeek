// Preferencias del turista (pantalla 01). Viven en el celular; Dev 1 las usará para armar la ruta (M3).
import type { Categoria, Idioma } from '../types/contratos'

/** Tiempo disponible: de 30 min a 8 h, en pasos de 15 min (el servidor acepta de 15 a 480). */
export const TIEMPO_MIN = 30
export const TIEMPO_MAX = 480
export const TIEMPO_PASO = 15
/** Atajos rápidos del deslizador (minutos). */
export const TIEMPOS_ATAJO = [60, 120, 240] as const

/** Redondea al paso de 15 min y limita al rango permitido. */
export const ajustarTiempo = (min: number) =>
  Math.min(TIEMPO_MAX, Math.max(TIEMPO_MIN, Math.round(min / TIEMPO_PASO) * TIEMPO_PASO))

/** "45 min", "2 h", "2 h 15 min" (las horas abreviadas son iguales en español e inglés). */
export function formatoTiempo(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
export const INTERESES: Categoria[] = ['historia', 'leyendas', 'musica', 'comida', 'mar', 'artesania']

/** Dos personajes jarochos (jarocho y jarocha): el elegido aparece en el mapa y en el pasaporte. */
export const AVATARES = ['avatar-sombrero', 'avatar-flor'] as const
export type Personaje = (typeof AVATARES)[number]
export const APODO_MAX = 20

export interface Preferencias {
  idioma: Idioma
  tiempoMin: number
  intereses: Categoria[]
  personaje: Personaje
  apodo: string
}

const CLAVE = 'jarana.preferencias'

export const PREFERENCIAS_INICIALES: Preferencias = {
  idioma: 'es',
  tiempoMin: 60,
  intereses: [],
  personaje: 'avatar-flor',
  apodo: '',
}

/** Acepta cualquier cosa guardada y devuelve preferencias válidas. */
export function normalizar(crudo: unknown): Preferencias {
  const p = (crudo ?? {}) as Partial<Preferencias>
  return {
    idioma: p.idioma === 'en' ? 'en' : 'es',
    tiempoMin:
      typeof p.tiempoMin === 'number' && Number.isFinite(p.tiempoMin)
        ? ajustarTiempo(p.tiempoMin)
        : PREFERENCIAS_INICIALES.tiempoMin,
    intereses: Array.isArray(p.intereses) ? p.intereses.filter((i) => INTERESES.includes(i)) : [],
    personaje: AVATARES.includes(p.personaje as Personaje) ? (p.personaje as Personaje) : PREFERENCIAS_INICIALES.personaje,
    apodo: typeof p.apodo === 'string' ? p.apodo.trim().slice(0, APODO_MAX) : '',
  }
}

/** Para armar la ruta hace falta al menos un interés. */
export const tieneIntereses = (p: Pick<Preferencias, 'intereses'>) => p.intereses.length > 0

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
