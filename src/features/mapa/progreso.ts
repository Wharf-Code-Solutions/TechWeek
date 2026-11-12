// M4/M7 · Lógica pura del progreso de la ruta (cabecera, marcadores y pestaña Ruta).
import type { Lugar } from '../../types/contratos'

/** Siguiente parada (la primera sin reto completado) y cuántas van hechas. */
export function progresoRuta(ruta: Lugar[], hechos: ReadonlySet<string>) {
  return {
    siguiente: ruta.find((l) => !hechos.has(l.slug)) ?? null,
    completados: ruta.filter((l) => hechos.has(l.slug)).length,
    total: ruta.length,
  }
}

/** "120 m" o "1.2 km", redondeado a 10 m. */
export const formatoDistancia = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`)

/** Minutos caminando a ~80 m/min, mínimo 1. */
export const minutosCaminando = (m: number) => Math.max(1, Math.round(m / 80))

/**
 * "Me queda poco tiempo": conserva las paradas ya hechas (cuentan para el bono) y solo las
 * próximas `n` pendientes. Devuelve los slugs en el orden de la ruta, listos para ajustarRuta().
 */
export function recortarRuta(ruta: Lugar[], hechos: ReadonlySet<string>, n = 2) {
  const quedan = new Set(ruta.filter((l) => !hechos.has(l.slug)).slice(0, n).map((l) => l.slug))
  return ruta.filter((l) => hechos.has(l.slug) || quedan.has(l.slug)).map((l) => l.slug)
}
