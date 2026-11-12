// Ruta de la demo (5 paradas) guardada en el código. Respaldo por si Mapbox Directions falla:
// une las paradas en línea recta; cuando haya token se puede reemplazar por la ruta caminable.
import seed from '../../data/seed.json'
import { crearRecorrido } from './recorridoVirtual'
import type { Punto } from './tipos'

interface LugarSeed extends Punto {
  slug: string
  nombre_es: string
  nombre_en: string
  en_demo: boolean
  orden_sugerido: number
}

export const PARADAS_DEMO: LugarSeed[] = (seed.lugares as LugarSeed[])
  .filter((l) => l.en_demo)
  .sort((a, b) => a.orden_sugerido - b.orden_sugerido)

export const RECORRIDO_DEMO = crearRecorrido(PARADAS_DEMO)
