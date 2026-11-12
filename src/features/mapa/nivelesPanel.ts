// Niveles del panel inferior: lógica pura (alturas y paso entre niveles), con pruebas en nivelesPanel.test.ts.
export const NIVELES = ['plegado', 'medio', 'completo'] as const
export type Nivel = (typeof NIVELES)[number]

/** Alto del panel plegado (solo la cabecera con las pestañas), en px. */
export const ALTO_PLEGADO = 108
/** El nivel medio ocupa esta fracción de la pantalla. */
export const FRACCION_MEDIO = 0.48
/** En pantalla completa queda un margen arriba para que se note que el panel se puede bajar. */
export const MARGEN_COMPLETO = 8

/** Alto en px de un nivel para una pantalla de `alto` px. */
export function altoNivel(nivel: Nivel, alto: number): number {
  if (nivel === 'plegado') return ALTO_PLEGADO
  if (nivel === 'medio') return Math.round(alto * FRACCION_MEDIO)
  return Math.max(alto - MARGEN_COMPLETO, ALTO_PLEGADO)
}

/** Siguiente nivel hacia arriba (se queda en completo). */
export const subirNivel = (n: Nivel): Nivel => NIVELES[Math.min(NIVELES.indexOf(n) + 1, NIVELES.length - 1)]

/** Siguiente nivel hacia abajo (se queda en plegado). */
export const bajarNivel = (n: Nivel): Nivel => NIVELES[Math.max(NIVELES.indexOf(n) - 1, 0)]
