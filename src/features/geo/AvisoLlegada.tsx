// Aviso breve al llegar a una parada: "¡Llegaste a …!". Da un respiro antes de abrir la pantalla del lugar.
import { AnimatePresence, motion } from 'framer-motion'
import { MapPinLine } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useCampo } from '../../app/idioma'
import type { Lugar } from '../../types/contratos'
import estilos from './AvisoLlegada.module.css'

export default function AvisoLlegada({ lugar }: { lugar: Lugar | null }) {
  const { t } = useTranslation()
  const campo = useCampo()
  return (
    <AnimatePresence>
      {lugar && (
        <motion.div
          key="aviso"
          className={estilos.aviso}
          role="status"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 480, damping: 30 } }}
          exit={{ opacity: 0, y: 16, transition: { duration: 0.1 } }}
        >
          <MapPinLine size={26} weight="duotone" aria-hidden="true" />
          <span>{t('recorrido.llegaste', { nombre: campo(lugar, 'nombre') })}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
