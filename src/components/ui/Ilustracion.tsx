// Componente base: Ilustracion · Responsable: Dev 2 (contrato 4)
// `nombre` es el campo `ilustracion` de cada lugar en seed.json.
// shortcut: íconos Phosphor duotono en lugar de ilustraciones; cambiar cuando lleguen los SVG del diseño.
import {
  Bank, CastleTurret, Church, Coffee, Coins, Ghost, Lighthouse, MapPin, MusicNotes, PuzzlePiece,
  type Icon,
} from '@phosphor-icons/react'
import './ui.css'

const ICONOS: Record<string, Icon> = {
  catedral: Church,
  baluarte: CastleTurret,
  'cafe-lechero': Coffee,
  fantasma: Ghost,
  'faro-carranza': Lighthouse,
  'palacio-municipal': Bank,
  'pareja-danzon': MusicNotes,
  puzzle: PuzzlePiece,
  moneda: Coins,
}

interface Props {
  nombre: string
  tamano?: number
  /** Texto alternativo traducido; sin él, la ilustración es decorativa */
  alt?: string
}

export default function Ilustracion({ nombre, tamano = 96, alt }: Props) {
  const IconoLugar = ICONOS[nombre] ?? MapPin
  return (
    <span
      className="ilustracion"
      style={{ width: tamano, height: tamano }}
      role={alt ? 'img' : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
    >
      <IconoLugar size={tamano * 0.6} weight="duotone" />
    </span>
  )
}
