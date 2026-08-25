import { describe, expect, it } from 'vitest'
import { periodoDeVotacao } from '@/lib/fase'
import { CALENDARIO } from '@/data/edicao'

/**
 * Art. 16º — o período de avaliação coincide com o do festival:
 * 19 de setembro a 10 de outubro de 2026.
 *
 * As datas de virada são o que importa: um dia de erro numa ponta significa
 * QR recusando voto no primeiro dia do festival, ou aceitando voto depois do
 * encerramento — e voto fora do prazo entra na apuração sem ninguém notar.
 */

const dia = (iso: string) => periodoDeVotacao(iso)

describe('antes da abertura', () => {
  it('recusa e diz que ainda não começou', () => {
    const r = dia('2026-09-18')
    expect(r?.motivo).toBe('ainda-nao-comecou')
    expect(r?.titulo).toContain('ainda não começou')
  })

  it('conta os dias que faltam', () => {
    expect(dia('2026-09-14')?.texto).toContain('faltam 5 dias')
  })

  it('na véspera fala em amanhã, não em "faltam 1 dias"', () => {
    expect(dia('2026-09-18')?.texto).toContain('amanhã')
  })

  it('meses antes continua recusando', () => {
    expect(dia('2026-06-01')?.motivo).toBe('ainda-nao-comecou')
  })
})

describe('durante o festival', () => {
  it('libera no primeiro dia', () => {
    expect(dia(CALENDARIO.inicioFestival)).toBeNull()
    expect(dia('2026-09-19')).toBeNull()
  })

  it('libera no último dia — o dia 10 conta inteiro', () => {
    expect(dia(CALENDARIO.fimFestival)).toBeNull()
    expect(dia('2026-10-10')).toBeNull()
  })

  it('libera no meio', () => {
    expect(dia('2026-09-30')).toBeNull()
  })
})

describe('depois do encerramento', () => {
  it('recusa já no dia seguinte ao fim', () => {
    const r = dia('2026-10-11')
    expect(r?.motivo).toBe('ja-encerrou')
    expect(r?.titulo).toContain('encerrada em 10 de outubro')
  })

  it('continua recusando durante a apuração e depois dela', () => {
    expect(dia('2026-10-12')?.motivo).toBe('ja-encerrou')
    expect(dia('2026-10-20')?.motivo).toBe('ja-encerrou')
    expect(dia('2027-01-01')?.motivo).toBe('ja-encerrou')
  })
})

describe('as bordas exatas', () => {
  it.each([
    ['2026-09-18', 'fechado'],
    ['2026-09-19', 'aberto'],
    ['2026-10-10', 'aberto'],
    ['2026-10-11', 'fechado'],
  ])('%s está %s', (data, esperado) => {
    expect(periodoDeVotacao(data) === null ? 'aberto' : 'fechado').toBe(esperado)
  })
})
