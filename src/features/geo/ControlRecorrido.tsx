// M6 · Flechas del recorrido virtual (?demo=1). Solo se muestra en modo demo.
// Dev 2: móntalo sobre el mapa (Mapa.tsx): <ControlRecorrido />
import { ArrowLeft, ArrowRight, SkipForward } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import Boton from '../../components/ui/Boton'
import { esModoDemo, useRecorridoDemo } from './demoStore'
import estilos from './ControlRecorrido.module.css'

function Controles() {
  const { t } = useTranslation()
  const r = useRecorridoDemo()
  const ultima = r.paradas.length - 1
  const siguiente = Math.min(r.parada + 1, ultima)

  return (
    <div className={estilos.control} role="group" aria-label={t('recorrido.etiqueta')}>
      <Boton variante="blanco" aria-label={t('recorrido.retroceder')} onClick={() => r.retroceder()}>
        <ArrowLeft weight="duotone" size={24} aria-hidden="true" />
      </Boton>
      <span className={estilos.parada} role="status">
        {t('recorrido.parada', { actual: r.parada + 1, total: r.paradas.length })}
      </span>
      <Boton variante="blanco" aria-label={t('recorrido.avanzar')} onClick={() => r.avanzar()}>
        <ArrowRight weight="duotone" size={24} aria-hidden="true" />
      </Boton>
      <Boton
        variante="amarillo"
        aria-label={t('recorrido.siguiente')}
        disabled={r.parada >= ultima}
        onClick={() => r.irAParada(siguiente)}
      >
        <SkipForward weight="duotone" size={24} aria-hidden="true" />
      </Boton>
    </div>
  )
}

export default function ControlRecorrido() {
  return esModoDemo() ? <Controles /> : null
}
