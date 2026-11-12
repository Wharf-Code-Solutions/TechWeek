// Componente base: Boton · Responsable: Dev 2 (contrato 4)
// Botón solo con ícono: pasa aria-label (texto traducido con i18n).
import type { ButtonHTMLAttributes } from 'react'
import './ui.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'rosa' | 'amarillo' | 'cobalto' | 'blanco'
  ancho?: boolean
}

export default function Boton({ variante = 'rosa', ancho, className = '', type = 'button', ...resto }: Props) {
  const clases = `boton boton--${variante}${ancho ? ' boton--ancho' : ''} ${className}`.trim()
  return <button type={type} className={clases} {...resto} />
}
