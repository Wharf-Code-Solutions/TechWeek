import { describe, expect, it } from 'vitest'
import type { Evento } from '../../types/contratos'
import { enCurso, eventosVigentes } from './eventos'

const ev = (slug: string, inicio: string, fin: string) => ({ slug, inicio, fin }) as Evento
const AHORA = Date.parse('2026-11-20T20:00:00-06:00')

describe('agenda', () => {
  const lista = [
    ev('despues', '2026-11-21T19:00:00-06:00', '2026-11-21T21:00:00-06:00'),
    ev('pasado', '2026-11-19T19:00:00-06:00', '2026-11-19T21:00:00-06:00'),
    ev('ahora', '2026-11-20T19:00:00-06:00', '2026-11-20T21:00:00-06:00'),
  ]

  it('quita los terminados y ordena por inicio', () => {
    expect(eventosVigentes(lista, AHORA).map((e) => e.slug)).toEqual(['ahora', 'despues'])
  })
  it('marca el evento en curso', () => {
    expect(enCurso(lista[2], AHORA)).toBe(true)
    expect(enCurso(lista[0], AHORA)).toBe(false)
  })
})

describe('días en Veracruz', () => {
  it('usa la hora de Veracruz, no la del celular', async () => {
    const { diaVeracruz } = await import('./eventos')
    // 01:00 UTC del 21 = 19:00 del 20 en Veracruz
    expect(diaVeracruz('2026-11-21T01:00:00+00:00')).toBe('2026-11-20')
  })
  it('lista 5 días seguidos desde hoy', async () => {
    const { proximosDias } = await import('./eventos')
    expect(proximosDias(5, AHORA)).toEqual(['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24'])
  })
})
