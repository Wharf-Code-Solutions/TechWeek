// M7 Panel deslizable · Dev 2. Pestañas: Pasaporte (M9), Cartera (M10, Dev 3) y Agenda (M11).
import { useState, type KeyboardEvent } from 'react'
import { Drawer } from 'vaul'
import { useTranslation } from 'react-i18next'
import { CalendarBlank, BookBookmark, Wallet } from '@phosphor-icons/react'
import Boton from '../../components/ui/Boton'
import { Cartera } from '../cartera'
import { Agenda } from '../agenda'
import { Pasaporte } from '../pasaporte'
import './mapa.css'

const PESTANAS = [
  { id: 'pasaporte', Icono: BookBookmark, Contenido: Pasaporte },
  { id: 'cartera', Icono: Wallet, Contenido: Cartera },
  { id: 'agenda', Icono: CalendarBlank, Contenido: Agenda },
] as const

export default function Panel() {
  const { t } = useTranslation()
  const [activa, setActiva] = useState(0)
  const { Contenido } = PESTANAS[activa]

  // Flechas izquierda/derecha cambian de pestaña (patrón ARIA de tabs)
  function teclas(e: KeyboardEvent) {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    const nueva = (activa + delta + PESTANAS.length) % PESTANAS.length
    setActiva(nueva)
    document.getElementById(`pestana-${PESTANAS[nueva].id}`)?.focus()
  }

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <Boton ancho variante="amarillo">
          <BookBookmark size={24} weight="duotone" aria-hidden="true" />
          {t('panel.abrir')}
        </Boton>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="panel-fondo" />
        <Drawer.Content className="panel">
          <div className="panel-asa" aria-hidden="true" />
          <Drawer.Title className="solo-lectores">{t('panel.titulo')}</Drawer.Title>
          <Drawer.Description className="solo-lectores">{t('panel.descripcion')}</Drawer.Description>
          <div className="panel-pestanas" role="tablist" aria-label={t('panel.titulo')} onKeyDown={teclas}>
            {PESTANAS.map(({ id, Icono }, i) => (
              <button
                key={id}
                id={`pestana-${id}`}
                type="button"
                role="tab"
                className="panel-pestana"
                aria-selected={i === activa}
                aria-controls="panel-contenido"
                tabIndex={i === activa ? 0 : -1}
                onClick={() => setActiva(i)}
              >
                <Icono size={22} weight="duotone" aria-hidden="true" />
                {t(`panel.${id}`)}
              </button>
            ))}
          </div>
          <div
            id="panel-contenido"
            className="panel-contenido"
            role="tabpanel"
            aria-labelledby={`pestana-${PESTANAS[activa].id}`}
          >
            <Contenido />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
