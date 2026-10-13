import { describe, expect, it } from 'vitest'
import { suprimirSinaisDemais, type Anomalia, type LinhaDaAuditoria, type Limiares } from '@/lib/painel'

/**
 * Marcador que dispara demais se desliga sozinho.
 *
 * A regra já estava escrita no projeto: **alerta que acende em quase tudo não
 * é sensível, é inútil** — e pior que inútil, porque convida a anular voto
 * legítimo, e anular tira da casa uma nota que ela ganhou.
 *
 * O caso aconteceu. Na 1ª edição, "IP em várias casas" acendeu em 97% das
 * 2.747 avaliações e "IP repetido" em 65%: o endereço gravado não era o do
 * cliente, e os dois mediam o intermediário. A rajada, que é por tempo, ficou
 * em 19% e seguiu valendo.
 */

const LIMITES: Limiares = {
  ipPorCasa: 15,
  ipEmCasas: 5,
  rajadaMinima: 8,
  janelaDeRajadaMin: 5,
  comentariosIguais: 3,
  tetoDeSinalPct: 25,
}

/** `quantas` linhas, das quais as `comSinal` primeiras levam `sinais`. */
const linhas = (quantas: number, comSinal: number, ...sinais: Anomalia[]): LinhaDaAuditoria[] =>
  Array.from({ length: quantas }, (_, i) => ({
    id: `a${i}`,
    quando: '2026-10-01T22:00:00Z',
    casa: 'Casa',
    casaSlug: 'casa',
    ip: '1.2.3.4',
    agente: null,
    notas: { apresentacao: 5, sabor: 5, criatividade: 5, atendimento: 5 },
    anulada: false,
    motivo: null,
    anomalias: i < comSinal ? [...sinais] : [],
    doIpNaCasa: 1,
    casasDoIp: 1,
    cpf: null,
  }))

describe('supressão do marcador que dispara demais', () => {
  it('acima do teto o marcador some das linhas', () => {
    const r = suprimirSinaisDemais(linhas(100, 97, 'ip-em-varias-casas'), LIMITES)
    expect(r.linhas.every((l) => l.anomalias.length === 0)).toBe(true)
    expect(r.suprimidos).toEqual([{ sinal: 'ip-em-varias-casas', disparos: 97, pct: 97 }])
  })

  it('abaixo do teto o marcador continua valendo', () => {
    // A rajada ficou em 19% na 1ª edição — é o sinal que sobrou funcionando.
    const r = suprimirSinaisDemais(linhas(100, 19, 'rajada'), LIMITES)
    expect(r.linhas.filter((l) => l.anomalias.includes('rajada'))).toHaveLength(19)
    expect(r.suprimidos).toEqual([])
  })

  it('exatamente no teto ainda vale — o corte é "acima de"', () => {
    const r = suprimirSinaisDemais(linhas(100, 25, 'rajada'), LIMITES)
    expect(r.suprimidos).toEqual([])
    const um = suprimirSinaisDemais(linhas(100, 26, 'rajada'), LIMITES)
    expect(um.suprimidos).toHaveLength(1)
  })

  it('suprime um marcador sem derrubar o outro da mesma linha', () => {
    /**
     * O caso real: a mesma avaliação levava "IP em várias casas" (97%, some)
     * e "rajada" (19%, fica). Suprimir a linha inteira apagaria o único sinal
     * que ainda vale.
     */
    const todas = linhas(100, 97, 'ip-em-varias-casas')
    for (let i = 0; i < 19; i++) todas[i].anomalias.push('rajada')

    const r = suprimirSinaisDemais(todas, LIMITES)
    expect(r.linhas.filter((l) => l.anomalias.includes('rajada'))).toHaveLength(19)
    expect(r.linhas.some((l) => l.anomalias.includes('ip-em-varias-casas'))).toBe(false)
    expect(r.suprimidos.map((s) => s.sinal)).toEqual(['ip-em-varias-casas'])
  })

  it('o suprimido volta na lista, com o número que o desligou', () => {
    // Não pode sumir em silêncio: a Comissão leria ausência de alerta como
    // ausência de problema.
    const r = suprimirSinaisDemais(linhas(200, 130, 'ip-repetido'), LIMITES)
    expect(r.suprimidos[0].disparos).toBe(130)
    expect(r.suprimidos[0].pct).toBe(65)
  })

  it('o que mexe em mais avaliações vem primeiro', () => {
    const todas = linhas(100, 97, 'ip-em-varias-casas')
    for (let i = 0; i < 65; i++) todas[i].anomalias.push('ip-repetido')
    const r = suprimirSinaisDemais(todas, LIMITES)
    expect(r.suprimidos.map((s) => s.sinal)).toEqual(['ip-em-varias-casas', 'ip-repetido'])
  })

  it('teto em 100 não suprime nada — é como desligar a regra', () => {
    const r = suprimirSinaisDemais(linhas(100, 99, 'ip-repetido'), {
      ...LIMITES,
      tetoDeSinalPct: 100,
    })
    expect(r.suprimidos).toEqual([])
  })

  it('lista vazia não quebra', () => {
    expect(suprimirSinaisDemais([], LIMITES)).toEqual({ linhas: [], suprimidos: [] })
  })

  it('não altera as linhas quando não há nada a suprimir', () => {
    const entrada = linhas(10, 1, 'rajada')
    const r = suprimirSinaisDemais(entrada, LIMITES)
    expect(r.linhas).toBe(entrada)
  })
})
