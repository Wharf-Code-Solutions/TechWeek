// Datos que se muestran al compartir una ruta terminada.
export interface DatosCompartir {
  /** Título de la imagen del rompecabezas (ya en el idioma del turista). */
  titulo: string
  paradas: number
  tlacos?: number
  metros?: number
  piezas: { ganadas: number; total: number; indices: number[] }
  /** Imagen del rompecabezas; sin ella se pintan las piezas de colores. */
  fotoUrl: string | null
}

/** 850 → "850 m"; 1234 → "1.2 km". */
export function distanciaLegible(metros: number): string {
  return metros >= 1000 ? `${(metros / 1000).toFixed(1)} km` : `${Math.round(metros)} m`
}

/** Pares [etiqueta ya traducida, valor] para dibujar las tarjetas. Omite los datos que faltan. */
export function cifras(
  d: Pick<DatosCompartir, 'paradas' | 'tlacos' | 'metros'>,
  etiquetas: { paradas: string; tlacos: string; distancia: string },
): [string, string][] {
  const filas: [string, string][] = [[etiquetas.paradas, String(d.paradas)]]
  if (d.tlacos !== undefined) filas.push([etiquetas.tlacos, String(d.tlacos)])
  if (d.metros !== undefined && d.metros > 0) filas.push([etiquetas.distancia, distanciaLegible(d.metros)])
  return filas
}
