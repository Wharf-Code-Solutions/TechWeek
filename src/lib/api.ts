// Único punto de contacto con el backend. El navegador ya no habla con Supabase:
// sesión, catálogo, llegada, retos y canjes pasan por FastAPI.

import type { Comercio, Lugar, TipoComercio } from '../types/contratos'

const BASE = import.meta.env.VITE_API_URL ?? ''

/** Error del backend con su código HTTP (403 fuera de radio, 402 saldo insuficiente, 404...). */
export class ApiError extends Error {
  status: number
  constructor(status: number, mensaje: string) {
    super(mensaje)
    this.status = status
  }
}

/** Filas de la API (la base usa id; el seed usa slug). */
export interface PromocionFila {
  id: number
  slug: string
  comercio_id: number
  titulo_es: string
  titulo_en: string
  costo_tlacos: number
}
export interface RutaIn {
  tiempo_min: number
  intereses: string[]
  /** Posición actual, si hay permiso de GPS. */
  lat?: number
  lng?: number
}
export interface Ruta {
  id: number
  lugares: Lugar[]
  tiempo_min: number
  intereses: string[]
  foto_id: number | null
  estado: 'activa' | 'terminada' | 'abandonada'
}
export interface RutaCreada extends Ruta {
  estimado_min: number
  caminata_m: number
}
export interface ResumenRuta {
  ruta_id: number
  bono: number
  saldo: number
  visitados: number
  retos_completados: number
  /** Metros entre las paradas completadas y doblones que dieron (1 por 100 m, tope 60). */
  distancia_m: number
  tlacos_distancia: number
  total_lugares: number
  foto_id: number | null
}
export interface ComercioFila {
  id: number
  slug: string
  nombre: string
  lat: number
  lng: number
}
const CLAVE = 'jarana.sesion'

interface Sesion {
  access_token: string
  refresh_token: string
  expires_at: number
}

function leerSesion(): Sesion | null {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? 'null')
  } catch {
    return null
  }
}

function guardarSesion(s: Sesion) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(s))
  } catch {
    /* sin almacenamiento: la sesión vive solo en memoria */
  }
  memoria = s
}

let memoria: Sesion | null = null

async function http<T>(ruta: string, init: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${ruta}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const detalle = (await res.json().catch(() => null))?.detail
    throw new ApiError(res.status, typeof detalle === 'string' ? detalle : `Error ${res.status}`)
  }
  return res.json() as Promise<T>
}

/** Abre (o renueva) la sesión anónima del celular y devuelve un token vigente. */
export function asegurarSesion(): Promise<string> {
  // Llamadas simultáneas comparten la misma petición: así no se crean dos usuarios anónimos.
  enCurso ??= obtenerSesion().finally(() => {
    enCurso = null
  })
  return enCurso
}

let enCurso: Promise<string> | null = null

async function obtenerSesion(): Promise<string> {
  let s = memoria ?? leerSesion()
  const vigente = s && s.expires_at > Date.now() / 1000 + 30
  if (!s || !vigente) {
    s = s
      ? await http<Sesion>('/api/sesion/renovar', { method: 'POST', body: JSON.stringify({ refresh_token: s.refresh_token }) }).catch(
          () => http<Sesion>('/api/sesion', { method: 'POST' }),
        )
      : await http<Sesion>('/api/sesion', { method: 'POST' })
    guardarSesion(s)
  }
  return s.access_token
}

const llegadas = new Map<string, Promise<unknown>>()

const privado = async <T>(ruta: string, init?: RequestInit) => http<T>(ruta, init, await asegurarSesion())

export const api = {
  // Catálogo (público)
  lugares: () => http<Lugar[]>('/api/lugares'),
  retoDeLugar: (slug: string) => http<unknown>(`/api/lugares/${slug}/reto`),
  comercios: () => http<ComercioFila[]>('/api/comercios'),
  /** Vitrina de negocios (con `tipo` filtra en el servidor; los aliados vienen primero). */
  vitrina: (tipo?: TipoComercio) => http<Comercio[]>(`/api/comercios${tipo ? `?tipo=${tipo}` : ''}`),
  promociones: () => http<PromocionFila[]>('/api/promociones'),
  eventos: () => http<unknown[]>('/api/eventos'),
  fotos: () => http<unknown[]>('/api/fotos'),
  // Progreso del celular (con sesión)
  saldo: () => privado<{ saldo: number }>('/api/saldo'),
  /** Idempotente: una sola petición por lugar y sesión; un 409 ("ya existe") cuenta como éxito. */
  registrarLlegada: (lugar_slug: string, metodo: 'gps', lat?: number, lng?: number) => {
    let p = llegadas.get(lugar_slug)
    if (!p) {
      p = privado('/api/visitas', { method: 'POST', body: JSON.stringify({ lugar_slug, metodo, lat, lng }) }).catch(
        (e) => {
          llegadas.delete(lugar_slug) // permite reintentar si falló de verdad
          if (e instanceof ApiError && e.status === 409) return null
          throw e
        },
      )
      llegadas.set(lugar_slug, p)
    }
    return p
  },
  completarReto: (slug: string, respuesta: string[], revelar = false, idioma: 'es' | 'en' = 'es') =>
    privado<{
      correcto: boolean
      completado: boolean
      tlacos_ganados: number
      saldo: number
      ya_visitado?: boolean
      /** Al cerrarse el reto (acertado o revelado): la respuesta correcta, para mostrarla. */
      respuesta_correcta?: string[] | null
    }>(
      `/api/retos/${slug}/completar`,
      { method: 'POST', body: JSON.stringify({ respuesta, revelar, idioma }) },
    ),
  // Ruta del turista (Dev 1 hizo los endpoints; el cliente vive aquí, en src/lib)
  crearRuta: (datos: RutaIn) =>
    privado<RutaCreada>('/api/rutas', { method: 'POST', body: JSON.stringify(datos) }),
  rutaActual: () => privado<Ruta>('/api/rutas/actual'),
  /** Saltar o recortar: se manda la lista de slugs que quedan, en orden. */
  ajustarRuta: (lugares: string[]) =>
    privado<Ruta>('/api/rutas/actual', { method: 'PATCH', body: JSON.stringify({ lugares }) }),
  /** +30 doblones una vez por ruta terminada; `tlacos` es 0 si ya se cobró. */
  compartirRuta: (id: number) =>
    privado<{ tlacos: number; saldo: number }>(`/api/rutas/${id}/compartir`, { method: 'POST' }),
  terminarRuta: () => privado<ResumenRuta>('/api/rutas/actual/terminar', { method: 'POST' }),
  /** Sellos y piezas del rompecabezas (tipo en features/pasaporte). */
  pasaporte: () => privado<unknown>('/api/pasaporte'),
  canjear: (slug: string) =>
    privado<{ codigo: string; saldo: number }>(`/api/promociones/${slug}/canjear`, { method: 'POST' }),
}
