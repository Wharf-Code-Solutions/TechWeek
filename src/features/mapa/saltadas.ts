// Paradas que el turista saltó en la ruta actual. Ya no se quitan de la ruta: se quedan en la lista, en su lugar y
// marcadas como saltadas, y la siguiente parada pasa a la que sigue. Se guardan en la sesión del navegador.
const CLAVE = 'jarana.saltadas'

export function leerSaltadas(): Set<string> {
  try {
    const lista = JSON.parse(sessionStorage.getItem(CLAVE) ?? '[]') as unknown
    return new Set(Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

export function guardarSaltadas(slugs: ReadonlySet<string>) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify([...slugs]))
  } catch {
    /* sin almacenamiento: vale solo mientras la pantalla esté abierta */
  }
}

/** Al armar una ruta nueva no queda ninguna saltada. */
export function limpiarSaltadas() {
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    /* nada que limpiar */
  }
}
