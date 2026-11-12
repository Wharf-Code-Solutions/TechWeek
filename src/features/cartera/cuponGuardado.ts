// El cupón canjeado se recuerda en la sesión para no perderlo si se recarga la página.
// Es válido solo unos minutos; pasado ese tiempo se vuelve a mostrar el deslizador.
export const VALIDEZ_MIN = 15

export interface CuponGuardado {
  codigo: string
  /** Momento del canje, en ms desde 1970. */
  en: number
}

const clave = (slug: string) => `jarana.cupon.${slug}`

export function vigente(c: CuponGuardado | null, ahora = Date.now()): c is CuponGuardado {
  return !!c && ahora - c.en >= 0 && ahora - c.en < VALIDEZ_MIN * 60_000
}

export function leerCupon(slug: string): CuponGuardado | null {
  try {
    const c = JSON.parse(sessionStorage.getItem(clave(slug)) ?? 'null') as CuponGuardado | null
    return vigente(c) ? c : null
  } catch {
    return null
  }
}

export function guardarCupon(slug: string, c: CuponGuardado) {
  try {
    sessionStorage.setItem(clave(slug), JSON.stringify(c))
  } catch {
    /* sin almacenamiento: el cupón se muestra pero no sobrevive a una recarga */
  }
}
