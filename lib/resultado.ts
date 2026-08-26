import 'server-only'
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
 * **A data manda sobre a existência do registro.**
 *
 * Publicar cedo é normal: a Comissão apura de 11 a 13 e o resultado só é
 * divulgado no evento de premiação. Entre uma coisa e outra a tabela está
 * preenchida e a página precisa continuar dizendo que não saiu — senão o
 * pódio vaza antes da cerimônia, por uma URL que qualquer um adivinha.
 */
export function podioVisivel(quantosPublicados: number, dia = hoje()): boolean {
  return quantosPublicados > 0 && mostrarVencedores(dia)
}

/**
 * Quantas casas ficaram de fora do ranking por não alcançar o piso.
 * O painel mostra isso antes de confirmar a publicação: publicar sem saber
 * quem sai é a forma mais fácil de descobrir tarde que o piso estava errado.
 */
export function contarInelegiveis(lugares: { elegivel: boolean }[]): number {
  return lugares.filter((l) => !l.elegivel).length
}

/** A partir de quando a Comissão pode publicar (início da apuração, Art. 20). */
export function podePublicar(dia = hoje()): boolean {
  return dia >= CALENDARIO.inicioApuracao
}

/** Depois da divulgação, republicar mexe no que o público já viu. */
export function republicarEhDelicado(dia = hoje()): boolean {
  return mostrarVencedores(dia)
}

type LinhaBruta = {
  posicao: number
  elegivel: boolean
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
      'posicao, elegivel, nota_final, total_avaliacoes, publicado_em, casas (slug, nome, prato, prato_confirmado, foto_url)',
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
      publicado_por: publicadoPor.slice(0, 200),
    })),
  )
  if (error) throw new Error(`Falha ao publicar o resultado: ${error.message}`)
}
