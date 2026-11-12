// Tras un despliegue nuevo, una pestaña que ya estaba abierta pide archivos con nombre viejo que ya no existen: la
// pantalla se queda en blanco hasta recargar. Aquí se detecta ese error y se recarga una sola vez (sin ciclos).
const CLAVE = 'jarana.recarga'
const ESPERA_MS = 15_000

/** ¿El error es de un módulo o archivo de la app que no se pudo descargar? */
export function esErrorDeModulo(error: unknown): boolean {
  const texto = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  return /dynamically imported module|Importing a module script failed|error loading dynamically|Loading chunk|Failed to fetch/i.test(texto)
}

/** Recarga la página si no se recargó hace poco. Devuelve true si la recarga está en marcha. */
export function recargarUnaVez(ahora = Date.now()): boolean {
  try {
    const ultima = Number(sessionStorage.getItem(CLAVE) ?? 0)
    if (ahora - ultima < ESPERA_MS) return false
    sessionStorage.setItem(CLAVE, String(ahora))
  } catch {
    return false // sin almacenamiento no se arriesga a un ciclo de recargas
  }
  window.location.reload()
  return true
}
