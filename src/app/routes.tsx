// Contrato 5 · Rutas de pantalla.
// Solo Preferencias (la entrada) se carga de inmediato; las demás pantallas se descargan al abrirlas, así el mapa
// (mapbox-gl pesa casi 2 MB) no retrasa la primera pantalla.
import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import PantallaCarga from '../components/ui/PantallaCarga'
import { equipoModesto } from '../features/mapa/modoLigero'
import ErrorPantalla from './ErrorPantalla'
import Preferencias from '../pages/Preferencias'

const cargarMapa = () => import('../pages/Mapa')
const cargarLugar = () => import('../pages/Lugar')
const cargarReto = () => import('../pages/Reto')
const cargarRecompensa = () => import('../pages/Recompensa')
const Mapa = lazy(cargarMapa)
const Lugar = lazy(cargarLugar)
const Reto = lazy(cargarReto)
const Recompensa = lazy(cargarRecompensa)
const Cupon = lazy(() => import('../pages/Cupon'))
const Fin = lazy(() => import('../pages/Fin'))
const Vitrina = lazy(() => import('../pages/Vitrina'))
const Comercio = lazy(() => import('../pages/Comercio'))

/** Con el navegador libre se descargan las pantallas que vienen después, para que abrirlas sea instantáneo. */
const enReposo = (f: () => void) =>
  typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 4000 }) : window.setTimeout(f, 1500)

/** Fallback que espera un momento: si el chunk llega rápido no se ve un parpadeo de la pantalla de carga. */
function CargaConEspera() {
  const [ver, setVer] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setVer(true), 150)
    return () => window.clearTimeout(id)
  }, [])
  return ver ? <PantallaCarga /> : null
}

/**
 * Cambio de pantalla: la anterior se desvanece y la nueva aparece (solo opacidad: no rompe los elementos fijos
 * como el panel del mapa). El modo wait evita ver las dos a la vez. El Suspense va dentro de cada pantalla (no
 * fuera de la animación): así la carga no esconde ni congela la transición, y un fallo no deja la página en blanco.
 */
export default function AppRoutes() {
  const location = useLocation()
  useEffect(() => {
    // Con poca memoria, ahorro de datos o red lenta no se precarga nada: descargar y ejecutar mapbox-gl (2 MB) en
    // segundo plano compite con lo que el turista está haciendo. Ahí el mapa se baja al armar la ruta.
    if (equipoModesto()) return
    // El mapa (mapbox-gl) primero: el turista lo necesita en cuanto arma su ruta; luego el resto del recorrido.
    enReposo(() => {
      void cargarMapa()
      enReposo(() => {
        void cargarLugar()
        void cargarReto()
        void cargarRecompensa()
      })
    })
  }, [])
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ opacity: 0, transition: { duration: 0.09, ease: 'easeIn' } }}
      >
        <ErrorPantalla>
          <Suspense fallback={<CargaConEspera />}>
            <Routes location={location}>
              <Route path="/" element={<Preferencias />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/lugar/:slug" element={<Lugar />} />
              <Route path="/reto/:slug" element={<Reto />} />
              <Route path="/recompensa/:slug" element={<Recompensa />} />
              <Route path="/cupon/:id" element={<Cupon />} />
              <Route path="/fin" element={<Fin />} />
              <Route path="/vitrina" element={<Vitrina />} />
              <Route path="/vitrina/:slug" element={<Comercio />} />
            </Routes>
          </Suspense>
        </ErrorPantalla>
      </motion.div>
    </AnimatePresence>
  )
}
