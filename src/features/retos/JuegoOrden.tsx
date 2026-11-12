// M8 · "Orden cronológico": subir y bajar con botones (accesible y sin arrastrar en pantallas chicas).
// Los años no se muestran: delatarían la respuesta.
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp } from '@phosphor-icons/react'
import Boton from '../../components/ui/Boton'
import Tarjeta from '../../components/ui/Tarjeta'
import type { ContenidoOrden } from '../../types/contratos'
import { mover } from './logica'
import './retos.css'

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
      {valor.map((id, i) => (
        <li key={id}>
          <Tarjeta className="juego-evento">
            <span className="juego-numero" aria-hidden="true">{i + 1}</span>
            <span className="juego-evento-texto">{textos[id]}</span>
            <Boton
              variante="blanco"
              aria-label={t('reto.subir', { texto: textos[id] })}
              disabled={i === 0}
              onClick={() => onCambio(mover(valor, i, -1))}
            >
              <ArrowUp size={20} weight="bold" />
            </Boton>
            <Boton
              variante="blanco"
              aria-label={t('reto.bajar', { texto: textos[id] })}
              disabled={i === valor.length - 1}
              onClick={() => onCambio(mover(valor, i, 1))}
            >
              <ArrowDown size={20} weight="bold" />
            </Boton>
          </Tarjeta>
        </li>
      ))}
    </ol>
  )
}
