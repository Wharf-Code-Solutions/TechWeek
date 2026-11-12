// M8 · "Completa la leyenda": tocar una opción la pone en el siguiente hueco; tocar un hueco lo vacía.
import { useTranslation } from 'react-i18next'
import Boton from '../../components/ui/Boton'
import type { ContenidoPalabras } from '../../types/contratos'
import { colocar, indiceHueco, quitar } from './logica'
import './retos.css'

interface Props {
  contenido: Omit<ContenidoPalabras, 'respuestas'>
  valor: (string | null)[]
  onCambio: (v: (string | null)[]) => void
}

export default function JuegoPalabras({ contenido, valor, onCambio }: Props) {
  const { t } = useTranslation()
  return (
    <>
      <p className="juego-texto">
        {contenido.texto.map((fragmento, i) => {
          const h = indiceHueco(fragmento)
          if (h === null) return <span key={i}>{fragmento}</span>
          const palabra = valor[h]
          return (
            <button
              key={i}
              type="button"
              className={`juego-hueco${palabra ? ' juego-hueco--lleno' : ''}`}
              aria-label={palabra ? t('reto.quitar', { palabra }) : t('reto.hueco', { n: h + 1 })}
              onClick={() => palabra && onCambio(quitar(valor, h))}
            >
              {palabra ?? ' '}
            </button>
          )
        })}
      </p>
      <div className="juego-opciones">
        {contenido.opciones.map((o) => (
          <Boton key={o} variante="amarillo" disabled={valor.includes(o)} onClick={() => onCambio(colocar(valor, o))}>
            {o}
          </Boton>
        ))}
      </div>
    </>
  )
}
