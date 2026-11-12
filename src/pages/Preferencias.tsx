// Pantalla: Preferencias · Responsable: Dev 3 (M3 lógica: Dev 1)
import { useTranslation } from 'react-i18next'

export default function Preferencias() {
  const { t } = useTranslation()
  return <main><h1>{t('pantallas.preferencias')}</h1></main>
}
