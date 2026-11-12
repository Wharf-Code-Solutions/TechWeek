// Brillo que recorre la ruta: una franja clara que viaja por la línea azul de principio a fin y vuelve a empezar.
// Se hace con `line-gradient` (la fuente necesita `lineMetrics`) y se redibuja ~25 veces por segundo.
import type { ExpressionSpecification } from 'mapbox-gl'

export const BRILLO_CICLO_MS = 2800
/** Cada cuántos ms se redibuja la franja (~25 veces por segundo). */
export const BRILLO_PASO_MS = 40
export const BRILLO_ANCHO = 0.14
export const BRILLO_COLOR = '#9FE8FF'

/** Paradas del degradado con la franja en `p` (0 = inicio, 1 = fin; fuera de 0–1 entra o sale de la línea). */
export function paradasBrillo(p: number, base: string, brillo: string, ancho = BRILLO_ANCHO): [number, string][] {
  const paradas: [number, string][] = [[0, base]]
  const poner = (o: number, c: string) => {
    const x = Math.min(1, Math.max(0, o))
    if (x > paradas[paradas.length - 1][0] + 1e-4) paradas.push([x, c])
  }
  poner(p - ancho, base)
  poner(p, brillo)
  poner(p + ancho, base)
  poner(1, base)
  if (paradas.length < 2) paradas.push([1, base])
  return paradas
}

/** Expresión `line-gradient` de Mapbox con la franja de brillo en `p`. */
export function degradadoBrillo(p: number, base: string, brillo: string): ExpressionSpecification {
  return ['interpolate', ['linear'], ['line-progress'], ...paradasBrillo(p, base, brillo).flat()] as ExpressionSpecification
}
