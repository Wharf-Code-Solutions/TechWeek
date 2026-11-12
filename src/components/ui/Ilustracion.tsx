// Componente base: Ilustracion · Responsable: Dev 2 (contrato 4)
// Vector plano sin contorno, del set del diseño (Sistema visual); ver ./ilustraciones.ts.
// `nombre` es el campo `ilustracion` de los lugares, una categoría o un nombre del set (moneda, puzzle…).
import { urlIlustracion } from './ilustraciones'
import './ui.css'

interface Props {
  nombre: string
  tamano?: number
  /** Texto alternativo traducido; sin él, la ilustración es decorativa */
  alt?: string
}

export default function Ilustracion({ nombre, tamano = 96, alt }: Props) {
  return (
    <img
      className="ilustracion"
      src={urlIlustracion(nombre)}
      width={tamano}
      height={tamano}
      alt={alt ?? ''}
      draggable={false}
    />
  )
}
