import { describe, expect, it } from 'vitest'
import { calcularApuracao } from '@/lib/painel'

/**
 * A matemática da apuração, travada contra o Regulamento Oficial.
 *
 * Não fala com o banco: números escolhidos, conta conferida. Isto existe
 * porque errar aqui não dá erro em lugar nenhum — dá o campeão errado, e só
 * se descobre na premiação.
 *
 * Artigos cobertos:
 *  - Art. 13º — 4 critérios de 0 a 5, total 20 pontos por avaliação
 *  - Art. 17º — nota final = soma das notas ÷ número de avaliações
 *  - Art. 18º — piso de elegibilidade = 10% da média por estabelecimento
 *  - Art. 19º — desempate: sabor, criatividade, número de avaliações
 */

type Nota = [number, number, number, number]

const casa = (id: string, nome = id) => ({ id, slug: id, nome, ativa: true })

const avaliacao = (casaId: string, [a, s, c, at]: Nota, anulada = false) => ({
  casa_id: casaId,
  nota_apresentacao: a,
  nota_sabor: s,
  nota_criatividade: c,
  nota_atendimento: at,
  anulada_em: anulada ? '2026-10-01T00:00:00Z' : null,
})

/** Repete a mesma avaliação N vezes, para montar volume. */
const varias = (casaId: string, nota: Nota, quantas: number) =>
  Array.from({ length: quantas }, () => avaliacao(casaId, nota))

describe('Art. 13 e 17 — nota final de 0 a 20', () => {
  it('soma os quatro critérios, não tira a média deles', () => {
    const { linhas } = calcularApuracao([casa('a')], [avaliacao('a', [5, 5, 4, 5])])
    // 5+5+4+5 = 19. Dividir por 4 daria 4,75 e o ranking seria o mesmo — mas o
    // número publicado no certificado estaria errado.
    expect(linhas[0].mediaGeral).toBe(19)
  })

  it('nota máxima possível é 20', () => {
    const { linhas } = calcularApuracao([casa('a')], [avaliacao('a', [5, 5, 5, 5])])
    expect(linhas[0].mediaGeral).toBe(20)
  })

  it('média aritmética simples entre avaliações, sem peso por volume', () => {
    // Art. 17, parágrafo único: cada voto vale igual.
    const { linhas } = calcularApuracao(
      [casa('a')],
      [avaliacao('a', [5, 5, 5, 5]), avaliacao('a', [1, 1, 1, 1])],
    )
    expect(linhas[0].mediaGeral).toBe(12) // (20 + 4) / 2
  })

  it('média por critério fica na escala do critério, de 0 a 5', () => {
    const { linhas } = calcularApuracao([casa('a')], [avaliacao('a', [5, 3, 4, 2])])
    expect(linhas[0].medias.sabor).toBe(3)
    expect(linhas[0].medias.apresentacao).toBe(5)
  })

  it('avaliação anulada fica fora da conta, mas é contada como anulada', () => {
    const { linhas, votos } = calcularApuracao(
      [casa('a')],
      [avaliacao('a', [5, 5, 5, 5]), avaliacao('a', [0, 0, 0, 0], true)],
    )
    expect(linhas[0].mediaGeral).toBe(20)
    expect(linhas[0].avaliacoes).toBe(1)
    expect(linhas[0].anuladas).toBe(1)
    expect(votos).toBe(1)
  })
})

