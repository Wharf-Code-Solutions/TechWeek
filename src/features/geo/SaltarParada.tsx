// Ajustar ruta · Muestra la siguiente parada y permite saltarla (PATCH /api/rutas/actual).
// Dev 2: móntalo sobre el mapa: <SaltarParada ruta={ruta} onCambio={setRuta} />
import { SkipForward } from '@phosphor-icons/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCampo } from '../../app/idioma'
import Boton from '../../components/ui/Boton'
import { api } from '../../lib/api'
import type { Lugar } from '../../types/contratos'
import { yaAvisado } from './useIrAlLlegar'
import estilos from './SaltarParada.module.css'

interface Props {
  ruta: Lugar[] | null | undefined
  onCambio: (lugares: Lugar[]) => void
}

export default function SaltarParada({ ruta, onCambio }: Props) {
  const { t } = useTranslation()
  const campo = useCampo()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(false)

  if (!ruta) return null
  const siguiente = ruta.find((l) => !yaAvisado(l.slug))
  // Con una sola parada no hay a dónde saltar: se termina la ruta.
  if (!siguiente || ruta.length < 2) return null

  const saltar = async () => {
    setOcupado(true)
    setError(false)
    try {
      const nueva = await api.ajustarRuta(ruta.filter((l) => l.slug !== siguiente.slug).map((l) => l.slug))
      onCambio(nueva.lugares)
    } catch {
      setError(true)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className={estilos.caja}>
      <span className={estilos.texto} role="status">
        {error ? t('ruta.error_saltar') : t('ruta.siguiente', { nombre: campo(siguiente, 'nombre') })}
      </span>
      <Boton variante="blanco" disabled={ocupado} onClick={() => void saltar()}>
        <SkipForward size={24} weight="duotone" aria-hidden="true" />
        {t('ruta.saltar')}
      </Boton>
    </div>
  )
}
