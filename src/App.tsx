import { MotionConfig } from 'framer-motion'
import { useEffect } from 'react'
import AppRoutes from './app/routes'
import TransicionOlas from './features/geo/TransicionOlas'
import { asegurarSesion } from './lib/api'

export default function App() {
  useEffect(() => {
    asegurarSesion().catch(console.error)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <AppRoutes />
      {/* Transición de olas entre el mapa y la pantalla de un lugar */}
      <TransicionOlas />
    </MotionConfig>
  )
}
