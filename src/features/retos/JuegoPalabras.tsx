// M8 · "Completa la leyenda" (diseño 06): arrastrar una opción a un hueco, o tocarla para ponerla en el siguiente
// hueco libre; tocar un hueco lo vacía.
// Cada palabra tiene su color, y el hueco lleno toma el color de su palabra.
import { motion } from 'framer-motion'
import { useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContenidoPalabras } from '../../types/contratos'
import { colocar, colocarEn, indiceHueco, quitar } from './logica'
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
  // Hueco bajo el dedo mientras se arrastra (se resalta) y bandera para que el toque posterior al arrastre no cuente.
  const [sobre, setSobre] = useState<number | null>(null)
  const arrastrando = useRef(false)
  const huecoEn = (x: number, y: number): number | null => {
    const el = document.elementsFromPoint(x, y).find((e) => e instanceof HTMLElement && e.dataset.hueco !== undefined)
    return el instanceof HTMLElement ? Number(el.dataset.hueco) : null
  }
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
                data-hueco={h}
                className={`juego-hueco${palabra ? ' juego-hueco--lleno' : ''}${sobre === h ? ' juego-hueco--sobre' : ''}`}
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
            <motion.button
              key={o}
              type="button"
              className="juego-opcion"
              style={usada ? undefined : color(o)}
              disabled={usada}
              drag={!usada}
              dragSnapToOrigin
              dragMomentum={false}
              whileDrag={{ scale: 1.1, zIndex: 20 }}
              onDragStart={() => {
                arrastrando.current = true
              }}
              onDrag={(_, info) => setSobre(huecoEn(info.point.x - window.scrollX, info.point.y - window.scrollY))}
              onDragEnd={(_, info) => {
                const h = huecoEn(info.point.x - window.scrollX, info.point.y - window.scrollY)
                setSobre(null)
                if (h !== null) onCambio(colocarEn(valor, o, h))
                // El clic que sigue a soltar no debe volver a colocar la palabra.
                setTimeout(() => {
                  arrastrando.current = false
                }, 0)
              }}
              onClick={() => !arrastrando.current && onCambio(colocar(valor, o))}
            >
              {o}
            </motion.button>
          )
        })}
      </div>
    </>
  )
}
