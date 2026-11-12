// Afluencia: qué tan lleno está cada lugar (la calcula el servidor con las llegadas de la última hora).
// Aquí: el hook que la consulta y la regla pura para sugerir una alternativa tranquila.
import { useEffect, useState } from 'react'
import { api, type Afluencia, type NivelAfluencia } from '../../lib/api'
import type { Lugar } from '../../types/contratos'
import { distanciaM } from '../geo/distancia'

export type { NivelAfluencia }

const CADA_MS = 60_000
/** Una alternativa solo se ofrece si queda a esta distancia (m) del lugar lleno: sigue siendo "por aquí". */
export const RADIO_ALTERNATIVA_M = 600

const NIVELES: readonly NivelAfluencia[] = ['tranquilo', 'concurrido', 'lleno']
const CLAVE_SIMULADA = 'jarana.afluenciaSimulada'

/** "zocalo:lleno,catedral:concurrido" → niveles forzados. Lo que no se entienda se ignora. */
export function parsearSimulada(texto: string | null | undefined): Map<string, NivelAfluencia> {
  const forzados = new Map<string, NivelAfluencia>()
  for (const par of (texto ?? '').split(',')) {
    const [slug, nivel] = par.trim().split(':')
    if (slug && NIVELES.includes(nivel as NivelAfluencia)) forzados.set(slug, nivel as NivelAfluencia)
  }
  return forzados
}

/**
 * Prueba sin llenar la base: abrir la app con `?afluencia=zocalo:lleno,catedral:concurrido` fuerza esos
 * niveles en pantalla (se recuerda en la sesión del navegador; `?afluencia=off` lo quita). Solo cambia lo
 * que ve este navegador: no escribe nada en el servidor ni afecta a otros turistas.
 */
function simulada(): Map<string, NivelAfluencia> {
  try {
    const param = new URLSearchParams(window.location.search).get('afluencia')
    if (param === 'off') sessionStorage.removeItem(CLAVE_SIMULADA)
    else if (param) sessionStorage.setItem(CLAVE_SIMULADA, param)
    return parsearSimulada(sessionStorage.getItem(CLAVE_SIMULADA))
  } catch {
    return new Map()
  }
}

/** Slug → afluencia. Vacío si el servidor no responde (la app funciona igual, sin etiquetas). */
export function useAfluencia(): ReadonlyMap<string, Afluencia> {
  const [mapa, setMapa] = useState<ReadonlyMap<string, Afluencia>>(new Map())
  useEffect(() => {
    let vivo = true
    const forzados = simulada()
    const aplicar = (base: Map<string, Afluencia>) => {
      for (const [slug, nivel] of forzados) {
        const ocupacion = nivel === 'lleno' ? 1.2 : nivel === 'concurrido' ? 0.7 : 0.1
        base.set(slug, { slug, nivel, ocupacion, llegadas: 0, capacidad: 0 })
      }
      return base
    }
    if (forzados.size) setMapa(aplicar(new Map()))
    const cargar = () =>
      api
        .afluencia()
        .then((filas) => vivo && setMapa(aplicar(new Map(filas.map((f) => [f.slug, f])))))
        .catch(() => {})
    void cargar()
    const id = setInterval(cargar, CADA_MS)
    return () => {
      vivo = false
      clearInterval(id)
    }
  }, [])
  return mapa
}

export const nivelDe = (afluencia: ReadonlyMap<string, Afluencia>, slug: string): NivelAfluencia =>
  afluencia.get(slug)?.nivel ?? 'tranquilo'

/**
 * Alternativa para un lugar lleno: otro lugar tranquilo, que no esté ya en la ruta, a menos de
 * RADIO_ALTERNATIVA_M del lleno. Prefiere la misma categoría y, a igualdad, el más cercano.
 */
export function alternativaA(
  lleno: Lugar,
  ruta: readonly Lugar[],
  lugares: readonly Lugar[],
  afluencia: ReadonlyMap<string, Afluencia>,
): Lugar | null {
  const enRuta = new Set(ruta.map((l) => l.slug))
  const candidatos = lugares
    .filter((l) => !enRuta.has(l.slug) && nivelDe(afluencia, l.slug) === 'tranquilo')
    .map((l) => ({ l, m: distanciaM(lleno, l) }))
    .filter((c) => c.m <= RADIO_ALTERNATIVA_M)
    .sort((a, b) => Number(b.l.categoria === lleno.categoria) - Number(a.l.categoria === lleno.categoria) || a.m - b.m)
  return candidatos[0]?.l ?? null
}
