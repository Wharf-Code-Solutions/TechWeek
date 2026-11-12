// Genera la imagen para compartir (PNG 1080×1350) con canvas: rompecabezas, cifras y marca JARANA.
import { lugarDePieza } from '../pasaporte/tipos'
import { cifras, type DatosCompartir } from './texto'

const ANCHO = 1080
const ALTO = 1350
const TINTA = '#150A2E'
const COLORES = ['#E4007C', '#FFD400', '#00B5C8', '#FF6B00', '#7B2FBE', '#22B24C']
const TITULO = '"Bricolage Grotesque", system-ui, sans-serif'
const TEXTO = '"DM Sans", system-ui, sans-serif'

export interface EtiquetasImagen {
  logrado: string
  paradas: string
  tlacos: string
  distancia: string
  piezas: string
  pie: string
}

function cargar(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function rectRedondo(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath()
  c.roundRect(x, y, w, h, r)
}

export async function generarImagen(d: DatosCompartir, et: EtiquetasImagen): Promise<Blob> {
  // Las fuentes del lienzo no se piden solas: se cargan aquí para que no salga la fuente de respaldo.
  await Promise.all([document.fonts?.load('800 40px "Bricolage Grotesque"'), document.fonts?.load('700 30px "DM Sans"')])
  await document.fonts?.ready
  const foto = d.fotoUrl ? await cargar(d.fotoUrl) : null
  const lienzo = document.createElement('canvas')
  lienzo.width = ANCHO
  lienzo.height = ALTO
  const c = lienzo.getContext('2d')
  if (!c) throw new Error('canvas no disponible')

  c.fillStyle = '#E4007C'
  c.fillRect(0, 0, ANCHO, ALTO)

  // Banderines de papel picado arriba.
  c.strokeStyle = TINTA
  c.lineWidth = 6
  c.beginPath()
  c.moveTo(0, 40)
  c.quadraticCurveTo(ANCHO / 2, 110, ANCHO, 40)
  c.stroke()
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 120
    const y = 52 + Math.sin((i / 8) * Math.PI) * 38
    c.fillStyle = COLORES[i % COLORES.length]
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(x + 70, y)
    c.lineTo(x + 35, y + 85)
    c.closePath()
    c.fill()
    c.stroke()
  }

  c.textAlign = 'center'
  c.fillStyle = '#FFD400'
  c.font = `700 34px ${TEXTO}`
  c.fillText(et.logrado.toUpperCase(), ANCHO / 2, 250)
  c.fillStyle = '#fff'
  c.font = `800 110px ${TITULO}`
  c.fillText('JARANA', ANCHO / 2, 360)

  // Rompecabezas 3:2 con las piezas ganadas; las demás, en lila.
  const mx = 90
  const mw = ANCHO - mx * 2
  const mh = (mw * 2) / 3
  const my = 400
  c.fillStyle = TINTA
  rectRedondo(c, mx - 12, my - 12, mw + 24, mh + 24, 28)
  c.fill()
  const hueco = 6
  for (let i = 0; i < d.piezas.total; i++) {
    const { fila, filas, col, columnas } = lugarDePieza(i, d.piezas.total)
    const pw = mw / columnas
    const ph = mh / filas
    const px = mx + col * pw + hueco / 2
    const py = my + fila * ph + hueco / 2
    const w = pw - hueco
    const h = ph - hueco
    c.save()
    rectRedondo(c, px, py, w, h, 10)
    c.clip()
    if (d.piezas.indices.includes(i)) {
      if (foto) {
        c.drawImage(foto, (col * foto.width) / columnas, (fila * foto.height) / filas, foto.width / columnas, foto.height / filas, px, py, w, h)
      } else {
        c.fillStyle = COLORES[i % COLORES.length]
        c.fillRect(px, py, w, h)
      }
    } else {
      c.fillStyle = '#DCD6EC'
      c.fillRect(px, py, w, h)
    }
    c.restore()
  }

  c.fillStyle = '#fff'
  c.font = `700 40px ${TEXTO}`
  c.fillText(d.titulo, ANCHO / 2, my + mh + 75, mw)
  c.font = `700 30px ${TEXTO}`
  c.fillStyle = '#FFD400'
  c.fillText(et.piezas, ANCHO / 2, my + mh + 115)

  // Cifras: una tarjeta por dato.
  const datos = cifras(d, et)
  const gap = 24
  const cw = (mw - gap * (datos.length - 1)) / datos.length
  const cy = my + mh + 145
  datos.forEach(([etiqueta, valor], i) => {
    const x = mx + i * (cw + gap)
    c.fillStyle = '#fff'
    c.strokeStyle = TINTA
    c.lineWidth = 5
    rectRedondo(c, x, cy, cw, 120, 22)
    c.fill()
    c.stroke()
    c.fillStyle = TINTA
    c.font = `800 54px ${TITULO}`
    c.fillText(valor, x + cw / 2, cy + 64, cw - 20)
    c.font = `700 24px ${TEXTO}`
    c.fillText(etiqueta, x + cw / 2, cy + 98, cw - 20)
  })

  c.fillStyle = '#fff'
  c.font = `700 30px ${TEXTO}`
  c.fillText(et.pie, ANCHO / 2, ALTO - 38)

  return new Promise((resolve, reject) =>
    lienzo.toBlob((b) => (b ? resolve(b) : reject(new Error('sin imagen'))), 'image/png'),
  )
}
