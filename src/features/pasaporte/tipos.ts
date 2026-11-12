// M9 · Respuesta de GET /api/pasaporte (docs/backend.md).
import type { Categoria, FotoHistorica } from '../../types/contratos'

export interface Sello {
  lugar_slug: string
  nombre_es: string
  nombre_en: string
  categoria: Categoria
  ilustracion: string
  /** false: cerró el reto con "seguir con menos Tlacos". */
  acerto: boolean
  tlacos: number
  fecha: string
}

export interface PasaporteDatos {
  sellos: Sello[]
  piezas: { total: number; ganadas: number; indices: number[]; completa: boolean }
  foto: FotoHistorica | null
  ruta_terminada: boolean
}

/** Rompecabezas en rejilla de 3 columnas: posición de la pieza `i` como background-position. */
export function posicionPieza(i: number, total: number, columnas = 3) {
  const filas = Math.ceil(total / columnas)
  const col = i % columnas
  const fila = Math.floor(i / columnas)
  const pct = (n: number, max: number) => (max > 1 ? (n / (max - 1)) * 100 : 0)
  return `${pct(col, columnas)}% ${pct(fila, filas)}%`
}
