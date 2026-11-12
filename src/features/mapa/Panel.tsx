// M7 Panel fijo · Dev 2 (diseño 03). Pestañas: Ruta, Agenda (M11), Pasaporte (M9) y Cartera (M10, Dev 3).
// Siempre visible en la mitad inferior; el asa lo pliega para ver más mapa.
import type { KeyboardEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarBlank, IdentificationCard, MapTrifold, Wallet } from '@phosphor-icons/react'
import { Cartera } from '../cartera'
import { Agenda } from '../agenda'
import { Pasaporte } from '../pasaporte'
import './mapa.css'

const PESTANAS = ['ruta', 'agenda', 'pasaporte', 'cartera'] as const
export type Pestana = (typeof PESTANAS)[number]

const ICONOS = { ruta: MapTrifold, agenda: CalendarBlank, pasaporte: IdentificationCard, cartera: Wallet }

interface Props {
  activa: Pestana
  onActiva: (p: Pestana) => void
  plegado: boolean
  onPlegado: (p: boolean) => void
  /** Contenido de la pestaña Ruta (vive en la pantalla del mapa, que tiene la ruta). */
  ruta: ReactNode
}

export default function Panel({ activa, onActiva, plegado, onPlegado, ruta }: Props) {
  const { t } = useTranslation()

  // Flechas izquierda/derecha cambian de pestaña (patrón ARIA de tabs)
  function teclas(e: KeyboardEvent) {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    const nueva = PESTANAS[(PESTANAS.indexOf(activa) + delta + PESTANAS.length) % PESTANAS.length]
    onActiva(nueva)
    document.getElementById(`pestana-${nueva}`)?.focus()
  }

  return (
    <section className={`panel${plegado ? ' panel--plegado' : ''}`} aria-label={t('panel.titulo')}>
      <button
        type="button"
        className="panel-asa"
        aria-expanded={!plegado}
        aria-controls="panel-contenido"
        aria-label={plegado ? t('panel.mostrar') : t('panel.ocultar')}
        onClick={() => onPlegado(!plegado)}
      />
      <div className="panel-pestanas" role="tablist" aria-label={t('panel.titulo')} onKeyDown={teclas}>
        {PESTANAS.map((id) => {
          const Icono = ICONOS[id]
          return (
            <button
              key={id}
              id={`pestana-${id}`}
              type="button"
              role="tab"
              className="panel-pestana"
              aria-selected={id === activa}
              aria-controls="panel-contenido"
              tabIndex={id === activa ? 0 : -1}
              onClick={() => {
                onActiva(id)
                onPlegado(false)
              }}
            >
              <Icono size={22} weight="duotone" aria-hidden="true" />
              {t(`panel.${id}`)}
            </button>
          )
        })}
      </div>
      <div id="panel-contenido" className="panel-contenido" role="tabpanel" aria-labelledby={`pestana-${activa}`}>
        {activa === 'ruta' ? ruta : activa === 'agenda' ? <Agenda /> : activa === 'pasaporte' ? <Pasaporte /> : <Cartera />}
      </div>
    </section>
  )
}
