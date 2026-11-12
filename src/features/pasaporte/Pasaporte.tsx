// M9 Pasaporte · Dev 2. Diseño 12 (Panel: Pasaporte) y 09 (Rompecabezas fotográfico).
// Tarjeta del viajero, álbum de sellos de la ruta y la foto oculta que se revela pieza a pieza.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceMobile } from '@phosphor-icons/react'
import Ilustracion from '../../components/ui/Ilustracion'
import { useCampo } from '../../app/idioma'
import { cargarPreferencias } from '../../app/preferencias'
import { api } from '../../lib/api'
import type { Lugar } from '../../types/contratos'
import { BotonCompartir } from '../compartir'
import Rompecabezas from './Rompecabezas'
import { nombreCorto, type PasaporteDatos } from './tipos'
import './pasaporte.css'

// Color de cada sello del álbum (borde y texto)
const TINTAS = ['var(--rosa)', 'var(--morado)', '#0097a8', 'var(--naranja)', 'var(--verde)']

export default function Pasaporte() {
  const { t } = useTranslation()
  const campo = useCampo()
  const [datos, setDatos] = useState<PasaporteDatos | null>(null)
  const [saldo, setSaldo] = useState<number | null>(null)
  const [ruta, setRuta] = useState<Lugar[] | null>(null)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    let vivo = true
    api
      .pasaporte()
      .then((d) => vivo && setDatos(d as PasaporteDatos))
      .catch(() => vivo && setFallo(true))
    api
      .saldo()
      .then((s) => vivo && setSaldo(s.saldo))
      .catch(() => {})
    api
      .rutaActual()
      .then((r) => vivo && setRuta(r.lugares))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [])

  if (fallo) return <p role="alert">{t('comun.error')}</p>
  if (!datos) return <p role="status">{t('comun.cargando')}</p>

  const { sellos, piezas, foto } = datos
  const url = foto?.url || null
  const porSlug = new Map(sellos.map((s) => [s.lugar_slug, s]))
  // Álbum: las paradas de la ruta (hechas o pendientes); sin ruta, solo los sellos ganados.
  const album = ruta
    ? ruta.map((l) => ({ slug: l.slug, nombre: campo(l, 'nombre'), ilustracion: l.ilustracion, hecho: porSlug.has(l.slug) }))
    : sellos.map((s) => ({ slug: s.lugar_slug, nombre: campo(s, 'nombre'), ilustracion: s.ilustracion, hecho: true }))
  const hechos = album.filter((a) => a.hecho).length
  const { intereses, personaje, apodo } = cargarPreferencias()
  const interes = intereses[0]
  const faltan = piezas.total - piezas.ganadas

  return (
    <section className="pasaporte" aria-labelledby="titulo-pasaporte">
      <div className="pasaporte-tarjeta">
        <Ilustracion nombre={personaje} tamano={72} />
        <div>
          <span className="pasaporte-antetitulo">{t('pasaporte.antetitulo')}</span>
          <h2 id="titulo-pasaporte">{apodo || t(`pasaporte.avatar_${personaje}`)}</h2>
          <p className="pasaporte-saldo">
            <Ilustracion nombre="moneda" tamano={22} />
            {t('pasaporte.tlacos', { n: saldo ?? 0 })}
          </p>
        </div>
      </div>
      <p className="pasaporte-nota">
        <DeviceMobile size={16} weight="duotone" aria-hidden="true" />
        {t('pasaporte.guardado')}
      </p>

      <div className="pasaporte-encabezado">
        <h3>{interes ? t('pasaporte.sellosRuta', { ruta: t(`preferencias.categorias.${interes}`) }) : t('pasaporte.sellosTitulo')}</h3>
        <span>
          {hechos} / {album.length}
        </span>
      </div>
      <ul className="pasaporte-album" aria-label={t('pasaporte.album')}>
        {album.map((a, i) =>
          a.hecho ? (
            <li key={a.slug}>
              <span
                className="pasaporte-sello"
                style={{ ['--tinta-sello' as string]: TINTAS[i % TINTAS.length] }}
                role="img"
                aria-label={t('pasaporte.sello', { nombre: a.nombre })}
              >
                <Ilustracion nombre={a.ilustracion} tamano={52} />
              </span>
              <span className="pasaporte-sello-nombre" aria-hidden="true">
                {nombreCorto(a.nombre)}
              </span>
            </li>
          ) : (
            <li key={a.slug} aria-label={t('pasaporte.selloPendiente', { nombre: a.nombre })}>
              <span className="pasaporte-hueco" aria-hidden="true">
                ?
              </span>
              <span className="pasaporte-hueco-nombre">{nombreCorto(a.nombre)}</span>
            </li>
          ),
        )}
        <li>
          <a className="pasaporte-foto-oculta" href="#rompecabezas">
            <Ilustracion nombre="puzzle" tamano={32} />
            {t('pasaporte.fotoOculta')}
            <br />
            {piezas.ganadas} / {piezas.total}
          </a>
        </li>
      </ul>

      <div id="rompecabezas" className="pasaporte-rompe">
        <span className="pasaporte-antetitulo">{t('pasaporte.rompecabezas')}</span>
        <h3>{foto ? campo(foto, 'titulo') : t('pasaporte.fotoOculta')}</h3>
        <div className="pasaporte-marco">
          <Rompecabezas piezas={piezas} url={url} />
        </div>
        <div className="pasaporte-progreso">
          <div className="pasaporte-barra" aria-hidden="true">
            <div style={{ width: `${(piezas.ganadas / piezas.total) * 100}%` }} />
          </div>
          <span>
            {piezas.ganadas}/{piezas.total}
          </span>
        </div>
        <p className="pasaporte-faltan">
          {piezas.completa ? t('pasaporte.completa') : t('pasaporte.faltan', { count: faltan })}
        </p>
        {piezas.ganadas > 0 && (
          <BotonCompartir
            rutaId={datos.ruta_id}
            terminada={datos.ruta_terminada}
            datos={{
              titulo: foto ? campo(foto, 'titulo') : 'JARANA',
              paradas: piezas.ganadas,
              piezas,
              fotoUrl: url,
            }}
          />
        )}
      </div>
    </section>
  )
}
