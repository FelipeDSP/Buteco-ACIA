import { describe, expect, it } from 'vitest'
import { COMENTARIO_MAXIMO, limparComentario } from '@/lib/voto'
import { calcularApuracao } from '@/lib/painel'
import { calcularAuditoria, calcularObservacoes, type Limiares } from '@/lib/painel'

/**
 * A observação é opcional, limitada e — o que mais importa — **inerte**:
 * não entra em média, desempate nem piso. É devolutiva para a casa.
 *
 * Desde 27/08/2026 ela também é **desvinculada**: mora em tabela própria, sem
 * `avaliacao_id`, sem `cpf_hash`, sem `ip` e com data sem hora. O que estes
 * testes seguram não é a tela — é o desvínculo. Com o CPF em claro na
 * auditoria, qualquer campo que sobrevivesse ligando texto a avaliação (uma
 * coluna de comentário na linha, um horário para alinhar as duas abas, a ordem
 * cronológica da lista) devolveria a ligação entre pessoa e comentário.
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


const LIMITES: Limiares = {
  ipPorCasa: 15,
  ipEmCasas: 5,
  rajadaMinima: 8,
  janelaDeRajadaMin: 5,
  comentariosIguais: 3,
}

const daCasa = (id: string) => ({
  id,
  slug: id,
  nome: id,
  prato: `Prato do ${id}`,
  prato_confirmado: true,
  foto_url: null,
  ativa: true,
})

let sequencia = 0
const obs = (casaId: string, texto: string, dia = '2026-09-25') => ({
  id: `o${++sequencia}`,
  casa_id: casaId,
  texto,
  criada_em: dia,
})

const itens = (r: ReturnType<typeof calcularObservacoes>) => r.flatMap((c) => c.itens)
const acendeu = (r: ReturnType<typeof calcularObservacoes>) => r.some((c) => c.repetidas > 0)

/** Fisher-Yates com sorteio fixo: embaralha de verdade, e sem aleatoriedade. */
const semSorte = () => 0

describe('a observação é desvinculada da avaliação, não só escondida dela', () => {
  it('a linha da auditoria não carrega texto de observação nenhum', () => {
    // A garantia central da separação: com CPF em claro na auditoria, um campo
    // de texto na mesma linha ligaria comentário a pessoa numa tela só.
    const linhas = calcularAuditoria(
      [{ id: 'bar', slug: 'bar', nome: 'bar', horarios: {} }],
      [
        {
          id: 'a1',
          casa_id: 'bar',
          criada_em: '2026-09-25T23:00:00.000Z',
          ip: '200.1.1.1',
          user_agent: 'teste',
          nota_apresentacao: 4,
          nota_sabor: 4,
          nota_criatividade: 4,
          nota_atendimento: 4,
          anulada_em: null,
          anulada_motivo: null,
          cpf: '11144477735',
        },
      ],
      LIMITES,
    )

    expect(linhas[0]).not.toHaveProperty('comentario')
    expect(linhas[0]).not.toHaveProperty('comentariosIguais')
    expect(linhas[0].cpf).toBe('11144477735')
  })

  it('a observação não carrega CPF, IP nem hora', () => {
    // Sem hora não há como alinhar esta aba com a auditoria por horário — que
    // é por onde o vínculo voltaria mesmo sem coluna nenhuma ligando as duas.
    const [item] = itens(calcularObservacoes([daCasa('bar')], [obs('bar', 'ótimo')], LIMITES))

    expect(Object.keys(item).sort()).toEqual(['dia', 'id', 'iguais', 'repetida', 'texto'])
    expect(item.dia).toBe('2026-09-25')
    expect(item.dia).not.toMatch(/[T:]/)
  })

  it('a listagem não sai em ordem de chegada', () => {
    const entrada = [obs('bar', 'um'), obs('bar', 'dois'), obs('bar', 'tres')]
    const saida = itens(calcularObservacoes([daCasa('bar')], entrada, LIMITES, semSorte))

    expect([...saida.map((i) => i.texto)].sort()).toEqual(['dois', 'tres', 'um'])
    expect(saida.map((i) => i.texto)).not.toEqual(['um', 'dois', 'tres'])
  })

  it('agrupa por casa e nomeia pelo prato', () => {
    const r = calcularObservacoes(
      [daCasa('a'), daCasa('b')],
      [obs('a', 'boa'), obs('a', 'muito boa'), obs('b', 'gostei')],
      LIMITES,
    )

    expect(r.map((c) => [c.prato, c.total])).toEqual([
      ['Prato do a', 2],
      ['Prato do b', 1],
    ])
  })

  it('casa sem observação continua na grade, com o número zerado', () => {
    // Sumir é pior: casa ausente da grade é lida como carregamento que falhou,
    // e a ACIA fica sem saber se a casa não recebeu nada ou se faltou dado.
    const r = calcularObservacoes([daCasa('a'), daCasa('b')], [obs('a', 'boa')], LIMITES)

    expect(r.map((c) => [c.id, c.total])).toEqual([
      ['a', 1],
      ['b', 0],
    ])
    expect(r[1].itens).toEqual([])
  })

  it('ordena da casa com mais observações para a com menos', () => {
    const r = calcularObservacoes(
      [daCasa('poucas'), daCasa('nenhuma'), daCasa('muitas')],
      [
        obs('muitas', 'a'),
        obs('muitas', 'b'),
        obs('muitas', 'c'),
        obs('poucas', 'd'),
      ],
      LIMITES,
    )
    expect(r.map((c) => c.id)).toEqual(['muitas', 'poucas', 'nenhuma'])
  })

  it('leva a foto do prato para o cartão da grade', () => {
    const comFoto = { ...daCasa('a'), foto_url: 'https://exemplo/prato.jpg' }
    const r = calcularObservacoes([comFoto, daCasa('b')], [], LIMITES)

    expect(r.find((c) => c.id === 'a')?.foto).toBe('https://exemplo/prato.jpg')
    // Sem foto vai `null`, e o cartão cai no mesmo placeholder do site.
    expect(r.find((c) => c.id === 'b')?.foto).toBeNull()
  })

  it('prato não confirmado não é anunciado pelo painel', () => {
    const r = calcularObservacoes(
      [{ ...daCasa('a'), prato: 'Bolinho secreto', prato_confirmado: false }],
      [obs('a', 'boa')],
      LIMITES,
    )
    expect(r[0].prato).toBe('Prato a confirmar')
  })
})

