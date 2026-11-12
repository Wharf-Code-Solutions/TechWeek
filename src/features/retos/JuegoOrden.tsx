// M8 · "Orden cronológico" (diseño 07): subir y bajar con botones (accesible y sin arrastrar en pantallas chicas).
// Los años no se muestran: delatarían la respuesta.
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, DotsSixVertical } from '@phosphor-icons/react'
import type { ContenidoOrden } from '../../types/contratos'
import { mover } from './logica'
import './retos.css'

// Medallas de la posición: [fondo, texto]
const MEDALLAS: [string, string][] = [
  ['var(--amarillo)', 'var(--tinta)'],
  ['var(--rosa)', '#fff'],
  ['var(--verde)', 'var(--tinta)'],
  ['var(--naranja)', 'var(--tinta)'],
]

interface Props {
  contenido: Omit<ContenidoOrden, 'orden_correcto'>
  valor: string[]
  onCambio: (v: string[]) => void
}

export default function JuegoOrden({ contenido, valor, onCambio }: Props) {
  const { t } = useTranslation()
  const textos = Object.fromEntries(contenido.eventos.map((e) => [e.id, e.texto]))
  return (
    <ol className="juego-orden">
      {valor.map((id, i) => {
        const [fondo, texto] = MEDALLAS[i % MEDALLAS.length]
        return (
          <li key={id}>
            <span className="juego-medalla" style={{ background: fondo, color: texto }} aria-hidden="true">
              {i + 1}
            </span>
            <div className="juego-evento">
              <DotsSixVertical size={18} weight="bold" aria-hidden="true" className="juego-asa" />
              <span className="juego-evento-texto">{textos[id]}</span>
              <div className="juego-flechas">
                <button
                  type="button"
                  aria-label={t('reto.subir', { texto: textos[id] })}
                  disabled={i === 0}
                  onClick={() => onCambio(mover(valor, i, -1))}
                >
                  <ArrowUp size={18} weight="bold" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={t('reto.bajar', { texto: textos[id] })}
                  disabled={i === valor.length - 1}
                  onClick={() => onCambio(mover(valor, i, 1))}
                >
                  <ArrowDown size={18} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
