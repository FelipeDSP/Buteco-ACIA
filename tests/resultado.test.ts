import { describe, expect, it } from 'vitest'
import {
  podePublicar,
  podioVisivel,
  publicacaoEhParcial,
  republicarEhDelicado,
} from '@/lib/resultado'
import { CALENDARIO } from '@/data/edicao'

/**
 * A regra que decide se o pódio aparece.
 *
 * O ponto delicado é a ordem de precedência: **a data manda sobre a existência
 * do registro**. A Comissão apura de 11 a 13 e publica quando termina, mas o
 * resultado só é anunciado no evento de premiação. Entre uma coisa e outra a
 * tabela está cheia e a página tem que continuar dizendo que não saiu — senão
 * o campeão vaza antes da cerimônia, por uma URL que qualquer um adivinha.
 */

describe('sem registro publicado', () => {
  it('não mostra nada, mesmo depois da data de divulgação', () => {
    expect(podioVisivel(0, CALENDARIO.divulgacao)).toBe(false)
    expect(podioVisivel(0, '2026-12-31')).toBe(false)
  })

  it('não mostra nada durante o festival', () => {
    expect(podioVisivel(0, '2026-09-25')).toBe(false)
  })
})

describe('com registro, antes da data de divulgação', () => {
  it('continua escondido — a data manda sobre o registro', () => {
    // Publicado no primeiro dia da apuração, três dias antes de divulgar.
    expect(podioVisivel(3, CALENDARIO.inicioApuracao)).toBe(false)
  })

  it('escondido na véspera da divulgação', () => {
    expect(podioVisivel(3, '2026-10-13')).toBe(false)
  })

  it('escondido inclusive durante o festival, se alguém publicar cedo', () => {
    expect(podioVisivel(3, '2026-09-30')).toBe(false)
  })
})

describe('com registro, a partir da data de divulgação', () => {
  it('aparece no dia exato da divulgação', () => {
    expect(podioVisivel(3, CALENDARIO.divulgacao)).toBe(true)
    expect(podioVisivel(3, '2026-10-14')).toBe(true)
  })

  it('continua aparecendo depois', () => {
    expect(podioVisivel(3, '2026-11-01')).toBe(true)
    expect(podioVisivel(3, '2027-03-15')).toBe(true)
  })

  it('aparece mesmo com pódio incompleto', () => {
    // Se só uma casa alcançou o piso do Art. 18, o pódio tem uma linha só.
    expect(podioVisivel(1, CALENDARIO.divulgacao)).toBe(true)
  })
})

describe('publicar é livre — a trava virou escolha, não data', () => {
  it('pode publicar durante o festival', () => {
    expect(podePublicar()).toBe(true)
  })

  it('publicar antes do fim do festival é avisado como parcial', () => {
    expect(publicacaoEhParcial('2026-09-25')).toBe(true)
    expect(publicacaoEhParcial(CALENDARIO.fimFestival)).toBe(true)
  })

  it('depois do fim do festival deixa de ser parcial', () => {
    expect(publicacaoEhParcial('2026-10-11')).toBe(false)
  })
})

describe('a Comissão libera o pódio quando quiser', () => {
  const publicado = (visivel: boolean) => [{ visivel }, { visivel }, { visivel }]

  it('liberado aparece na hora, mesmo muito antes da data', () => {
    expect(podioVisivel(publicado(true), '2026-09-20')).toBe(true)
    expect(podioVisivel(publicado(true), CALENDARIO.inicioApuracao)).toBe(true)
  })

  it('não liberado continua esperando a data — a proteção não sumiu', () => {
    expect(podioVisivel(publicado(false), '2026-09-20')).toBe(false)
    expect(podioVisivel(publicado(false), '2026-10-13')).toBe(false)
  })

  it('não liberado aparece sozinho na data de divulgação', () => {
    // O automatismo continua: ninguém precisa lembrar de clicar no dia.
    expect(podioVisivel(publicado(false), CALENDARIO.divulgacao)).toBe(true)
  })

  it('sem registro nenhum, liberar não inventa pódio', () => {
    expect(podioVisivel([], '2026-12-01')).toBe(false)
  })
})

describe('republicar depois de o público já ter visto', () => {
  it('não é delicado antes da divulgação — ainda é rascunho', () => {
    expect(republicarEhDelicado(CALENDARIO.inicioApuracao)).toBe(false)
    expect(republicarEhDelicado('2026-10-13')).toBe(false)
  })

  it('passa a exigir confirmação extra a partir da divulgação', () => {
    expect(republicarEhDelicado(CALENDARIO.divulgacao)).toBe(true)
    expect(republicarEhDelicado('2026-11-01')).toBe(true)
  })
})

describe('as bordas exatas', () => {
  it.each([
    ['2026-10-10', 'escondido'],
    ['2026-10-11', 'escondido'],
    ['2026-10-13', 'escondido'],
    ['2026-10-14', 'visível'],
    ['2026-10-15', 'visível'],
  ])('com 3 publicadas, em %s o pódio está %s', (dia, esperado) => {
    expect(podioVisivel(3, dia) ? 'visível' : 'escondido').toBe(esperado)
  })
})
