import { describe, expect, it } from 'vitest'
import { calcularAuditoria, type Limiares } from '@/lib/painel'

/**
 * Detecção de anomalia, travada contra os cenários reais do festival.
 *
 * O risco aqui não é deixar fraude passar — é **marcar cliente honesto**. Um
 * alerta que dispara em quase tudo não é sensível: é inútil, e pior, convida a
 * anular voto legítimo. Estes testes existem para segurar o limiar em cima de
 * situações que acontecem de verdade num sábado de casa cheia.
 */

const LIMITES: Limiares = {
  ipPorCasa: 15,
  ipEmCasas: 5,
  rajadaMinima: 8,
  janelaDeRajadaMin: 5,
}

const casa = (id: string) => ({ id, slug: id, nome: id, horarios: {} })

let contador = 0
const avaliacao = (casaId: string, ip: string | null, minuto = 0, segundo = 0) => ({
  id: `a${++contador}`,
  casa_id: casaId,
  criada_em: new Date(Date.UTC(2026, 8, 25, 20, minuto, segundo)).toISOString(),
  ip,
  user_agent: 'teste',
  nota_apresentacao: 4,
  nota_sabor: 4,
  nota_criatividade: 4,
  nota_atendimento: 4,
  anulada_em: null,
  anulada_motivo: null,
})

/** N avaliações espalhadas ao longo de horas, como movimento real de bar. */
const aoLongoDaNoite = (casaId: string, ip: string, quantas: number) =>
  Array.from({ length: quantas }, (_, i) => avaliacao(casaId, ip, i * 11))

const sinais = (linhas: ReturnType<typeof calcularAuditoria>) =>
  new Set(linhas.flatMap((l) => l.anomalias))

describe('wi-fi do bar não pode virar alerta', () => {
  it('14 clientes no mesmo wi-fi, na mesma casa, passam limpo', () => {
    // Era o defeito: com limiar 3, isto acendia a tela inteira numa sexta.
    const linhas = calcularAuditoria(
      [casa('bar')],
      aoLongoDaNoite('bar', '200.1.1.1', 14),
      LIMITES,
    )
    expect(sinais(linhas).has('ip-repetido')).toBe(false)
  })

  it('no limiar, aciona', () => {
    const linhas = calcularAuditoria(
      [casa('bar')],
      aoLongoDaNoite('bar', '200.1.1.1', 15),
      LIMITES,
    )
    expect(linhas.every((l) => l.anomalias.includes('ip-repetido'))).toBe(true)
    expect(linhas[0].doIpNaCasa).toBe(15)
  })

  it('conta por casa, não pelo festival inteiro', () => {
    // Um cliente que visita 4 casas tem 4 avaliações no mesmo IP — e nenhuma
    // casa isolada chega perto do limiar. Antes, esse cliente era marcado.
    const casas = ['a', 'b', 'c', 'd'].map(casa)
    const linhas = calcularAuditoria(
      casas,
      casas.map((c) => avaliacao(c.id, '200.1.1.1')),
      LIMITES,
    )
    expect(sinais(linhas).has('ip-repetido')).toBe(false)
    expect(linhas[0].doIpNaCasa).toBe(1)
  })
})

