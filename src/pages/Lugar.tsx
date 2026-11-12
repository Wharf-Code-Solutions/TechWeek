// Pantalla: Lugar · Responsable: Dev 3 (¡Llegaste!)
import { useTranslation } from 'react-i18next'

export default function Lugar() {
  const { t } = useTranslation()
  return <main><h1>{t('pantallas.lugar')}</h1></main>
}
