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
  ruta_id: number | null
}

/**
 * Diseño del rompecabezas para `total` piezas: filas de 2 o 3 tiras (1 si solo hay una).
 * Las filas se reparten parejo y las más largas quedan abajo: 5 → [2, 3], 7 → [2, 2, 3], 9 → [3, 3, 3].
 */
export function disenoPiezas(total: number): number[] {
  if (total <= 0) return []
  const filas = Math.ceil(total / 3)
  const base = Math.floor(total / filas)
  const largas = total - base * filas
  return Array.from({ length: filas }, (_, f) => base + (f >= filas - largas ? 1 : 0))
}

/** Posición de la pieza `i` dentro de su fila: columna, fila y tamaño de su fila, para `background-*`. */
export function lugarDePieza(i: number, total: number) {
  const diseno = disenoPiezas(total)
  let resto = i
  for (let fila = 0; fila < diseno.length; fila++) {
    if (resto < diseno[fila]) return { fila, filas: diseno.length, col: resto, columnas: diseno[fila] }
    resto -= diseno[fila]
  }
  return { fila: 0, filas: diseno.length, col: 0, columnas: diseno[0] ?? 1 }
}

/** `background-position` de la pieza `i` (la foto se estira a `columnas × filas` veces el tamaño de la pieza). */
export function posicionPieza(i: number, total: number) {
  const { fila, filas, col, columnas } = lugarDePieza(i, total)
  const pct = (n: number, max: number) => (max > 1 ? (n / (max - 1)) * 100 : 0)
  return `${pct(col, columnas)}% ${pct(fila, filas)}%`
}

/** Nombre corto para el álbum: "Catedral de la Asunción" → "Catedral", "Zócalo / Plaza de Armas" → "Zócalo". */
export const nombreCorto = (nombre: string) => nombre.split(/\s+(?:de|del|y|\/|of|and)\s+/i)[0]