describe('IP em várias casas — o sinal específico', () => {
  it('4 casas ainda é rolê plausível de uma noite', () => {
    const casas = ['a', 'b', 'c', 'd'].map(casa)
    const linhas = calcularAuditoria(
      casas,
      casas.map((c) => avaliacao(c.id, '200.1.1.1')),
      LIMITES,
    )
    expect(sinais(linhas).has('ip-em-varias-casas')).toBe(false)
  })

  it('5 casas ou mais acende o sinal', () => {
    const casas = ['a', 'b', 'c', 'd', 'e'].map(casa)
    const linhas = calcularAuditoria(
      casas,
      casas.map((c) => avaliacao(c.id, '200.1.1.1')),
      LIMITES,
    )
    expect(linhas.every((l) => l.anomalias.includes('ip-em-varias-casas'))).toBe(true)
    expect(linhas[0].casasDoIp).toBe(5)
  })

  it('pega o caso que volume por casa não pegaria', () => {
    // Uma avaliação em cada uma das 8 casas: nenhuma casa vê repetição, mas o
    // endereço não esteve fisicamente em oito lugares.
    const casas = Array.from({ length: 8 }, (_, i) => casa(`c${i}`))
    const linhas = calcularAuditoria(
      casas,
      casas.map((c) => avaliacao(c.id, '200.9.9.9')),
      LIMITES,
    )
    expect(sinais(linhas).has('ip-repetido')).toBe(false)
    expect(sinais(linhas).has('ip-em-varias-casas')).toBe(true)
  })

  it('IPs distintos na mesma casa não acendem nada', () => {
    const linhas = calcularAuditoria(
      [casa('bar')],
      Array.from({ length: 40 }, (_, i) => avaliacao('bar', `200.1.1.${i + 1}`, i * 4)),
      LIMITES,
    )
    expect(sinais(linhas).size).toBe(0)
  })
})

describe('rajada', () => {
  it('mesa de 7 pedindo a conta junto, tudo dentro da janela, não é rajada', () => {
    // 7 avaliações em 3 minutos: abaixo do mínimo de 8, então nada acende.
    const linhas = calcularAuditoria(
      [casa('bar')],
      Array.from({ length: 7 }, (_, i) => avaliacao('bar', `200.1.1.${i}`, 0, i * 30)),
      LIMITES,
    )
    expect(sinais(linhas).has('rajada')).toBe(false)
  })

  it('8 dentro da janela de cinco minutos acende', () => {
    // 8 em 3min30: cabem na janela e alcançam o mínimo.
    const linhas = calcularAuditoria(
      [casa('bar')],
      Array.from({ length: 8 }, (_, i) => avaliacao('bar', `200.1.1.${i}`, 0, i * 30)),
      LIMITES,
    )
    expect(sinais(linhas).has('rajada')).toBe(true)
  })

  it('8 espalhadas por mais de cinco minutos NÃO acendem, mesmo alcançando o número', () => {
    // O que importa é a concentração, não o total: uma a cada minuto é
    // movimento, não rajada.
    const linhas = calcularAuditoria(
      [casa('bar')],
      Array.from({ length: 8 }, (_, i) => avaliacao('bar', `200.1.1.${i}`, i)),
      LIMITES,
    )
    expect(sinais(linhas).has('rajada')).toBe(false)
  })

  it('as mesmas 8 espalhadas pela noite não acendem', () => {
    const linhas = calcularAuditoria(
      [casa('bar')],
      Array.from({ length: 8 }, (_, i) => avaliacao('bar', `200.1.1.${i}`, i * 20)),
      LIMITES,
    )
    expect(sinais(linhas).has('rajada')).toBe(false)
  })
})

describe('limiares vêm de fora', () => {
  it('subir o limiar apaga o sinal, sem tocar em código', () => {
    const avaliacoes = aoLongoDaNoite('bar', '200.1.1.1', 20)
    const apertado = calcularAuditoria([casa('bar')], avaliacoes, LIMITES)
    const frouxo = calcularAuditoria([casa('bar')], avaliacoes, { ...LIMITES, ipPorCasa: 50 })

    expect(sinais(apertado).has('ip-repetido')).toBe(true)
    expect(sinais(frouxo).has('ip-repetido')).toBe(false)
  })
})

describe('avaliação sem IP', () => {
  it('não acende sinal de IP nem quebra a conta', () => {
    const linhas = calcularAuditoria(
      [casa('bar')],
      Array.from({ length: 20 }, (_, i) => avaliacao('bar', null, i * 11)),
      LIMITES,
    )
    expect(sinais(linhas).has('ip-repetido')).toBe(false)
    expect(sinais(linhas).has('ip-em-varias-casas')).toBe(false)
    expect(linhas[0].doIpNaCasa).toBe(0)
  })
})
