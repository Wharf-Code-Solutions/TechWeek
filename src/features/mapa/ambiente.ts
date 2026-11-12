// Fachadas de colores del puerto para los edificios 3D (opcional; se activa con el botón del mapa).
// Cada edificio toma un color de la paleta según su identificador: siempre el mismo, sin parpadeos.

/** Colores pastel de las casonas del Centro Histórico. */
export const FACHADAS = ['#F4B8A6', '#F8DE9A', '#B7E0CC', '#F2B3CB', '#BFD3F2', '#E9D1B5'] as const

/** Color de un edificio a partir de su id (los sin id caen en el último color, el neutro). */
export function colorFachada(id: number | undefined): string {
  if (id === undefined || !Number.isFinite(id)) return FACHADAS[FACHADAS.length - 1]
  return FACHADAS[Math.abs(Math.trunc(id)) % FACHADAS.length]
}

/**
 * Expresión de Mapbox con el mismo reparto que colorFachada: ['match', id % n, 0, c0, 1, c1, …, neutro].
 * Muchos edificios de los mosaicos no traen id: para ellos el reparto sale de su altura, así también se pintan.
 */
export function expresionFachadas(): unknown[] {
  const n = FACHADAS.length
  const pares = FACHADAS.slice(0, n - 1).flatMap((c, i) => [i, c])
  const respaldo = ['floor', ['*', ['to-number', ['get', 'height'], 6], 7.3]]
  return ['match', ['%', ['to-number', ['id'], respaldo], n], ...pares, FACHADAS[n - 1]]
}

/** Los edificios propios se dibujan un poco más altos para tapar los blancos del estilo base sin apagarlos. */
export const SOBREALTURA_M = 0.4
