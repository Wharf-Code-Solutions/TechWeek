import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DURACION_OLAS_MS, cubrirConOlas, descubrirOlas, estadoOlas } from './olas'

describe('transición de olas', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('window', globalThis)
  })
  afterEach(() => {
    descubrirOlas()
    vi.runAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('empieza oculta, cubre y resuelve cuando ya cubre', async () => {
    expect(estadoOlas()).toBe('oculto')
    const listo = cubrirConOlas()
    expect(estadoOlas()).toBe('cubriendo')
    await vi.advanceTimersByTimeAsync(DURACION_OLAS_MS)
    await listo
    expect(estadoOlas()).toBe('cubriendo')
  })

  it('al descubrir sigue de largo y luego vuelve a ocultarse', async () => {
    void cubrirConOlas()
    await vi.advanceTimersByTimeAsync(DURACION_OLAS_MS)
    descubrirOlas()
    expect(estadoOlas()).toBe('descubriendo')
    await vi.advanceTimersByTimeAsync(DURACION_OLAS_MS)
    expect(estadoOlas()).toBe('oculto')
  })

  it('descubrir sin haber cubierto no hace nada', () => {
    descubrirOlas()
    expect(estadoOlas()).toBe('oculto')
  })

  it('si la pantalla nueva no avisa, las olas se retiran solas', async () => {
    void cubrirConOlas()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(estadoOlas()).toBe('oculto')
  })
})
