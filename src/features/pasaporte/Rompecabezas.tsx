// M9 · Rejilla del rompecabezas: piezas ganadas con su parte de la foto, las demás con candado.
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LockSimple } from '@phosphor-icons/react'
import { posicionPieza, type PasaporteDatos } from './tipos'
import './pasaporte.css'

// Sin foto, cada pieza ganada se pinta con un color de la paleta.
const COLORES = ['var(--rosa)', 'var(--amarillo)', 'var(--turquesa)', 'var(--naranja)', 'var(--morado)', 'var(--verde)']

interface Props {
  piezas: PasaporteDatos['piezas']
  url: string | null
  /** Índice de la pieza recién ganada: llega con una animación (cae a su lugar y brilla). */
  nueva?: number | null
  /** Segundos de espera antes de animar la pieza nueva (para dar tiempo a otras animaciones). */
  retraso?: number
}

export default function Rompecabezas({ piezas, url, nueva = null, retraso = 0 }: Props) {
  const { t } = useTranslation()
  const reducido = useReducedMotion()
  const filas = Math.ceil(piezas.total / 3)
  return (
    <div
      className="pasaporte-rompecabezas"
      style={{ aspectRatio: `3 / ${filas}` }}
      role="img"
      aria-label={t('pasaporte.piezas', { n: piezas.ganadas, total: piezas.total })}
    >
      {Array.from({ length: piezas.total }, (_, i) => {
        const ganada = piezas.indices.includes(i)
        const estilo = ganada
          ? url
            ? {
                backgroundImage: `url("${url}")`,
                backgroundSize: `300% ${filas * 100}%`,
                backgroundPosition: posicionPieza(i, piezas.total),
              }
            : { background: COLORES[i % COLORES.length] }
          : undefined

        // La pieza recién ganada cae desde arriba, grande y girada, y se acomoda con un rebote.
        if (ganada && nueva === i && !reducido) {
          return (
            <motion.span
              key={i}
              className="pasaporte-pieza pasaporte-pieza--nueva"
              style={estilo}
              initial={{ scale: 3.2, y: -160, rotate: -22, opacity: 0 }}
              animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 150, damping: 13, delay: retraso }}
            />
          )
        }
        return (
          <span key={i} className={`pasaporte-pieza${ganada ? '' : ' pasaporte-pieza--falta'}`} style={estilo}>
            {!ganada && <LockSimple size={22} weight="duotone" aria-hidden="true" />}
          </span>
        )
      })}
    </div>
  )
}
