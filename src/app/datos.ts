// Datos de catálogo para mis pantallas: la API manda; si falla, el seed sirve de respaldo.
// Cuando Dev 1 entregue los hooks de datos (M2, src/hooks) se pueden cambiar por los suyos.
import { useEffect, useState } from 'react'
import seed from '../data/seed.json'
import { api } from '../lib/api'
import type { Lugar } from '../types/contratos'

const LUGARES_SEED = seed.lugares as Lugar[]

export function useLugares(): Lugar[] {
  const [lugares, setLugares] = useState<Lugar[]>(LUGARES_SEED)
  useEffect(() => {
    let vivo = true
    api
      .lugares()
      .then((d) => vivo && d.length && setLugares(d))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])
  return lugares
}

export interface PromoVista {
  slug: string
  titulo_es: string
  titulo_en: string
  costo_tlacos: number
  comercio: string
}

const PROMOS_SEED: PromoVista[] = seed.promociones.map((p) => ({
  slug: p.slug,
  titulo_es: p.titulo_es,
  titulo_en: p.titulo_en,
  costo_tlacos: p.costo_tlacos,
  comercio: seed.comercios.find((c) => c.slug === p.comercio_slug)?.nombre ?? '',
}))

export function usePromociones(): PromoVista[] {
  const [promos, setPromos] = useState<PromoVista[]>(PROMOS_SEED)
  useEffect(() => {
    let vivo = true
    Promise.all([api.promociones(), api.comercios()])
      .then(([ps, cs]) => {
        if (!vivo || !ps.length) return
        setPromos(
          ps.map((p) => ({
            slug: p.slug,
            titulo_es: p.titulo_es,
            titulo_en: p.titulo_en,
            costo_tlacos: p.costo_tlacos,
            comercio: cs.find((c) => c.id === p.comercio_id)?.nombre ?? '',
          })),
        )
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])
  return promos
}
