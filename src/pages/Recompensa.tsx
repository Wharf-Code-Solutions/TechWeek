// Pantalla: Recompensa · Responsable: Dev 3
import { useTranslation } from 'react-i18next'

export default function Recompensa() {
  const { t } = useTranslation()
  return <main><h1>{t('pantallas.recompensa')}</h1></main>
}
