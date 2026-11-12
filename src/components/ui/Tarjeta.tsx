// Componente base: Tarjeta · Responsable: Dev 2 (contrato 4)
import type { HTMLAttributes } from 'react'
import './ui.css'

export default function Tarjeta({ className = '', ...resto }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`tarjeta ${className}`.trim()} {...resto} />
}
