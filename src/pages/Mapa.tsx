// Pantalla: Mapa · Responsable: Dev 2 (M4, M7). Diseño 03 · Mapa + panel (ruta).
// Junta la ruta, los retos hechos (pasaporte), el saldo y los eventos en curso; el mapa y el panel solo pintan.
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useLugares } from '../app/datos'
import { cargarPreferencias } from '../app/preferencias'
import { MapaLugares, Panel } from '../features/mapa'
import Cabecera from '../features/mapa/Cabecera'
import RutaLista from '../features/mapa/RutaLista'
import type { Pestana } from '../features/mapa/Panel'
import { altoNivel, type Nivel } from '../features/mapa/nivelesPanel'
import { formatoDistancia, progresoRuta } from '../features/mapa/progreso'
import { distanciaM } from '../features/geo/distancia'
import { usePosition } from '../features/geo/usePosition'
import AvisoLlegada from '../features/geo/AvisoLlegada'
import { leerOrigen } from '../features/geo/origen'
import { haLlegado, useIrAlLlegar } from '../features/geo/useIrAlLlegar'
import { enCurso } from '../features/agenda/eventos'
import type { PasaporteDatos } from '../features/pasaporte/tipos'
import { api } from '../lib/api'
import seed from '../data/seed.json'
import type { Evento, Lugar } from '../types/contratos'

const NINGUNO: Lugar[] = []
/** Alto aproximado del panel del recorrido virtual (px): espacio que la cámara deja libre abajo. */


export default function Mapa() {
  const { t } = useTranslation()
  const todos = useLugares()
  const pos = usePosition()
  // undefined: cargando · null: sin ruta activa (entró directo o falló la red) · Lugar[]: la ruta
  const [ruta, setRuta] = useState<Lugar[] | null | undefined>(undefined)
  const [hechos, setHechos] = useState<ReadonlyMap<string, number>>(new Map())
  // Hasta saber qué lugares ya se visitaron no se vigila ninguna llegada (si no, se reabriría uno ya jugado).
  const [hechosListos, setHechosListos] = useState(false)
  const [saldo, setSaldo] = useState<number | null>(null)
  const [eventos, setEventos] = useState<Evento[]>(seed.eventos as Evento[])
  // Otras pantallas pueden abrir el mapa en una pestaña: navigate('/mapa', { state: { pestana: 'pasaporte' } })
  const estadoRuta = useLocation().state as { pestana?: Pestana; comercio?: { lat: number; lng: number; nombre: string } } | null
  const inicial = estadoRuta?.pestana
  // Desde la vitrina: navigate('/mapa', { state: { comercio: { lat, lng, nombre } } }) muestra ese negocio en el mapa.
  const comercioFocal = estadoRuta?.comercio ?? null
  const [pestana, setPestana] = useState<Pestana>(inicial ?? 'ruta')
  const [nivel, setNivel] = useState<Nivel>('medio')
  // Lugar que el turista tocó en la lista de la ruta: el mapa vuela hasta él (n distingue toques repetidos).
  const [enfocar, setEnfocar] = useState<{ slug: string; n: number } | null>(null)

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
      .finally(() => vivo && setHechosListos(true))
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

  // Se vigilan solo los lugares de la ruta que todavía no se han jugado: los visitados se siguen mostrando
  // (marcados como hechos) pero ya no abren ¡Llegaste! ni dan puntos. Mientras carga, no se vigila nada.
  const aVigilar = useMemo(
    () => (ruta === undefined || !hechosListos ? NINGUNO : (ruta ?? todos).filter((l) => !hechos.has(l.slug))),
    [ruta, hechosListos, todos, hechos],
  )
  const { llegando } = useIrAlLlegar(aVigilar)

  const slugsHechos = useMemo(() => new Set(hechos.keys()), [hechos])
  const enRuta = useMemo(() => new Set((ruta ?? []).map((l) => l.slug)), [ruta])
  const { completados, total } = progresoRuta(ruta ?? [], slugsHechos)
  // La siguiente parada es la primera a la que todavía no se ha llegado (con o sin reto hecho): así el mapa, la lista
  // y los controles del recorrido virtual hablan de la misma parada.
  const { siguiente } = progresoRuta(
    ruta ?? [],
    new Set([...slugsHechos, ...(ruta ?? []).filter((l) => haLlegado(l.slug)).map((l) => l.slug)]),
  )
  // Punto de partida guardado al armar la ruta (se lee una sola vez para que la línea no se redibuje).
  const origen = useMemo(() => leerOrigen(), [])
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

  // El mapa ocupa toda la pantalla y el panel flota encima; la cámara deja libre esa franja.
  const [altoVentana, setAltoVentana] = useState(() => window.innerHeight)
  useEffect(() => {
    const alCambiar = () => setAltoVentana(window.innerHeight)
    window.addEventListener('resize', alCambiar)
    return () => window.removeEventListener('resize', alCambiar)
  }, [])
  const altoPanel = altoNivel(nivel, altoVentana)
  // En pantalla completa el mapa queda tapado: la cámara se queda como en el nivel medio.
  const padAbajo = altoNivel(nivel === 'completo' ? 'medio' : nivel, altoVentana)

  const abrir = (p: Pestana) => {
    setPestana(p)
    setNivel((n) => (n === 'plegado' ? 'medio' : n))
  }

  // Tocar un lugar de la ruta lo muestra en el mapa (sin sacar al turista de él); el panel baja a la mitad.
  const enfocarLugar = (l: Lugar) => {
    setEnfocar((e) => ({ slug: l.slug, n: (e?.n ?? 0) + 1 }))
    setNivel((n) => (n === 'completo' ? 'medio' : n))
  }

  return (
    <main style={{ ['--alto-panel' as string]: `${altoPanel}px` }}>
      <h1 className="solo-lectores">{t('pantallas.mapa')}</h1>
      <MapaLugares
        lugares={todos}
        ruta={ruta ?? undefined}
        origen={origen}
        comercioFocal={comercioFocal}
        padAbajo={padAbajo}
        enfocar={enfocar}
        llegando={llegando?.slug ?? null}
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
          <Cabecera
            avatar={personaje}
            nombreRuta={nombreRuta}
            completados={completados}
            total={total}
            saldo={saldo}
            onAvatar={() => abrir('pasaporte')}
            onSaldo={() => abrir('cartera')}
          />
        }
        abajo={<AvisoLlegada lugar={llegando} />}
      />
      <Panel
        activa={pestana}
        onActiva={setPestana}
        nivel={nivel}
        onNivel={setNivel}
        ruta={
          <RutaLista
            ruta={ruta}
            hechos={hechos}
            siguiente={siguiente}
            pos={pos}
            onCambio={setRuta}
            onEnfocar={enfocarLugar}
          />
        }
      />
    </main>
  )
}
