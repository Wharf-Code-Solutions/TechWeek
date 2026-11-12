// Set de ilustraciones del diseño: cada una es ./ilustraciones/<nombre>.svg (para cambiar una, se reemplaza el archivo).
const ARCHIVOS = import.meta.glob('./ilustraciones/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<
  string,
  string
>
const SVG: Record<string, string> = Object.fromEntries(
  Object.entries(ARCHIVOS).map(([ruta, url]) => [ruta.slice('./ilustraciones/'.length, -'.svg'.length), url]),
)
// Categorías que comparten ilustración con un objeto del set
const ALIAS: Record<string, string> = { leyendas: 'linterna', musica: 'jarana', comida: 'cafe-lechero' }

/** URL de la ilustración; si no existe, la linterna. */
export const urlIlustracion = (nombre: string) => SVG[nombre] ?? SVG[ALIAS[nombre]] ?? SVG.linterna
