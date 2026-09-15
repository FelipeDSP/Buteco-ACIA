import { describe, expect, it } from 'vitest'
import { GARCOM_NOME_MAXIMO, limparGarcom } from '@/lib/voto'
import { calcularGarcons } from '@/lib/painel'

/**
 * A avaliação de quem atendeu é opcional, **fora do regulamento** e
 * **desvinculada** do voto — a mesma família das observações. O que estes
 * testes seguram: que metade preenchida não passa, que a conta do painel
 * agrupa nomes como uma pessoa os escreveria de jeitos diferentes, e que o
 * item que chega ao painel não carrega CPF, IP, hora nem a lista de notas em
 * ordem de chegada.
 */

describe('limpeza da avaliação do garçom', () => {
  it('ausente é null — a parte é opcional', () => {
    expect(limparGarcom(undefined)).toEqual({ ok: true, garcom: null })
    expect(limparGarcom(null)).toEqual({ ok: true, garcom: null })
    expect(limparGarcom({})).toEqual({ ok: true, garcom: null })
    expect(limparGarcom({ nome: '   ' })).toEqual({ ok: true, garcom: null })
  })

  it('nome e nota juntos passam, com o nome aparado', () => {
    expect(limparGarcom({ nome: '  João   Pedro ', nota: 4 })).toEqual({
      ok: true,
      garcom: { nome: 'João Pedro', nota: 4 },
    })
  })

  it('nota sem nome é recusada — a casa não saberia de quem é', () => {
    const r = limparGarcom({ nota: 5 })
    expect(r.ok).toBe(false)
  })

  it('nome sem nota é recusado — não diz nada', () => {
    expect(limparGarcom({ nome: 'Ana' }).ok).toBe(false)
  })

  it('nota fora de 0 a 5, ou não inteira, é recusada', () => {
    expect(limparGarcom({ nome: 'Ana', nota: 6 }).ok).toBe(false)
    expect(limparGarcom({ nome: 'Ana', nota: -1 }).ok).toBe(false)
    expect(limparGarcom({ nome: 'Ana', nota: 4.5 }).ok).toBe(false)
    expect(limparGarcom({ nome: 'Ana', nota: '5' }).ok).toBe(false)
  })

  it('zero é nota válida, não ausência', () => {
    expect(limparGarcom({ nome: 'Ana', nota: 0 })).toEqual({
      ok: true,
      garcom: { nome: 'Ana', nota: 0 },
    })
  })

  it('respeita o limite do nome nos dois lados', () => {
    expect(limparGarcom({ nome: 'A', nota: 3 }).ok).toBe(false)
    expect(limparGarcom({ nome: 'a'.repeat(GARCOM_NOME_MAXIMO), nota: 3 }).ok).toBe(true)
    expect(limparGarcom({ nome: 'a'.repeat(GARCOM_NOME_MAXIMO + 1), nota: 3 }).ok).toBe(false)
  })

  it('recusa o que não é objeto — um POST pode chegar sem passar pelo formulário', () => {
    expect(limparGarcom('João').ok).toBe(false)
    expect(limparGarcom(5).ok).toBe(false)
  })
})

describe('a conta do painel', () => {
  const casa = (id: string, extra: Partial<{ ativa: boolean; foto_url: string | null }> = {}) => ({
    id,
    slug: id,
    nome: `Casa ${id}`,
    prato: `Prato ${id}`,
    prato_confirmado: true,
    foto_url: null as string | null,
    ativa: true,
    ...extra,
  })
  const av = (casaId: string, nome: string, nota: number, i = 0) => ({
    id: `${casaId}-${nome}-${nota}-${i}`,
    casa_id: casaId,
    nome,
    nota,
    criada_em: '2026-09-20',
  })

  it('junta grafias que diferem só em acento, caixa e espaço', () => {
    const [c] = calcularGarcons(
      [casa('a')],
      [av('a', 'João', 5), av('a', 'joao', 4, 1), av('a', ' JOÃO ', 3, 2), av('a', 'João', 5, 3)],
    )
    expect(c.garcons).toHaveLength(1)
    expect(c.garcons[0].nome).toBe('João') // a grafia mais frequente
    expect(c.garcons[0].grafias).toEqual([' JOÃO ', 'joao'])
    expect(c.garcons[0].avaliacoes).toBe(4)
    expect(c.garcons[0].media).toBe(4.3) // (5+4+3+5)/4 = 4.25 → uma casa decimal
  })

  it('nomes diferentes de verdade ficam separados — quem sabe se é a mesma pessoa é a casa', () => {
    const [c] = calcularGarcons([casa('a')], [av('a', 'João', 5), av('a', 'João Pedro', 2)])
    expect(c.garcons.map((g) => g.nome)).toEqual(['João', 'João Pedro'])
  })

  it('ordena por média, depois por volume', () => {
    const [c] = calcularGarcons(
      [casa('a')],
      [
        av('a', 'Ana', 5),
        av('a', 'Bia', 5),
        av('a', 'Bia', 5, 1),
        av('a', 'Caio', 3),
      ],
    )
    expect(c.garcons.map((g) => g.nome)).toEqual(['Bia', 'Ana', 'Caio'])
  })

  it('a mesma pessoa em casas diferentes não se mistura', () => {
    const [a, b] = calcularGarcons(
      [casa('a'), casa('b')],
      [av('a', 'João', 5), av('a', 'João', 5, 1), av('b', 'João', 1)],
    )
    expect(a.id).toBe('a')
    expect(a.garcons[0]).toMatchObject({ nome: 'João', avaliacoes: 2, media: 5 })
    expect(b.garcons[0]).toMatchObject({ nome: 'João', avaliacoes: 1, media: 1 })
  })

  it('casa sem avaliação continua na grade, zerada, e a grade sai da com mais para a com menos', () => {
    const r = calcularGarcons([casa('vazia'), casa('cheia')], [av('cheia', 'Ana', 4)])
    expect(r.map((c) => [c.id, c.total])).toEqual([
      ['cheia', 1],
      ['vazia', 0],
    ])
    expect(r[1].garcons).toEqual([])
  })

  it('o que chega ao painel não carrega CPF, IP, hora nem a lista de notas', () => {
    const [c] = calcularGarcons([casa('a')], [av('a', 'Ana', 4), av('a', 'Ana', 2, 1)])
    const chaves = Object.keys(c.garcons[0]).sort()
    expect(chaves).toEqual(['avaliacoes', 'grafias', 'media', 'nome'])
    // Sem a sequência de notas: em ordem de chegada ela reconstrói quem
    // passou pela casa, mesmo sem hora.
    expect(JSON.stringify(c)).not.toMatch(/cpf|ip|criada_em|notas/)
  })

  it('prato não confirmado não é anunciado pelo painel', () => {
    const [c] = calcularGarcons([{ ...casa('a'), prato_confirmado: false }], [])
    expect(c.prato).toBe('Prato a confirmar')
  })
})
