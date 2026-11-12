// Comercios de la vitrina: la API manda (GET /api/comercios); si falla la red, el seed sirve de respaldo.
import { useEffect, useState } from 'react'
import seed from '../../data/seed.json'
import { api } from '../../lib/api'
import type { Comercio } from '../../types/contratos'

const RESPALDO = seed.comercios as unknown as Comercio[]

export function useVitrina(): { comercios: Comercio[]; cargando: boolean } {
  const [comercios, setComercios] = useState<Comercio[]>(RESPALDO)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    api
      .vitrina()
      .then((lista) => vivo && lista.length && setComercios(lista))
      .catch(() => {})
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [])

  return { comercios, cargando }
}
