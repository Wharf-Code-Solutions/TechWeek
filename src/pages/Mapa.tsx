// Pantalla: Mapa · Responsable: Dev 2 (M4, M7)
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FlagCheckered } from '@phosphor-icons/react'
import { useLugares } from '../app/datos'
import Boton from '../components/ui/Boton'
import { MapaLugares, Panel } from '../features/mapa'
import ControlRecorrido from '../features/geo/ControlRecorrido'
import SaltarParada from '../features/geo/SaltarParada'
import { useIrAlLlegar } from '../features/geo/useIrAlLlegar'
import { api } from '../lib/api'
import type { Lugar } from '../types/contratos'

const NINGUNO: Lugar[] = []

export default function Mapa() {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const todos = useLugares()
  // undefined: cargando · null: sin ruta activa (entró directo o falló la red) · Lugar[]: la ruta
  const [ruta, setRuta] = useState<Lugar[] | null | undefined>(undefined)

  useEffect(() => {
    let vivo = true
    api
      .rutaActual()
      .then((r) => vivo && setRuta(r.lugares))
      .catch(() => vivo && setRuta(null))
    return () => {
      vivo = false
    }
  }, [])

  // Mientras carga la ruta no se vigila nada, para no abrir un lugar que no está en ella.
  useIrAlLlegar(ruta === undefined ? NINGUNO : (ruta ?? todos))

  return (
    <main>
      <h1 className="solo-lectores">{t('pantallas.mapa')}</h1>
      <MapaLugares
        lugares={todos}
        arriba={
          <>
            <ControlRecorrido />
            <SaltarParada ruta={ruta} onCambio={setRuta} />
          </>
        }
        abajo={
          <div className="mapa-botones">
            <Panel />
            {ruta && (
              <Boton variante="blanco" onClick={() => navegar('/fin')}>
                <FlagCheckered size={24} weight="duotone" aria-hidden="true" />
                {t('mapa.terminar')}
              </Boton>
            )}
          </div>
        }
      />
    </main>
  )
}
