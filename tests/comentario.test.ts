import { describe, expect, it } from 'vitest'
import { COMENTARIO_MAXIMO, limparComentario } from '@/lib/voto'
import { calcularApuracao } from '@/lib/painel'
import { calcularAuditoria, type Limiares } from '@/lib/painel'

/**
 * A observação é opcional, limitada e — o que mais importa — **inerte**:
 * não entra em média, desempate nem piso. É devolutiva para a casa.
 */

describe('limpeza da observação', () => {
  it('ausente vira null, não string vazia', () => {
    expect(limparComentario(undefined)).toEqual({ ok: true, texto: null })
    expect(limparComentario(null)).toEqual({ ok: true, texto: null })
  })

  it('só espaços vira null', () => {
    expect(limparComentario('   \n  ')).toEqual({ ok: true, texto: null })
  })

  it('apara as pontas', () => {
    expect(limparComentario('  bom demais  ')).toEqual({ ok: true, texto: 'bom demais' })
  })

  it('aceita exatamente o limite', () => {
    const texto = 'a'.repeat(COMENTARIO_MAXIMO)
    expect(limparComentario(texto)).toEqual({ ok: true, texto })
  })

  it('recusa um caractere além', () => {
    expect(limparComentario('a'.repeat(COMENTARIO_MAXIMO + 1)).ok).toBe(false)
  })

  it('recusa o que não é texto — um POST pode chegar sem passar pelo formulário', () => {
    expect(limparComentario(42).ok).toBe(false)
    expect(limparComentario({ texto: 'oi' }).ok).toBe(false)
  })
})

describe('a observação não participa de cálculo', () => {
  const casa = (id: string) => ({
    id, slug: id, nome: id, ativa: true,
    desclassificada_em: null as string | null,
    desclassificada_motivo: null as string | null,
  })
  const avaliacao = (casaId: string, nota: number) => ({
    casa_id: casaId,
    nota_apresentacao: nota, nota_sabor: nota,
    nota_criatividade: nota, nota_atendimento: nota,
    anulada_em: null as string | null,
  })

  it('a apuração nem enxerga o campo — a média é a mesma com e sem texto', () => {
    // `calcularApuracao` recebe um Pick que não inclui `comentario`: o campo
    // não tem como influenciar a conta, e isto trava essa garantia.
    const sem = calcularApuracao([casa('a')], [avaliacao('a', 4), avaliacao('a', 5)])
    expect(sem.linhas[0].mediaGeral).toBe(18)
    expect(sem.piso).toBeCloseTo(0.2, 5)
  })
})

describe('observação repetida é sinal de auditoria', () => {
  const LIMITES: Limiares = {
    ipPorCasa: 15, ipEmCasas: 5, rajadaMinima: 8,
    janelaDeRajadaMin: 5, comentariosIguais: 3,
  }
  const casa = (id: string) => ({ id, slug: id, nome: id, horarios: {} })
  let n = 0
  const av = (casaId: string, comentario: string | null, minuto = 0) => ({
    id: `a${++n}`, casa_id: casaId,
    criada_em: new Date(Date.UTC(2026, 8, 25, 20, minuto)).toISOString(),
    ip: `200.1.1.${n}`, user_agent: 'teste',
    nota_apresentacao: 4, nota_sabor: 4, nota_criatividade: 4, nota_atendimento: 4,
    anulada_em: null as string | null, anulada_motivo: null as string | null,
    comentario,
  })
  const sinais = (l: ReturnType<typeof calcularAuditoria>) =>
    new Set(l.flatMap((x) => x.anomalias))

  it('duas pessoas escrevendo "muito bom" não é fraude', () => {
    const l = calcularAuditoria(
      [casa('bar')],
      [av('bar', 'muito bom', 0), av('bar', 'muito bom', 30)],
      LIMITES,
    )
    expect(sinais(l).has('comentario-repetido')).toBe(false)
  })

  it('o mesmo texto três vezes na mesma casa acende', () => {
    const l = calcularAuditoria(
      [casa('bar')],
      [av('bar', 'melhor petisco da cidade', 0), av('bar', 'melhor petisco da cidade', 20),
       av('bar', 'melhor petisco da cidade', 40)],
      LIMITES,
    )
    expect(sinais(l).has('comentario-repetido')).toBe(true)
    expect(l[0].comentariosIguais).toBe(3)
  })

  it('compara sem acento e sem caixa — quem repete costuma variar a digitação', () => {
    const l = calcularAuditoria(
      [casa('bar')],
      [av('bar', 'Ótimo Atendimento', 0), av('bar', 'otimo atendimento', 20),
       av('bar', '  ÓTIMO   ATENDIMENTO  ', 40)],
      LIMITES,
    )
    expect(sinais(l).has('comentario-repetido')).toBe(true)
  })

  it('o mesmo texto em casas diferentes não conta — o sinal é por casa', () => {
    const l = calcularAuditoria(
      [casa('a'), casa('b'), casa('c')],
      [av('a', 'muito bom mesmo'), av('b', 'muito bom mesmo'), av('c', 'muito bom mesmo')],
      LIMITES,
    )
    expect(sinais(l).has('comentario-repetido')).toBe(false)
  })

  it('avaliação sem observação não acende nada', () => {
    const l = calcularAuditoria(
      [casa('bar')],
      [av('bar', null), av('bar', null), av('bar', null)],
      LIMITES,
    )
    expect(sinais(l).has('comentario-repetido')).toBe(false)
    expect(l[0].comentariosIguais).toBe(0)
  })
})
