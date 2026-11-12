// Vitrina de comercios: lógica pura (tipos, filtro, orden e ilustración). La pantalla vive en pages/Vitrina.tsx.
import type { Comercio, TipoComercio } from '../../types/contratos'
import { distanciaM } from '../geo/distancia'
import type { Punto } from '../geo/tipos'

/** Tipos de la vitrina, en el orden de los filtros. */
export const TIPOS: TipoComercio[] = [
  'cafeteria',
  'restaurante',
  'fonda',
  'neveria',
  'mercado',
  'libreria',
  'artesanias',
  'tienda',
]

// Ilustración del set que representa a cada tipo cuando el comercio no tiene foto.
const ILUSTRACION: Record<TipoComercio, string> = {
  cafeteria: 'cafe-lechero',
  restaurante: 'comida',
  fonda: 'volovan',
  neveria: 'nieve',
  mercado: 'artesania',
  libreria: 'historia',
  artesanias: 'artesania',
  tienda: 'jarana',
}

export const ilustracionDeTipo = (tipo: TipoComercio) => ILUSTRACION[tipo]

/** Comercios del tipo pedido (todos si es null), con los aliados primero y luego por nombre. */
export function filtrarComercios(comercios: Comercio[], tipo: TipoComercio | null): Comercio[] {
  return comercios
    .filter((c) => tipo === null || c.tipo === tipo)
    .sort((a, b) => Number(b.aliado) - Number(a.aliado) || a.nombre.localeCompare(b.nombre, 'es'))
}

/** Cuántos comercios hay de cada tipo (solo los que tienen al menos uno). */
export function contarPorTipo(comercios: Comercio[]): Partial<Record<TipoComercio, number>> {
  const cuenta: Partial<Record<TipoComercio, number>> = {}
  for (const c of comercios) cuenta[c.tipo] = (cuenta[c.tipo] ?? 0) + 1
  return cuenta
}

/** Tipos que cuentan como "restaurantes disponibles": lugares donde comer o tomar algo. */
export const TIPOS_COMIDA: TipoComercio[] = ['cafeteria', 'restaurante', 'fonda', 'neveria']

export interface ComercioCercano {
  comercio: Comercio
  /** Metros desde el turista; null si no hay posición. */
  metros: number | null
}

/** Lugares de comer, con los aliados primero y luego por cercanía (por nombre si no hay posición). */
export function comidaCercana(comercios: Comercio[], pos: Punto | null): ComercioCercano[] {
  return comercios
    .filter((c) => TIPOS_COMIDA.includes(c.tipo))
    .map((comercio) => ({ comercio, metros: pos ? distanciaM(pos, comercio) : null }))
    .sort(
      (a, b) =>
        Number(b.comercio.aliado) - Number(a.comercio.aliado) ||
        (a.metros !== null && b.metros !== null ? a.metros - b.metros : 0) ||
        a.comercio.nombre.localeCompare(b.comercio.nombre, 'es'),
    )
}
