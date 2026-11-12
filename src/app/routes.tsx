// Contrato 5 · Rutas de pantalla.
// Solo Preferencias (la entrada) se carga de inmediato; las demás pantallas se descargan al abrirlas, así el mapa
// (mapbox-gl pesa casi 2 MB) no retrasa la primera pantalla.
import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, Routes, useLocation } from 'react-router-dom'
import Preferencias from '../pages/Preferencias'
import estilos from './routes.module.css'

const Mapa = lazy(() => import('../pages/Mapa'))
const Lugar = lazy(() => import('../pages/Lugar'))
const Reto = lazy(() => import('../pages/Reto'))
const Recompensa = lazy(() => import('../pages/Recompensa'))
const Cupon = lazy(() => import('../pages/Cupon'))
const Fin = lazy(() => import('../pages/Fin'))
const Vitrina = lazy(() => import('../pages/Vitrina'))
const Comercio = lazy(() => import('../pages/Comercio'))

/** Mientras baja la pantalla: un aviso sencillo con el color de JARANA. */
function Cargando() {
  const { t } = useTranslation()
  return (
    <main className={estilos.cargando} role="status" aria-live="polite">
      <span className={estilos.punto} aria-hidden="true" />
      <p>{t('comun.cargando')}</p>
    </main>
  )
}

/**
 * Cambio de pantalla: la anterior se desvanece y la nueva aparece (solo opacidad: no rompe los elementos fijos
 * como el panel del mapa). `mode="wait"` evita ver las dos a la vez.
 */
export default function AppRoutes() {
  const location = useLocation()
  return (
    <Suspense fallback={<Cargando />}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } }}
        >
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
        </motion.div>
      </AnimatePresence>
    </Suspense>
  )
}
