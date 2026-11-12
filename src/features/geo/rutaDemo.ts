// Ruta de la demo (5 paradas) guardada en el código, siguiendo las calles (ver rutaDemoCalles.ts).
import seed from '../../data/seed.json'
import { crearRecorrido } from './recorridoVirtual'
import { TRAMOS_DEMO } from './rutaDemoCalles'
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

/** Trazado de calles completo de la demo ([lng, lat]), para dibujar la línea azul. */
export const LINEA_DEMO: [number, number][] = [
  [PARADAS_DEMO[0].lng, PARADAS_DEMO[0].lat],
  ...TRAMOS_DEMO.flatMap((tramo, i) => [...tramo, [PARADAS_DEMO[i + 1].lng, PARADAS_DEMO[i + 1].lat] as [number, number]]),
]

export const RECORRIDO_DEMO = crearRecorrido(PARADAS_DEMO, TRAMOS_DEMO)
