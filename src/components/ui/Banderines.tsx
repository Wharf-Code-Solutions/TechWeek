// Componente base: Banderines de papel picado · Responsable: Dev 2 (contrato 4)
// Firma visual fija arriba (diseño: "Componente · Banderines"). Los recortes toman el color de `fondo`.
// Decorativo: se oculta a lectores de pantalla.
import './ui.css'

const TINTA = '#150A2E'
const LILA = '#DCD6EC'

interface Props {
  /** Color detrás de los banderines (y de los recortes). `true` o vacío = lila. */
  fondo?: string | boolean
  /** Color de la cuerda. `true` o vacío = tinta; `false` la oculta. */
  cuerda?: string | boolean
}

export default function Banderines({ fondo, cuerda = true }: Props) {
  const f = typeof fondo === 'string' ? fondo : LILA
  const c = typeof cuerda === 'string' ? cuerda : TINTA
  return (
    <div className="banderines" style={{ background: f }} aria-hidden="true">
      <svg viewBox="0 0 390 64" width="390" height="64">
        {cuerda !== false && <path d="M-4 4 Q195 26 394 4" fill="none" stroke={c} strokeWidth="1.5" />}
        <g stroke={TINTA} strokeWidth="1.5">
          <g transform="translate(2 6) rotate(-3)">
            <path d="M0 0 h48 v40 l-6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 Z" fill="#E4007C" />
            <g fill={f} stroke="none">
              <circle cx="24" cy="18" r="4" />
              <circle cx="24" cy="9" r="3.5" />
              <circle cx="31.8" cy="13.5" r="3.5" />
              <circle cx="31.8" cy="22.5" r="3.5" />
              <circle cx="24" cy="27" r="3.5" />
              <circle cx="16.2" cy="22.5" r="3.5" />
              <circle cx="16.2" cy="13.5" r="3.5" />
              <circle cx="6" cy="6" r="2" />
              <circle cx="42" cy="6" r="2" />
              <circle cx="6" cy="34" r="2" />
              <circle cx="42" cy="34" r="2" />
            </g>
          </g>
          <g transform="translate(57 11) rotate(2)">
            <path d="M0 0 h48 v40 a6 6 0 0 1 -12 0 a6 6 0 0 1 -12 0 a6 6 0 0 1 -12 0 a6 6 0 0 1 -12 0 Z" fill="#FFD400" />
            <g fill={f} stroke="none">
              <path d="M24 8 L26.9 16 L35.4 16.3 L28.8 21.5 L31.1 29.7 L24 25 L16.9 29.7 L19.2 21.5 L12.6 16.3 L21.1 16 Z" />
              <circle cx="8" cy="36" r="1.8" />
              <circle cx="16" cy="36" r="1.8" />
              <circle cx="32" cy="36" r="1.8" />
              <circle cx="40" cy="36" r="1.8" />
            </g>
          </g>
          <g transform="translate(112 14) rotate(-2)">
            <path d="M0 0 h48 v34 l-24 14 -24 -14 Z" fill="#E5242B" />
            <g fill={f} stroke="none">
              <circle cx="24" cy="20" r="6" />
              <path d="M22 11 L24 6 L26 11Z M22 29 L24 34 L26 29Z M15 18 L10 20 L15 22Z M33 18 L38 20 L33 22Z" />
              <circle cx="17.5" cy="13.5" r="1.8" />
              <circle cx="30.5" cy="13.5" r="1.8" />
              <circle cx="17.5" cy="26.5" r="1.8" />
              <circle cx="30.5" cy="26.5" r="1.8" />
            </g>
          </g>
          <g transform="translate(167 15) rotate(1)">
            <path
              d="M0 0 h48 v42 l-2 6 -2 -6 -2 6 -2 -6 -2 6 -2 -6 -2 6 -2 -6 -2 6 -2 -6 -2 6 -2 -6 -2 6 -2 -6 -2 6 -2 -6 -2 6 -2 -6 -2 6 -2 -6 -2 6 -2 -6 -2 6 -2 -6 Z"
              fill="#22B24C"
            />
            <path
              fill={f}
              stroke="none"
              d="M8 12 l4 -4 4 4 -4 4z M20 12 l4 -4 4 4 -4 4z M32 12 l4 -4 4 4 -4 4z M14 22 l4 -4 4 4 -4 4z M26 22 l4 -4 4 4 -4 4z M8 32 l4 -4 4 4 -4 4z M20 32 l4 -4 4 4 -4 4z M32 32 l4 -4 4 4 -4 4z"
            />
          </g>
          <g transform="translate(222 14) rotate(-2)">
            <path d="M0 0 h48 v40 l-6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 -6 8 -6 -8 Z" fill="#7B2FBE" />
            <g stroke="none">
              <circle cx="24" cy="17" r="9" fill={f} />
              <rect x="19" y="23" width="10" height="7" rx="2" fill={f} />
              <circle cx="20.5" cy="17" r="2.6" fill="#7B2FBE" />
              <circle cx="27.5" cy="17" r="2.6" fill="#7B2FBE" />
              <path d="M24 20 l-1.5 3 h3z" fill="#7B2FBE" />
              <rect x="21.6" y="25" width="1.2" height="5" fill="#7B2FBE" />
              <rect x="25.2" y="25" width="1.2" height="5" fill="#7B2FBE" />
              <circle cx="7" cy="34" r="2" fill={f} />
              <circle cx="41" cy="34" r="2" fill={f} />
            </g>
          </g>
          <g transform="translate(277 11) rotate(3)">
            <path d="M0 0 h48 v40 a6 6 0 0 1 -12 0 a6 6 0 0 1 -12 0 a6 6 0 0 1 -12 0 a6 6 0 0 1 -12 0 Z" fill="#00B5C8" />
            <g fill={f} stroke="none">
              <path d="M9 24 q7 -12 15 -5 q5 -8 13 -9 q-3 7 -7 10 q5 4 7 10 q-8 -1 -13 -6 q-7 4 -15 0z" />
              <circle cx="8" cy="8" r="2" />
              <circle cx="40" cy="34" r="2" />
            </g>
          </g>
          <g transform="translate(332 6) rotate(-2)">
            <path d="M0 0 h48 v34 l-24 14 -24 -14 Z" fill="#FF6B00" />
            <g fill={f} stroke="none">
              <path d="M6 12 q4.5 -5 9 0 t9 0 t9 0 t9 0 v4 q-4.5 -5 -9 0 t-9 0 t-9 0 t-9 0z" />
              <path d="M6 24 q4.5 -5 9 0 t9 0 t9 0 t9 0 v4 q-4.5 -5 -9 0 t-9 0 t-9 0 t-9 0z" />
              <circle cx="24" cy="38" r="2" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
