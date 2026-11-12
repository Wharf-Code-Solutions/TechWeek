// M7 Panel fijo · Dev 2 (diseño 03). Pestañas: Ruta, Agenda (M11), Pasaporte (M9) y Cartera (M10, Dev 3).
// Siempre visible en la mitad inferior; el asa lo pliega para ver más mapa.
import { motion } from 'framer-motion'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
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

const ALTO_PLEGADO = 108 // px; debe coincidir con ALTO_PANEL.plegado de Mapa.tsx
const FRACCION_ABIERTO = 0.48 // del alto de la pantalla (ALTO_PANEL.abierto = 48dvh)
const UMBRAL_PX = 40
const UMBRAL_VELOCIDAD = 400 // px/s

export default function Panel({ activa, onActiva, plegado, onPlegado, ruta }: Props) {
  const { t } = useTranslation()
  // Deslizar la cabecera (asa y pestañas) arriba o abajo abre o pliega el panel; mientras se arrastra, sigue al dedo.
  const [arrastre, setArrastre] = useState<number | null>(null)
  const deslizando = useRef(false)
  const base = plegado ? ALTO_PLEGADO : Math.round(window.innerHeight * FRACCION_ABIERTO)
  const alto = arrastre === null ? undefined : Math.min(Math.max(base - arrastre, ALTO_PLEGADO), window.innerHeight * 0.85)

  // Flechas izquierda/derecha cambian de pestaña (patrón ARIA de tabs)
  function teclas(e: KeyboardEvent) {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    const nueva = PESTANAS[(PESTANAS.indexOf(activa) + delta + PESTANAS.length) % PESTANAS.length]
    onActiva(nueva)
    document.getElementById(`pestana-${nueva}`)?.focus()
  }

  return (
    <section
      className={`panel${plegado ? ' panel--plegado' : ''}${arrastre !== null ? ' panel--arrastrando' : ''}`}
      style={alto === undefined ? undefined : { height: alto }}
      aria-label={t('panel.titulo')}
    >
      <motion.div
        className="panel-cabeza"
        onPanStart={() => {
          deslizando.current = true
        }}
        onPan={(_, info) => deslizando.current && setArrastre(info.offset.y)}
        onPanEnd={(_, info) => {
          deslizando.current = false
          setArrastre(null)
          if (info.offset.y > UMBRAL_PX || info.velocity.y > UMBRAL_VELOCIDAD) onPlegado(true)
          else if (info.offset.y < -UMBRAL_PX || info.velocity.y < -UMBRAL_VELOCIDAD) onPlegado(false)
        }}
      >
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
      </motion.div>
      <div id="panel-contenido" className="panel-contenido" role="tabpanel" aria-labelledby={`pestana-${activa}`}>
        {activa === 'ruta' ? ruta : activa === 'agenda' ? <Agenda /> : activa === 'pasaporte' ? <Pasaporte /> : <Cartera />}
      </div>
    </section>
  )
}
