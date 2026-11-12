// Pantalla: Mapa · Responsable: Dev 2 (M4, M7)
import { useTranslation } from 'react-i18next'

export default function Mapa() {
  const { t } = useTranslation()
  return <main><h1>{t('pantallas.mapa')}</h1></main>
}
