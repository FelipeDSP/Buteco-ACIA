import { describe, expect, it } from 'vitest'
import {
  divulgacaoAtrasada,
  podioVisivel,
  publicacaoEhParcial,
  republicarEhDelicado,
} from '@/lib/resultado'
import { CALENDARIO } from '@/data/edicao'

/**
 * A regra que decide se o pódio aparece.
 *
 * **Quem manda é o interruptor da Comissão, e manda nos dois sentidos.** A
 * data já mandou aqui e o efeito era perverso: a partir de 14/10 o pódio era
 * forçado no ar e não havia mais como ocultá-lo — nem para corrigir número
 * errado, nem enquanto uma casa contestava.
 *
 * A data não sumiu: virou aviso (`divulgacaoAtrasada`), para trocar a trava
 * por um botão não criar um jeito novo de errar — esquecer de clicar no dia.
 */

const publicado = (visivel: boolean) => [{ visivel }, { visivel }, { visivel }]

describe('sem registro publicado', () => {
  it('não mostra nada, em data nenhuma', () => {
    expect(podioVisivel([])).toBe(false)
  })

  it('liberar sem registro não inventa pódio', () => {
    expect(podioVisivel([])).toBe(false)
    expect(divulgacaoAtrasada([], '2026-12-01')).toBe(false)
  })
})

describe('a Comissão decide, e a data não desempata', () => {
  it('liberado aparece na hora, mesmo muito antes da data', () => {
    expect(podioVisivel(publicado(true))).toBe(true)
  })

  it('oculto continua oculto DEPOIS da data — o ponto da mudança', () => {
    // Antes isto dava `true`: a data forçava o pódio no ar e a Comissão
    // perdia a capacidade de tirá-lo, inclusive para corrigir erro.
    expect(podioVisivel(publicado(false))).toBe(false)
  })

  it('basta uma linha visível para o pódio estar no ar', () => {
    expect(podioVisivel([{ visivel: false }, { visivel: true }])).toBe(true)
  })

  it('linha sem o campo não conta como visível', () => {
    expect(podioVisivel([{}, {}])).toBe(false)
  })
})

describe('o aviso que substituiu a trava', () => {
  it('não acende antes da data de divulgação', () => {
    expect(divulgacaoAtrasada(publicado(false), '2026-10-13')).toBe(false)
    expect(divulgacaoAtrasada(publicado(false), '2026-09-25')).toBe(false)
  })

  it('acende a partir da data se o pódio segue oculto', () => {
    expect(divulgacaoAtrasada(publicado(false), CALENDARIO.divulgacao)).toBe(true)
    expect(divulgacaoAtrasada(publicado(false), '2026-11-01')).toBe(true)
  })

  it('não acende se o pódio já está no ar', () => {
    expect(divulgacaoAtrasada(publicado(true), CALENDARIO.divulgacao)).toBe(false)
    expect(divulgacaoAtrasada(publicado(true), '2026-12-31')).toBe(false)
  })

  it('avisa, não decide: com o aviso aceso o pódio continua oculto', () => {
    const linhas = publicado(false)
    expect(divulgacaoAtrasada(linhas, '2026-11-01')).toBe(true)
    expect(podioVisivel(linhas)).toBe(false)
  })
})

describe('republicar depois de o público já ter visto', () => {
  it('não é delicado com o pódio oculto, mesmo passada a data', () => {
    // O público não viu nada: republicar aqui é corrigir rascunho.
    expect(republicarEhDelicado(publicado(false))).toBe(false)
  })

  it('é delicado com o pódio no ar, mesmo muito antes da data', () => {
    // Liberado em setembro e republicado em seguida: as casas já viram.
    expect(republicarEhDelicado(publicado(true))).toBe(true)
  })

  it('sem publicação nenhuma não há o que ser delicado', () => {
    expect(republicarEhDelicado([])).toBe(false)
  })
})

describe('publicar é livre — o aviso de parcial não bloqueia', () => {
  it('publicar antes do fim do festival é avisado como parcial', () => {
    expect(publicacaoEhParcial('2026-09-25')).toBe(true)
    expect(publicacaoEhParcial(CALENDARIO.fimFestival)).toBe(true)
  })

  it('depois do fim do festival deixa de ser parcial', () => {
    expect(publicacaoEhParcial('2026-10-11')).toBe(false)
  })
})

describe('as bordas exatas da divulgação', () => {
  it.each([
    ['2026-10-13', false],
    [CALENDARIO.divulgacao, true],
    ['2026-10-15', true],
  ])('oculto em %s → aviso de atraso: %s', (dia, esperado) => {
    expect(divulgacaoAtrasada(publicado(false), dia as string)).toBe(esperado)
  })

  it.each(['2026-10-13', CALENDARIO.divulgacao, '2026-10-15', '2027-01-01'])(
    'e em %s o pódio oculto segue oculto',
    () => {
      expect(podioVisivel(publicado(false))).toBe(false)
    },
  )
})