describe('observação repetida é sinal — agora na aba Observações', () => {
  it('duas pessoas escrevendo "muito bom" não é fraude', () => {
    const r = calcularObservacoes(
      [daCasa('bar')],
      [obs('bar', 'muito bom'), obs('bar', 'muito bom')],
      LIMITES,
    )
    expect(acendeu(r)).toBe(false)
  })

  it('o mesmo texto três vezes na mesma casa acende', () => {
    const r = calcularObservacoes(
      [daCasa('bar')],
      [
        obs('bar', 'melhor petisco da cidade'),
        obs('bar', 'melhor petisco da cidade'),
        obs('bar', 'melhor petisco da cidade'),
      ],
      LIMITES,
    )
    expect(acendeu(r)).toBe(true)
    expect(r[0].repetidas).toBe(3)
    expect(r[0].itens[0].iguais).toBe(3)
  })

  it('compara sem acento e sem caixa — quem repete costuma variar a digitação', () => {
    const r = calcularObservacoes(
      [daCasa('bar')],
      [
        obs('bar', 'Ótimo Atendimento'),
        obs('bar', 'otimo atendimento'),
        obs('bar', '  ÓTIMO   ATENDIMENTO  '),
      ],
      LIMITES,
    )
    expect(acendeu(r)).toBe(true)
  })

  it('o mesmo texto em casas diferentes não conta — o sinal é por casa', () => {
    const r = calcularObservacoes(
      [daCasa('a'), daCasa('b'), daCasa('c')],
      [obs('a', 'muito bom mesmo'), obs('b', 'muito bom mesmo'), obs('c', 'muito bom mesmo')],
      LIMITES,
    )
    expect(acendeu(r)).toBe(false)
  })

  it('subir o limiar apaga o sinal, sem tocar em código', () => {
    const entrada = [obs('bar', 'top'), obs('bar', 'top'), obs('bar', 'top')]
    expect(acendeu(calcularObservacoes([daCasa('bar')], entrada, LIMITES))).toBe(true)
    expect(
      acendeu(calcularObservacoes([daCasa('bar')], entrada, { ...LIMITES, comentariosIguais: 4 })),
    ).toBe(false)
  })
})
