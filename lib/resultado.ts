import 'server-only'
import { cache } from 'react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { EDICAO, CALENDARIO } from '@/data/edicao'
import { hoje, mostrarVencedores } from '@/lib/fase'

/**
 * O pódio publicado — retrato congelado, nunca cálculo ao vivo.
 *
 * A área pública **jamais** deriva ranking de `avaliacoes`: o resultado é
 * fechado até a premiação, e uma consulta ao vivo entregaria a parcial para
 * quem soubesse onde olhar. A página lê daqui, e daqui só sai o que a Comissão
 * publicou.
 */

export type LugarNoPodio = {
  /** Colocação no ranking. `0` para quem não alcançou o piso do Art. 18. */
  posicao: number
  /** Liberado para o site pela Comissão, independente da data. */
  visivel: boolean
  /** Art. 18: concorreu de fato. Falso = participou, mas fora do ranking. */
  elegivel: boolean
  notaFinal: number
  totalAvaliacoes: number
  publicadoEm: string
  casa: {
    slug: string
    nome: string
    prato: string | null
    pratoConfirmado: boolean
    fotoUrl: string | null
  }
}

/** A edição a que o resultado pertence. Texto, para caber "2026" e o que vier. */
export const EDICAO_ATUAL = String(EDICAO.ano)

/**
 * Quando o pódio aparece no site.
 *
 * Duas portas, e basta uma: **a Comissão liberou** (`visivel`), ou **chegou a
 * data de divulgação**. Publicar não implica mostrar — dá para congelar o
 * resultado antes da cerimônia e só abrir na hora, que era a razão da trava
 * de data original.
 *
 * A data continua valendo como automatismo: se ninguém marcar nada, o pódio
 * aparece sozinho no dia previsto, sem depender de alguém lembrar.
 */
export function podioVisivel(
  publicado: { visivel?: boolean }[] | number,
  dia = hoje(),
): boolean {
  // Aceita o número antigo para não quebrar quem só quer saber se há registro.
  if (typeof publicado === 'number') return publicado > 0 && mostrarVencedores(dia)
  if (publicado.length === 0) return false
  return publicado.some((l) => l.visivel === true) || mostrarVencedores(dia)
}

/**
 * Quantas casas ficaram de fora do ranking por não alcançar o piso.
 * O painel mostra isso antes de confirmar a publicação: publicar sem saber
 * quem sai é a forma mais fácil de descobrir tarde que o piso estava errado.
 */
export function contarInelegiveis(lugares: { elegivel: boolean }[]): number {
  return lugares.filter((l) => !l.elegivel).length
}

/**
 * Publicar é livre, a qualquer momento.
 *
 * A trava por data saiu: a Comissão pode remarcar o festival (Art. 30), pode
 * querer ensaiar o resultado antes, e o Art. 20 fala do prazo da **apuração**,
 * não de uma proibição de gravar. O que o regulamento protege é a divulgação,
 * e isso agora é controlado por `visivel`, não pela data de gravação.
 */
export function podePublicar(): boolean {
  return true
}

/**
 * Publicar antes do fim do festival congela um número parcial: ainda entra
 * voto. Não é proibido — é para avisar, não para bloquear.
 */
export function publicacaoEhParcial(dia = hoje()): boolean {
  return dia <= CALENDARIO.fimFestival
}

/** Depois da divulgação, republicar mexe no que o público já viu. */
export function republicarEhDelicado(dia = hoje()): boolean {
  return mostrarVencedores(dia)
}

type LinhaBruta = {
  posicao: number
  elegivel: boolean
  visivel: boolean
  nota_final: string | number
  total_avaliacoes: number
  publicado_em: string
  casas: {
    slug: string
    nome: string
    prato: string | null
    prato_confirmado: boolean
    foto_url: string | null
  } | null
}

