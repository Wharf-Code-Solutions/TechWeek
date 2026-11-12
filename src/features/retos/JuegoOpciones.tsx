// M8 · Retos rápidos de un toque: trivia, verdadero/falso e intruso.
// Tocar una opción la comprueba al instante; las falladas quedan tachadas y no se pueden repetir.
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Check, X } from '@phosphor-icons/react'
import './retos.css'

interface Opcion {
  id: string
  texto: string
}

interface Props {
  enunciado: string
  opciones: Opcion[]
  descartadas: string[]
  deshabilitado: boolean
  /** Verdadero/falso: dos botones grandes lado a lado, con ícono. */
  pareja?: boolean
  onElegir: (id: string) => void
}

export default function JuegoOpciones({ enunciado, opciones, descartadas, deshabilitado, pareja = false, onElegir }: Props) {
  const { t } = useTranslation()
  const reducido = useReducedMotion()
  return (
    <>
      <div className="juego-tarjeta juego-pregunta">
        <p>{enunciado}</p>
      </div>
      <ul className={`juego-rapidas${pareja ? ' juego-rapidas--pareja' : ''}`}>
        {opciones.map((o, i) => {
          const probada = descartadas.includes(o.id)
          const Icono = o.id === 'verdadero' ? Check : X
          return (
            <motion.li
              key={o.id}
              initial={reducido ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reducido ? 0 : i * 0.04, type: 'spring', stiffness: 380, damping: 26 }}
            >
              <button
                type="button"
                className={`juego-rapida${probada ? ' juego-rapida--probada' : ''}${pareja ? ` juego-rapida--${o.id}` : ''}`}
                disabled={deshabilitado || probada}
                aria-label={probada ? t('reto.descartada', { texto: o.texto }) : undefined}
                onClick={() => onElegir(o.id)}
              >
                {pareja && <Icono size={28} weight="bold" aria-hidden="true" />}
                <span>{o.texto}</span>
              </button>
            </motion.li>
          )
        })}
      </ul>
    </>
  )
}