describe('Art. 18 — piso mínimo de elegibilidade', () => {
  it('reproduz o exemplo do regulamento: 4.000 avaliações, 20 casas, piso 20', () => {
    // "se o festival receber 4.000 avaliações no total entre 20 estabelecimentos,
    //  a média é 200 por estabelecimento, e o piso mínimo será de 20 avaliações"
    const casas = Array.from({ length: 20 }, (_, i) => casa(`c${i}`))
    const avaliacoes = casas.flatMap((c) => varias(c.id, [4, 4, 4, 4], 200))

    const { mediaDeAvaliacoes, piso } = calcularApuracao(casas, avaliacoes)
    expect(mediaDeAvaliacoes).toBe(200)
    expect(piso).toBe(20)
  })

  it('quem fica abaixo do piso sai do ranking e não ocupa posição', () => {
    // 19 casas com 200 votos + 1 casa com 5 votos de nota máxima.
    const casas = [...Array.from({ length: 19 }, (_, i) => casa(`c${i}`)), casa('pouca', 'Casa Pouca')]
    const avaliacoes = [
      ...casas.slice(0, 19).flatMap((c) => varias(c.id, [4, 4, 4, 4], 200)),
      ...varias('pouca', [5, 5, 5, 5], 5),
    ]

    const { linhas, piso } = calcularApuracao(casas, avaliacoes)
    const pouca = linhas.find((l) => l.slug === 'pouca')!

    expect(piso).toBeCloseTo((3805 / 20) * 0.1, 5)
    // Nota 20, a melhor do festival — e mesmo assim fora do ranking.
    expect(pouca.mediaGeral).toBe(20)
    expect(pouca.elegivel).toBe(false)
    expect(pouca.posicao).toBe(0)
    // O 1º lugar é de quem alcançou o piso, não de quem teve a maior nota.
    expect(linhas[0].elegivel).toBe(true)
    expect(linhas[0].posicao).toBe(1)
  })

  it('as posições ficam sem buraco quando alguém é excluído', () => {
    const casas = [...Array.from({ length: 19 }, (_, i) => casa(`c${i}`)), casa('pouca')]
    const avaliacoes = [
      ...casas.slice(0, 19).flatMap((c) => varias(c.id, [4, 4, 4, 4], 200)),
      ...varias('pouca', [5, 5, 5, 5], 5),
    ]
    const { linhas } = calcularApuracao(casas, avaliacoes)
    const posicoes = linhas.filter((l) => l.elegivel).map((l) => l.posicao)
    expect(posicoes).toEqual(Array.from({ length: posicoes.length }, (_, i) => i + 1))
  })

  it('casa sem nenhuma avaliação nunca é elegível', () => {
    const { linhas } = calcularApuracao(
      [casa('a'), casa('vazia')],
      varias('a', [4, 4, 4, 4], 10),
    )
    const vazia = linhas.find((l) => l.slug === 'vazia')!
    expect(vazia.elegivel).toBe(false)
    expect(vazia.posicao).toBe(0)
    expect(vazia.mediaGeral).toBeNull()
  })
})

describe('Art. 19 — desempate', () => {
  const empate = (sabor: number, criatividade: number, quantas: number, id: string) =>
    varias(id, [4, sabor, criatividade, 4], quantas)

  it('1º critério: maior média em Sabor', () => {
    // Ambas somam 16 por avaliação; muda só a distribuição.
    const { linhas } = calcularApuracao(
      [casa('menos'), casa('mais')],
      [...empate(3, 5, 10, 'menos'), ...empate(5, 3, 10, 'mais')],
    )
    expect(linhas[0].mediaGeral).toBe(linhas[1].mediaGeral)
    expect(linhas[0].slug).toBe('mais')
  })

  it('2º critério: criatividade, quando o sabor empata', () => {
    const { linhas } = calcularApuracao(
      [casa('baixa'), casa('alta')],
      [
        ...varias('baixa', [5, 4, 3, 4], 10),
        ...varias('alta', [3, 4, 5, 4], 10),
      ],
    )
    expect(linhas[0].medias.sabor).toBe(linhas[1].medias.sabor)
    expect(linhas[0].slug).toBe('alta')
  })

  it('3º critério: número de avaliações, quando sabor e criatividade empatam', () => {
    const { linhas } = calcularApuracao(
      [casa('poucas'), casa('muitas')],
      [...varias('poucas', [4, 4, 4, 4], 30), ...varias('muitas', [4, 4, 4, 4], 60)],
    )
    expect(linhas[0].slug).toBe('muitas')
    expect(linhas[0].avaliacoes).toBe(60)
  })
})