/**
 * Lê o pódio com a chave administrativa, e isto é deliberado.
 *
 * A policy de `casas` esconde casa inativa ou desclassificada. Com a chave
 * anônima, desativar uma vencedora depois da premiação faria ela sumir do
 * pódio — exatamente a mudança retroativa que a tabela existe para impedir.
 * A leitura roda em componente de servidor e devolve só os campos do pódio;
 * nada disso chega ao navegador.
 */
export async function lerPodio(edicao = EDICAO_ATUAL): Promise<LugarNoPodio[]> {
  const { data, error } = await supabaseAdmin()
    .from('resultado')
    .select(
      'posicao, elegivel, visivel, nota_final, total_avaliacoes, publicado_em, casas (slug, nome, prato, prato_confirmado, foto_url)',
    )
    .eq('edicao', edicao)
    // Elegíveis primeiro, na ordem do ranking; inelegíveis depois, por nota.
    .order('elegivel', { ascending: false })
    .order('posicao')
    .order('nota_final', { ascending: false })

  if (error) throw new Error(`Falha ao ler o resultado: ${error.message}`)

  return ((data ?? []) as unknown as LinhaBruta[])
    .filter((l) => l.casas !== null)
    .map((l) => ({
      posicao: l.posicao,
      elegivel: l.elegivel,
      visivel: l.visivel,
      notaFinal: Number(l.nota_final),
      totalAvaliacoes: l.total_avaliacoes,
      publicadoEm: l.publicado_em,
      casa: {
        slug: l.casas!.slug,
        nome: l.casas!.nome,
        prato: l.casas!.prato,
        pratoConfirmado: l.casas!.prato_confirmado,
        fotoUrl: l.casas!.foto_url,
      },
    }))
}

export type LugarParaPublicar = {
  posicao: number
  elegivel: boolean
  casaId: string
  notaFinal: number
  totalAvaliacoes: number
}

/**
 * Grava o pódio. Substitui o que houver na edição — republicar é apagar e
 * regravar, para não sobrar posição de uma publicação anterior.
 */
export async function publicarPodio(
  lugares: LugarParaPublicar[],
  publicadoPor: string,
  visivel: boolean,
  edicao = EDICAO_ATUAL,
): Promise<void> {
  const banco = supabaseAdmin()

  const { error: erroAoLimpar } = await banco.from('resultado').delete().eq('edicao', edicao)
  if (erroAoLimpar) throw new Error(`Falha ao limpar o resultado anterior: ${erroAoLimpar.message}`)

  if (lugares.length === 0) return

  const { error } = await banco.from('resultado').insert(
    lugares.map((l) => ({
      edicao,
      posicao: l.posicao,
      elegivel: l.elegivel,
      casa_id: l.casaId,
      nota_final: l.notaFinal,
      total_avaliacoes: l.totalAvaliacoes,
      visivel,
      publicado_por: publicadoPor.slice(0, 200),
    })),
  )
  if (error) throw new Error(`Falha ao publicar o resultado: ${error.message}`)
}

/**
 * O resultado está aparecendo no site?
 *
 * Pergunta que o cabeçalho e a home precisam responder em toda página, então é
 * uma contagem sem corpo (`head: true`) e memorizada por requisição. O que
 * decide é a mesma regra da página de vencedores: liberado pela Comissão, ou
 * data de divulgação alcançada.
 *
 * Sem isto, publicar antes da data punha o pódio no ar sem nenhum link levando
 * até ele — a página existia e ninguém achava.
 */
export const resultadoNoAr = cache(async (edicao = EDICAO_ATUAL): Promise<boolean> => {
  if (mostrarVencedores()) {
    // Chegou a data: basta existir registro.
    const { count } = await supabaseAdmin()
      .from('resultado')
      .select('*', { count: 'exact', head: true })
      .eq('edicao', edicao)
    return (count ?? 0) > 0
  }

  const { count } = await supabaseAdmin()
    .from('resultado')
    .select('*', { count: 'exact', head: true })
    .eq('edicao', edicao)
    .eq('visivel', true)
  return (count ?? 0) > 0
})
