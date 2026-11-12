// Componente base: Banderines (papel picado) · Responsable: Dev 2 (contrato 4)
// Decorativo: se oculta a lectores de pantalla.
import './ui.css'

const COLORES = ['var(--rosa)', 'var(--amarillo)', 'var(--turquesa)', 'var(--naranja)', 'var(--morado)', 'var(--verde)']
const N = 12

interface Props {
  /** Franja de color tinta detrás de los banderines */
  fondo?: boolean
  /** Dibuja la cuerda de la que cuelgan */
  cuerda?: boolean
}

export default function Banderines({ fondo, cuerda }: Props) {
  return (
    <svg
      className={`banderines${fondo ? ' banderines--fondo' : ''}`}
      viewBox={`0 0 ${N * 20} 24`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {cuerda && <line x1="0" y1="2" x2={N * 20} y2="2" stroke={fondo ? '#fff' : 'var(--tinta)'} strokeWidth="1.5" />}
      {Array.from({ length: N }, (_, i) => (
        <polygon
          key={i}
          points={`${i * 20 + 2},2 ${i * 20 + 18},2 ${i * 20 + 10},22`}
          fill={COLORES[i % COLORES.length]}
          stroke="var(--tinta)"
          strokeWidth="1"
        />
      ))}
    </svg>
  )
}
