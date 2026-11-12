// Pantalla: Reto · Responsable: Dev 2 (pantallas) · Dev 1 (validación)
import { useTranslation } from 'react-i18next'

export default function Reto() {
  const { t } = useTranslation()
  return <main><h1>{t('pantallas.reto')}</h1></main>
}
