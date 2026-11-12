// Único punto de contacto con el backend. El navegador ya no habla con Supabase:
// sesión, catálogo, llegada, retos y canjes pasan por FastAPI.

const BASE = import.meta.env.VITE_API_URL ?? ''
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
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.detail ?? `Error ${res.status}`)
  return res.json() as Promise<T>
}

/** Abre (o renueva) la sesión anónima del celular y devuelve un token vigente. */
export async function asegurarSesion(): Promise<string> {
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

const privado = async <T>(ruta: string, init?: RequestInit) => http<T>(ruta, init, await asegurarSesion())

export const api = {
  // Catálogo (público)
  lugares: () => http<unknown[]>('/api/lugares'),
  retoDeLugar: (slug: string) => http<unknown>(`/api/lugares/${slug}/reto`),
  comercios: () => http<unknown[]>('/api/comercios'),
  promociones: () => http<unknown[]>('/api/promociones'),
  eventos: () => http<unknown[]>('/api/eventos'),
  fotos: () => http<unknown[]>('/api/fotos'),
  // Progreso del celular (con sesión)
  saldo: () => privado<{ saldo: number }>('/api/saldo'),
  registrarLlegada: (lugar_slug: string, metodo: 'gps' | 'demo', lat?: number, lng?: number) =>
    privado('/api/visitas', { method: 'POST', body: JSON.stringify({ lugar_slug, metodo, lat, lng }) }),
  completarReto: (slug: string, respuesta: string[], revelar = false, idioma: 'es' | 'en' = 'es') =>
    privado<{ correcto: boolean; completado: boolean; tlacos_ganados: number; saldo: number }>(
      `/api/retos/${slug}/completar`,
      { method: 'POST', body: JSON.stringify({ respuesta, revelar, idioma }) },
    ),
  canjear: (slug: string) =>
    privado<{ codigo: string; saldo: number }>(`/api/promociones/${slug}/canjear`, { method: 'POST' }),
}
