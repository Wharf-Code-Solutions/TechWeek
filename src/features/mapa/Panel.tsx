// M7 Panel deslizable · Dev 2. Hoy solo tiene la Cartera (M10, Dev 3).
// Cuando existan Pasaporte (M9) y Agenda (M11) se agregan aquí como pestañas.
import { Drawer } from 'vaul'
import { useTranslation } from 'react-i18next'
import { Wallet } from '@phosphor-icons/react'
import Boton from '../../components/ui/Boton'
import { Cartera } from '../cartera'
import './mapa.css'

export default function Panel() {
  const { t } = useTranslation()
  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <Boton ancho variante="amarillo">
          <Wallet size={24} weight="duotone" aria-hidden="true" />
          {t('panel.cartera')}
        </Boton>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="panel-fondo" />
        <Drawer.Content className="panel">
          <div className="panel-asa" aria-hidden="true" />
          <Drawer.Title className="solo-lectores">{t('panel.titulo')}</Drawer.Title>
          <Drawer.Description className="solo-lectores">{t('panel.descripcion')}</Drawer.Description>
          <div className="panel-contenido">
            <Cartera />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
