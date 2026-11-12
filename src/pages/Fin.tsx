// Pantalla: Fin · Responsable: Dev 2 (M12)
import { useTranslation } from 'react-i18next'

export default function Fin() {
  const { t } = useTranslation()
  return <main><h1>{t('pantallas.fin')}</h1></main>
}
