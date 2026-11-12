// Comparte la imagen con el menú del celular; sin él, la descarga y copia el texto.
export type Resultado = 'compartido' | 'cancelado' | 'descargado'

export async function compartirImagen(imagen: Blob, texto: string, nombre = 'jarana-ruta.png'): Promise<Resultado> {
  const archivo = new File([imagen], nombre, { type: 'image/png' })
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], text: texto })
      return 'compartido'
    } catch (e) {
      // Cerró el menú sin elegir: cuenta como intento (el servidor no puede verificar más).
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelado'
      throw e
    }
  }
  const url = URL.createObjectURL(imagen)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  try {
    await navigator.clipboard?.writeText(texto)
  } catch {
    /* sin permiso de portapapeles: la descarga basta */
  }
  return 'descargado'
}
