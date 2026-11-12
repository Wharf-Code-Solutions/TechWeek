// Pantalla: Mapa · Responsable: Dev 2 (M4, M7). Diseño 03 · Mapa + panel (ruta).
// Junta la ruta, los retos hechos (pasaporte), el saldo y los eventos en curso; el mapa y el panel solo pintan.
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useLugares } from '../app/datos'
import { cargarPreferencias } from '../app/preferencias'
import Banderines from '../components/ui/Banderines'
import { MapaLugares, Panel } from '../features/mapa'
import Cabecera from '../features/mapa/Cabecera'
import RutaLista from '../features/mapa/RutaLista'
import type { Pestana } from '../features/mapa/Panel'
import { formatoDistancia, progresoRuta } from '../features/mapa/progreso'
import ControlRecorrido from '../features/geo/ControlRecorrido'
import { esModoDemo } from '../features/geo/demoStore'
import { distanciaM } from '../features/geo/distancia'
import { usePosition } from '../features/geo/usePosition'
import { useIrAlLlegar } from '../features/geo/useIrAlLlegar'
import { enCurso } from '../features/agenda/eventos'
import type { PasaporteDatos } from '../features/pasaporte/tipos'
import { api } from '../lib/api'
import seed from '../data/seed.json'
import type { Evento, Lugar } from '../types/contratos'

const NINGUNO: Lugar[] = []


const ALTO_PANEL = { abierto: '48dvh', plegado: '108px' }

export default function Mapa() {
  const { t } = useTranslation()
  const todos = useLugares()
  const pos = usePosition()
  // undefined: cargando · null: sin ruta activa (entró directo o falló la red) · Lugar[]: la ruta
  const [ruta, setRuta] = useState<Lugar[] | null | undefined>(undefined)
  const [hechos, setHechos] = useState<ReadonlyMap<string, number>>(new Map())
  const [saldo, setSaldo] = useState<number | null>(null)
  const [eventos, setEventos] = useState<Evento[]>(seed.eventos as Evento[])
  // Otras pantallas pueden abrir el mapa en una pestaña: navigate('/mapa', { state: { pestana: 'pasaporte' } })
  const inicial = (useLocation().state as { pestana?: Pestana } | null)?.pestana
  const [pestana, setPestana] = useState<Pestana>(inicial ?? 'ruta')
  const [plegado, setPlegado] = useState(false)

  useEffect(() => {
    let vivo = true
    api
      .rutaActual()
      .then((r) => vivo && setRuta(r.lugares))
      .catch(() => vivo && setRuta(null))
    api
      .pasaporte()
      .then((p) => vivo && setHechos(new Map((p as PasaporteDatos).sellos.map((s) => [s.lugar_slug, s.tlacos]))))
      .catch(() => {})
    api
      .saldo()
      .then((s) => vivo && setSaldo(s.saldo))
      .catch(() => {})
    api
      .eventos()
      .then((e) => vivo && setEventos(e as Evento[]))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  // Mientras carga la ruta no se vigila nada, para no abrir un lugar que no está en ella.
  useIrAlLlegar(ruta === undefined ? NINGUNO : (ruta ?? todos))

  const slugsHechos = useMemo(() => new Set(hechos.keys()), [hechos])
  const enRuta = useMemo(() => new Set((ruta ?? []).map((l) => l.slug)), [ruta])
  const { siguiente, completados, total } = progresoRuta(ruta ?? [], slugsHechos)
  const { intereses, personaje } = cargarPreferencias()
  const interes = intereses[0]
  const nombreRuta =
    ruta === undefined
      ? undefined
      : ruta
        ? interes
          ? t('mapa.rutaDe', { categoria: t(`preferencias.categorias.${interes}`) })
          : t('mapa.tuRuta')
        : null

  const abrir = (p: Pestana) => {
    setPestana(p)
    setPlegado(false)
  }

  return (
    <main style={{ ['--alto-panel' as string]: plegado ? ALTO_PANEL.plegado : ALTO_PANEL.abierto }}>
      <h1 className="solo-lectores">{t('pantallas.mapa')}</h1>
      <MapaLugares
        lugares={todos}
        enRuta={enRuta}
        hechos={slugsHechos}
        siguiente={siguiente?.slug ?? null}
        etiquetaSiguiente={
          siguiente && pos
            ? t('mapa.siguienteA', { dist: formatoDistancia(distanciaM(pos, siguiente)) })
            : t('mapa.siguiente')
        }
        eventos={eventos.filter((e) => enCurso(e))}
        onEvento={() => abrir('agenda')}
        arriba={
          <>
            <Banderines />
            <Cabecera
              avatar={personaje}
              nombreRuta={nombreRuta}
              completados={completados}
              total={total}
              saldo={saldo}
              onAvatar={() => abrir('pasaporte')}
              onSaldo={() => abrir('cartera')}
            />
          </>
        }
        abajo={<ControlRecorrido />}
      />
      {/* En la demo el recorrido virtual ocupa la parte baja: el panel se oculta para no encimarse. */}
      {!esModoDemo() && (
        <Panel
          activa={pestana}
          onActiva={setPestana}
          plegado={plegado}
          onPlegado={setPlegado}
          ruta={<RutaLista ruta={ruta} hechos={hechos} siguiente={siguiente} pos={pos} onCambio={setRuta} />}
        />
      )}
    </main>
  )
}
