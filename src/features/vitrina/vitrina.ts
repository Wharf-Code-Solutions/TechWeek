// Vitrina de comercios: lógica pura (tipos, filtro, orden e ilustración). La pantalla vive en pages/Vitrina.tsx.
import type { Comercio, TipoComercio } from '../../types/contratos'

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
