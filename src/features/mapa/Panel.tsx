// M7 Panel fijo · Dev 2 (diseño 03). Pestañas: Ruta, Agenda (M11), Pasaporte (M9) y Cartera (M10, Dev 3).
// Tres niveles: plegado (solo pestañas), medio (mitad de la pantalla) y completo (pantalla entera, para leer a gusto
// el pasaporte, la cartera o la agenda). Se desliza con el dedo desde la cabecera y también responde al toque.
import { motion } from 'framer-motion'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarBlank, IdentificationCard, MapTrifold, Wallet } from '@phosphor-icons/react'
import { Cartera } from '../cartera'
import { Agenda } from '../agenda'
import { Pasaporte } from '../pasaporte'
import { NIVELES, altoNivel, bajarNivel, subirNivel, type Nivel } from './nivelesPanel'
import './mapa.css'

const PESTANAS = ['ruta', 'agenda', 'pasaporte', 'cartera'] as const
export type Pestana = (typeof PESTANAS)[number]

const ICONOS = { ruta: MapTrifold, agenda: CalendarBlank, pasaporte: IdentificationCard, cartera: Wallet }

interface Props {
  activa: Pestana
  onActiva: (p: Pestana) => void
  nivel: Nivel
  onNivel: (n: Nivel) => void
  /** Contenido de la pestaña Ruta (vive en la pantalla del mapa, que tiene la ruta). */
  ruta: ReactNode
}

const UMBRAL_PX = 40
const UMBRAL_VELOCIDAD = 400 // px/s

export default function Panel({ activa, onActiva, nivel, onNivel, ruta }: Props) {
  const { t } = useTranslation()
  // Mientras se arrastra, el panel sigue al dedo; al soltar salta al nivel más cercano en esa dirección.
  const [arrastre, setArrastre] = useState<number | null>(null)
  const deslizando = useRef(false)
  const alto =
    arrastre === null
      ? undefined
      : Math.min(Math.max(altoNivel(nivel, window.innerHeight) - arrastre, altoNivel('plegado', window.innerHeight)), altoNivel('completo', window.innerHeight))

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
      className={`panel panel--${nivel}${arrastre !== null ? ' panel--arrastrando' : ''}`}
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
          if (info.offset.y > UMBRAL_PX || info.velocity.y > UMBRAL_VELOCIDAD) onNivel(bajarNivel(nivel))
          else if (info.offset.y < -UMBRAL_PX || info.velocity.y < -UMBRAL_VELOCIDAD) onNivel(subirNivel(nivel))
        }}
      >
        <button
          type="button"
          className="panel-asa"
          aria-expanded={nivel !== 'plegado'}
          aria-controls="panel-contenido"
          aria-label={nivel === 'plegado' ? t('panel.mostrar') : t('panel.ocultar')}
          // Un toque alterna entre plegado y medio; para la pantalla completa se desliza hacia arriba.
          onClick={() => onNivel(nivel === 'plegado' ? 'medio' : 'plegado')}
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
                  if (nivel === 'plegado') onNivel('medio')
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

export { NIVELES }
export type { Nivel }
