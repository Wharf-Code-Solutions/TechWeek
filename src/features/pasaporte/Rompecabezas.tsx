// M9 · Rejilla del rompecabezas: piezas ganadas con su parte de la foto, las demás con candado.
import { useTranslation } from 'react-i18next'
import { LockSimple } from '@phosphor-icons/react'
import { posicionPieza, type PasaporteDatos } from './tipos'
import './pasaporte.css'

// Sin foto, cada pieza ganada se pinta con un color de la paleta.
const COLORES = ['var(--rosa)', 'var(--amarillo)', 'var(--turquesa)', 'var(--naranja)', 'var(--morado)', 'var(--verde)']

interface Props {
  piezas: PasaporteDatos['piezas']
  url: string | null
}

export default function Rompecabezas({ piezas, url }: Props) {
  const { t } = useTranslation()
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
        return (
          <span
            key={i}
            className={`pasaporte-pieza${ganada ? '' : ' pasaporte-pieza--falta'}`}
            style={
              ganada
                ? url
                  ? {
                      backgroundImage: `url("${url}")`,
                      backgroundSize: `300% ${filas * 100}%`,
                      backgroundPosition: posicionPieza(i, piezas.total),
                    }
                  : { background: COLORES[i % COLORES.length] }
                : undefined
            }
          >
            {!ganada && <LockSimple size={22} weight="duotone" aria-hidden="true" />}
          </span>
        )
      })}
    </div>
  )
}
