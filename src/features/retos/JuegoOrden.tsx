// M8 · "Orden cronológico" (diseño 07): arrastrar por el asa para reordenar, o subir y bajar con los botones
// (alternativa accesible).
// Los años no se muestran: delatarían la respuesta.
import { Reorder, useDragControls } from 'framer-motion'
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
  const textos = Object.fromEntries(contenido.eventos.map((e) => [e.id, e.texto]))
  return (
    <Reorder.Group as="ol" axis="y" values={valor} onReorder={onCambio} className="juego-orden">
      {valor.map((id, i) => (
        <Fila key={id} id={id} i={i} total={valor.length} texto={textos[id]} onSubir={() => onCambio(mover(valor, i, -1))} onBajar={() => onCambio(mover(valor, i, 1))} />
      ))}
    </Reorder.Group>
  )
}

interface FilaProps {
  id: string
  i: number
  total: number
  texto: string
  onSubir: () => void
  onBajar: () => void
}

/** Una fila arrastrable: solo el asa inicia el arrastre, así la lista sigue desplazándose con el dedo. */
function Fila({ id, i, total, texto, onSubir, onBajar }: FilaProps) {
  const { t } = useTranslation()
  const controles = useDragControls()
  const [fondo, color] = MEDALLAS[i % MEDALLAS.length]
  return (
    <Reorder.Item as="li" value={id} dragListener={false} dragControls={controles} whileDrag={{ scale: 1.03, zIndex: 10 }}>
      <span className="juego-medalla" style={{ background: fondo, color }} aria-hidden="true">
        {i + 1}
      </span>
      <div className="juego-evento">
        <span className="juego-asa" onPointerDown={(e) => controles.start(e)} aria-hidden="true">
          <DotsSixVertical size={22} weight="bold" />
        </span>
        <span className="juego-evento-texto">{texto}</span>
        <div className="juego-flechas">
          <button type="button" aria-label={t('reto.subir', { texto })} disabled={i === 0} onClick={onSubir}>
            <ArrowUp size={18} weight="bold" aria-hidden="true" />
          </button>
          <button type="button" aria-label={t('reto.bajar', { texto })} disabled={i === total - 1} onClick={onBajar}>
            <ArrowDown size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Reorder.Item>
  )
}
