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
 * **Só a Comissão decide, e a decisão vale nos dois sentidos.** Enquanto
 * `visivel` for falso o pódio não aparece, mesmo depois da data de
 * divulgação; assim que for verdadeiro, aparece, mesmo muito antes dela.
 *
 * A data já mandou aqui, e o efeito era perverso: a partir de 14/10 o pódio
 * era forçado no ar e **não havia mais como ocultá-lo** — nem para corrigir
 * um número errado, nem enquanto uma casa contestava. Quem opera o painel é
 * a própria Comissão, atrás de senha; tirar dela o controle da própria
 * divulgação não protegia ninguém.
 *
 * A data não sumiu: virou aviso. `divulgacaoAtrasada` acende no painel se o
 * dia previsto chegou e o pódio ainda está oculto. Avisa, não decide — é a
 * mesma escolha que o painel já fazia com a publicação parcial.
 */
export function podioVisivel(publicado: { visivel?: boolean }[]): boolean {
  return publicado.some((l) => l.visivel === true)
}

/**
 * A data de divulgação passou e o pódio continua oculto.
 *
 * Não bloqueia nada — existe para o painel avisar em vez de deixar o silêncio
 * acontecer. Sem isto, trocar a data por um interruptor manual criaria um novo
 * jeito de errar: esquecer de clicar no dia da premiação.
 */
export function divulgacaoAtrasada(
  publicado: { visivel?: boolean }[],
  dia = hoje(),
): boolean {
  return publicado.length > 0 && !podioVisivel(publicado) && mostrarVencedores(dia)
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
 * Publicar antes do fim do festival congela um número parcial: ainda entra
 * voto. Não é proibido — é para avisar, não para bloquear.
 */
export function publicacaoEhParcial(dia = hoje()): boolean {
  return dia <= CALENDARIO.fimFestival
}

/**
 * Republicar mexe no que o público **já viu** — e quem sabe isso é o
 * interruptor, não o calendário.
 *
 * Isto já perguntou pela data, e errava nos dois sentidos: depois de 14/10
 * exigia a confirmação "o público já viu" mesmo com o pódio oculto, que
 * ninguém tinha visto; e antes de 14/10 deixava republicar em silêncio um
 * resultado que estava no ar desde setembro.
 */
export function republicarEhDelicado(publicado: { visivel?: boolean }[]): boolean {
  return podioVisivel(publicado)
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
  const { count } = await supabaseAdmin()
    .from('resultado')
    .select('*', { count: 'exact', head: true })
    .eq('edicao', edicao)
    .eq('visivel', true)
  return (count ?? 0) > 0
})

/**
 * Liga e desliga o pódio no site sem tocar em nota nenhuma.
 *
 * Separado de `publicarPodio` de propósito: mostrar e congelar são decisões
 * diferentes. Republicar só para ocultar refaria a apuração e regravaria o
 * retrato — justamente o que a tabela existe para impedir. Aqui só o
 * interruptor se mexe; o número publicado fica exatamente como estava.
 *
 * Devolve quantas linhas mudaram, para o painel saber se havia o que mostrar.
 */
export async function alterarVisibilidade(
  visivel: boolean,
  edicao = EDICAO_ATUAL,
): Promise<number> {
  const { data, error } = await supabaseAdmin()
    .from('resultado')
    .update({ visivel })
    .eq('edicao', edicao)
    .select('posicao')

  if (error) throw new Error(`Falha ao mudar a visibilidade: ${error.message}`)
  return (data ?? []).length
}
