// Pantalla: Cupon · Responsable: Dev 3 (M10)
import { useTranslation } from 'react-i18next'

export default function Cupon() {
  const { t } = useTranslation()
  return <main><h1>{t('pantallas.cupon')}</h1></main>
}
