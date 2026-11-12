// Componente base: Ilustracion · Responsable: Dev 2 (contrato 4)
// Vector plano sin contorno, del set del diseño (Sistema visual). Cada ilustración es un SVG en
// ./ilustraciones/<nombre>.svg: para cambiar una, se reemplaza el archivo.
// `nombre` es el campo `ilustracion` de los lugares, una categoría o un nombre del set (moneda, puzzle…).
import './ui.css'

const ARCHIVOS = import.meta.glob('./ilustraciones/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<
  string,
  string
>
const SVG: Record<string, string> = Object.fromEntries(
  Object.entries(ARCHIVOS).map(([ruta, url]) => [ruta.slice('./ilustraciones/'.length, -'.svg'.length), url]),
)
// Categorías que comparten ilustración con un objeto del set
const ALIAS: Record<string, string> = { leyendas: 'linterna', musica: 'jarana', comida: 'cafe-lechero' }

interface Props {
  nombre: string
  tamano?: number
  /** Texto alternativo traducido; sin él, la ilustración es decorativa */
  alt?: string
}

export default function Ilustracion({ nombre, tamano = 96, alt }: Props) {
  const url = SVG[nombre] ?? SVG[ALIAS[nombre]] ?? SVG.linterna
  return <img className="ilustracion" src={url} width={tamano} height={tamano} alt={alt ?? ''} draggable={false} />
}
