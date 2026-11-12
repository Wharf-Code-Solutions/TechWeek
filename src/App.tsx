import { useEffect } from 'react'
import AppRoutes from './app/routes'
import { asegurarSesion } from './lib/supabase'

export default function App() {
  useEffect(() => {
    asegurarSesion().catch(console.error)
  }, [])

  return <AppRoutes />
}
