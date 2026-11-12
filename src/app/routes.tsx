// Contrato 5 · Rutas de pantalla. ?demo=1 activa el recorrido virtual.
import { Route, Routes } from 'react-router-dom'
import Preferencias from '../pages/Preferencias'
import Mapa from '../pages/Mapa'
import Lugar from '../pages/Lugar'
import Reto from '../pages/Reto'
import Recompensa from '../pages/Recompensa'
import Cupon from '../pages/Cupon'
import Fin from '../pages/Fin'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Preferencias />} />
      <Route path="/mapa" element={<Mapa />} />
      <Route path="/lugar/:slug" element={<Lugar />} />
      <Route path="/reto/:slug" element={<Reto />} />
      <Route path="/recompensa/:slug" element={<Recompensa />} />
      <Route path="/cupon/:id" element={<Cupon />} />
      <Route path="/fin" element={<Fin />} />
    </Routes>
  )
}
