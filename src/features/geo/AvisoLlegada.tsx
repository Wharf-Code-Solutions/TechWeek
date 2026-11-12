// Aviso breve al llegar a una parada: "¡Llegaste a …!". Da un respiro antes de abrir la pantalla del lugar.
import { MapPinLine } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useCampo } from '../../app/idioma'
import type { Lugar } from '../../types/contratos'
import estilos from './AvisoLlegada.module.css'

export default function AvisoLlegada({ lugar }: { lugar: Lugar | null }) {
  const { t } = useTranslation()
  const campo = useCampo()
  if (!lugar) return null
  return (
    <div className={estilos.aviso} role="status">
      <MapPinLine size={26} weight="duotone" aria-hidden="true" />
      <span>{t('recorrido.llegaste', { nombre: campo(lugar, 'nombre') })}</span>
    </div>
  )
}
