import { describe, expect, it } from 'vitest'
import { calcularRecorrencia } from '@/lib/painel'

/**
 * A ACIA pediu este número para saber se o festival gerou **rolê** — gente
 * circulando entre bares — ou se cada pessoa votou só onde já ia comer.
 *
 * A resposta na 1ª edição foi dura: 96,5% avaliaram uma casa só. É o tipo de
 * número que precisa estar certo justamente porque contraria a expectativa de
 * quem organizou — se estiver errado para mais, ninguém questiona.
 */

const av = (cpf: string | null, casa: string, anulada = false) => ({
  cpf,
  casa_id: casa,
  anulada_em: anulada ? '2026-10-01T00:00:00Z' : null,
})

describe('recorrência por CPF', () => {
  it('conta pessoas, não avaliações', () => {
    const r = calcularRecorrencia([av('1', 'a'), av('1', 'b'), av('2', 'a')])
    expect(r.pessoas).toBe(2)
    expect(r.avaliacoes).toBe(3)
  })

  it('agrupa pela quantidade de casas distintas que a pessoa visitou', () => {
    const r = calcularRecorrencia([
      av('1', 'a'),
      av('2', 'a'),
      av('3', 'a'),
      av('4', 'a'),
      av('4', 'b'),
      av('5', 'a'),
      av('5', 'b'),
      av('5', 'c'),
    ])
    expect(r.distribuicao).toEqual([
      { casas: 1, pessoas: 3 },
      { casas: 2, pessoas: 1 },
      { casas: 3, pessoas: 1 },
    ])
  })

  it('a distribuição sai da menor para a maior', () => {
    const r = calcularRecorrencia([
      av('5', 'a'), av('5', 'b'), av('5', 'c'),
      av('1', 'a'),
      av('4', 'a'), av('4', 'b'),
    ])
    expect(r.distribuicao.map((d) => d.casas)).toEqual([1, 2, 3])
  })

  it('anulada não entra em conta nenhuma', () => {
    const r = calcularRecorrencia([av('1', 'a'), av('1', 'b', true)])
    expect(r.pessoas).toBe(1)
    expect(r.avaliacoes).toBe(1)
    expect(r.distribuicao).toEqual([{ casas: 1, pessoas: 1 }])
  })

  it('sem CPF fica de fora, mas contado — não some sem explicação', () => {
    /**
     * As avaliações anteriores a 27/08/2026 não guardaram o número. Sem este
     * contador o total do relatório não fecharia com o da apuração, e a
     * diferença pareceria erro de conta.
     */
    const r = calcularRecorrencia([av('1', 'a'), av(null, 'a'), av(null, 'b')])
    expect(r.pessoas).toBe(1)
    expect(r.avaliacoes).toBe(1)
    expect(r.semCpf).toBe(2)
  })

  it('a mesma pessoa na mesma casa não vira duas casas', () => {
    // O índice único já impede no banco; aqui é a segunda tranca.
    const r = calcularRecorrencia([av('1', 'a'), av('1', 'a')])
    expect(r.distribuicao).toEqual([{ casas: 1, pessoas: 1 }])
  })

  it('lista vazia não quebra', () => {
    expect(calcularRecorrencia([])).toEqual({
      pessoas: 0,
      avaliacoes: 0,
      semCpf: 0,
      distribuicao: [],
    })
  })

  it('a soma das pessoas da distribuição é o total de pessoas', () => {
    const entradas = [
      av('1', 'a'), av('2', 'a'), av('2', 'b'), av('3', 'c'),
      av('3', 'd'), av('3', 'e'), av(null, 'a'), av('4', 'b', true),
    ]
    const r = calcularRecorrencia(entradas)
    expect(r.distribuicao.reduce((s, d) => s + d.pessoas, 0)).toBe(r.pessoas)
  })
})
