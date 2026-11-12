// Pantalla de carga con dos jarochos bailando y mensajes que van cambiando. Se usa al armar la ruta y al abrir el mapa.
import { MusicNote, MusicNotes } from '@phosphor-icons/react'
import { Trans } from 'react-i18next'
import Banderines from './Banderines'
import estilos from './PantallaCarga.module.css'

interface Props {
  /** Ocupa toda la pantalla por encima de lo demás (por defecto) o solo el espacio de su contenedor. */
  fija?: boolean
}

/** La pareja del danzón: cada figura y cada brazo viven en un grupo para poder moverlos por separado con CSS. */
function Bailarines() {
  return (
    <svg className={estilos.baile} viewBox="-6 -4 60 54" role="img" aria-hidden="true">
      <ellipse className={estilos.sombra} cx="24" cy="46" rx="20" ry="2" fill="#150A2E" opacity=".16" />
      <g className={estilos.hombre}>
        <path d="M11 33 h10 l1 12 h-5 l-1 -8 -1 8 h-5z" fill="#150A2E" />
        <path d="M9 21 q0 -2 3 -2 h6 q3 0 3 2 l1 13 h-14z" fill="#BFE6FF" />
        <path d="M16 19 h2 q3 0 3 2 l1 13 h-6z" fill="#8CC8EE" />
        <path d="M15 19 v15" stroke="#6FB3E0" strokeWidth="1" />
        <circle cx="15" cy="12.5" r="4.4" fill="#8D5524" />
        <ellipse cx="15" cy="9.5" rx="8" ry="2.2" fill="#F6E2BE" />
        <path d="M10.5 9.5 q0 -5 4.5 -5 q4.5 0 4.5 5z" fill="#F6E2BE" />
        <path d="M10.6 8.6 h8.8" stroke="#E4007C" strokeWidth="1.4" />
        <path d="M20 24 l8 -2.5" stroke="#8D5524" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className={estilos.mujer}>
        <g className={estilos.falda}>
          <path d="M31 21 h9 l7 24 h-23z" fill="#E4007C" />
          <path d="M36 21 h4 l7 24 h-8z" fill="#C2006A" />
          <path d="M24.5 42 q11 3 22 0" stroke="#FF8AC0" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
        <circle cx="35.5" cy="13" r="4.4" fill="#C68642" />
        <path d="M31 13 q0 -6 5 -6 q5 0 4.5 5 q-2 -3 -5 -2 q-3 1 -4.5 3z" fill="#150A2E" />
        <circle cx="39" cy="8.5" r="3.2" fill="#150A2E" />
        <circle cx="31.8" cy="9.4" r="2.2" fill="#FFD400" />
        <circle cx="31.8" cy="9.4" r=".9" fill="#E5242B" />
        <path d="M32.5 24 l-4.5 -2.5" stroke="#C68642" strokeWidth="3" strokeLinecap="round" />
        <g className={estilos.abanico}>
          <path d="M38 23 l5 -9" stroke="#C68642" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M43 11.5 a7 7 0 0 1 6 1.5 l-5.5 4.5z" fill="#FFD400" />
        </g>
      </g>
    </svg>
  )
}

export default function PantallaCarga({ fija = true }: Props) {

  return (
    <div className={`${estilos.pantalla}${fija ? ` ${estilos.fija}` : ''}`} role="status" aria-live="polite">
      <div className={estilos.banderines} aria-hidden="true">
        <Banderines cuerda />
      </div>
      <div className={estilos.centro}>
        <div className={estilos.escena}>
          <MusicNote className={`${estilos.nota} ${estilos.nota1}`} size={28} weight="fill" aria-hidden="true" />
          <MusicNotes className={`${estilos.nota} ${estilos.nota2}`} size={32} weight="fill" aria-hidden="true" />
          <MusicNote className={`${estilos.nota} ${estilos.nota3}`} size={24} weight="fill" aria-hidden="true" />
          <Bailarines />
        </div>
        {/* "Solamente una vez" es un guiño a la canción de Agustín Lara. */}
        <p className={estilos.mensaje}>
          <Trans i18nKey="carga.espera" />
        </p>
        <span className={estilos.barra} aria-hidden="true" />
      </div>
    </div>
  )
}
