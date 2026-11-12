// M8 · "Completa la leyenda" (diseño 06): tocar una opción la pone en el siguiente hueco; tocar un hueco lo vacía.
// Cada palabra tiene su color, y el hueco lleno toma el color de su palabra.
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContenidoPalabras } from '../../types/contratos'
import { colocar, indiceHueco, quitar } from './logica'
import './retos.css'

// [fondo, texto]: texto blanco solo donde el contraste pasa 4.5:1
const COLORES: [string, string][] = [
  ['var(--turquesa)', 'var(--tinta)'],
  ['var(--verde)', 'var(--tinta)'],
  ['var(--rosa)', '#fff'],
  ['#fff', 'var(--tinta)'],
  ['var(--naranja)', 'var(--tinta)'],
  ['var(--amarillo)', 'var(--tinta)'],
]

interface Props {
  contenido: Omit<ContenidoPalabras, 'respuestas'>
  valor: (string | null)[]
  onCambio: (v: (string | null)[]) => void
}

export default function JuegoPalabras({ contenido, valor, onCambio }: Props) {
  const { t } = useTranslation()
  const color = (palabra: string): CSSProperties => {
    const [fondo, texto] = COLORES[Math.max(contenido.opciones.indexOf(palabra), 0) % COLORES.length]
    return { background: fondo, color: texto }
  }

  return (
    <>
      <div className="juego-tarjeta">
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
                style={palabra ? color(palabra) : undefined}
                aria-label={palabra ? t('reto.quitar', { palabra }) : t('reto.hueco', { n: h + 1 })}
                onClick={() => palabra && onCambio(quitar(valor, h))}
              >
                {palabra ?? ' '}
              </button>
            )
          })}
        </p>
      </div>
      <div className="juego-opciones">
        {contenido.opciones.map((o) => {
          const usada = valor.includes(o)
          return (
            <button
              key={o}
              type="button"
              className="juego-opcion"
              style={usada ? undefined : color(o)}
              disabled={usada}
              onClick={() => onCambio(colocar(valor, o))}
            >
              {o}
            </button>
          )
        })}
      </div>
    </>
  )
}
