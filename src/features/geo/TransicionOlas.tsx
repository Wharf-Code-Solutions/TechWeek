// Capa de olas que cubre la pantalla entre el mapa y ¡Llegaste! (ver olas.ts). Tres olas de colores suben una tras
// otra; al descubrir, siguen de largo hacia arriba. Con "reducir movimiento" solo se atenúa la pantalla.
import { motion, useReducedMotion } from 'framer-motion'
import { DURACION_OLAS_MS, useEstadoOlas } from './olas'
import estilos from './TransicionOlas.module.css'

// De adelante hacia atrás: color y retraso de cada ola.
const OLAS = [
  { color: '#00B5C8', retraso: 0 },
  { color: '#1446C8', retraso: 0.09 },
  { color: '#150A2E', retraso: 0.18 },
] as const

// Borde ondulado de una ola (se repite horizontalmente).
const ONDA = 'M0 40 Q 50 0 100 40 T 200 40 T 300 40 T 400 40 V 120 H 0 Z'

export default function TransicionOlas() {
  const estado = useEstadoOlas()
  const reducido = useReducedMotion()
  const seg = DURACION_OLAS_MS / 1000

  // Posición vertical según el estado: abajo (oculto), cubriendo (0) o ya de largo hacia arriba.
  const y = estado === 'oculto' ? '105%' : estado === 'cubriendo' ? '0%' : '-110%'

  if (reducido) {
    return <div className={estilos.simple} data-visible={estado !== 'oculto'} aria-hidden="true" />
  }

  return (
    <div className={estilos.capa} data-activa={estado !== 'oculto'} aria-hidden="true">
      {OLAS.map((o, i) => (
        <motion.div
          key={o.color}
          className={estilos.ola}
          style={{ zIndex: OLAS.length - i }}
          initial={false}
          animate={{ y }}
          // Al volver a "oculto" se coloca abajo al instante, sin que se vea bajar.
          transition={
            estado === 'oculto'
              ? { duration: 0 }
              : { duration: seg, delay: o.retraso, ease: [0.45, 0, 0.2, 1] }
          }
        >
          <svg className={estilos.borde} viewBox="0 0 400 120" preserveAspectRatio="none">
            <motion.path
              d={ONDA}
              fill={o.color}
              animate={{ x: [0, -200] }}
              transition={{ duration: 2.2 + i * 0.5, repeat: Infinity, ease: 'linear' }}
            />
          </svg>
          <div className={estilos.cuerpo} style={{ background: o.color }} />
        </motion.div>
      ))}
    </div>
  )
}
