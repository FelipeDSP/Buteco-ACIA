import { NextResponse, type NextRequest } from 'next/server'
import { recusarSemSessao } from '@/lib/painel-auth'
import { apurar } from '@/lib/painel'
import {
  EDICAO_ATUAL,
  publicarPodio,
  republicarEhDelicado,
  type LugarParaPublicar,
} from '@/lib/resultado'
import { CALENDARIO } from '@/data/edicao'
import { dataLonga } from '@/lib/formato'

export const dynamic = 'force-dynamic'

/**
 * Publica o pódio: congela as três primeiras num retrato que não muda mais.
 *
 * O cálculo é refeito **aqui, no servidor**, e não recebido do cliente. Se
 * viesse do formulário, quem chamasse a API direto escolheria o campeão.
 */
export async function POST(pedido: NextRequest) {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const { confirmar, confirmarRepublicacao, publicadoPor, visivel } = (await pedido
    .json()
    .catch(() => ({}))) as {
    confirmar?: boolean
    confirmarRepublicacao?: boolean
    publicadoPor?: string
    /** Liberar no site agora, sem esperar a data de divulgação. */
    visivel?: boolean
  }

  if (confirmar !== true) {
    return NextResponse.json({ erro: 'Confirmação ausente.' }, { status: 400 })
  }

  /**
   * Depois da divulgação o público já viu o pódio. Republicar aí não é
   * corrigir um rascunho: é mudar o que foi anunciado na premiação, e pode
   * chegar a tirar o título de quem já comemorou. Exige um segundo aceite.
   */
  if (republicarEhDelicado() && confirmarRepublicacao !== true) {
    return NextResponse.json(
      {
        erro: `O resultado já é público desde ${dataLonga(CALENDARIO.divulgacao)}. Republicar altera o que as casas e a imprensa já viram — marque a confirmação extra se for mesmo isso.`,
      },
      { status: 409 },
    )
  }

  const { linhas, piso } = await apurar()

  /**
   * Congela o ranking **inteiro**, não só o pódio.
   *
   * A página pública mostra as três primeiras em destaque e as demais numa
   * lista abaixo. Se as posições 4+ fossem calculadas ao vivo, a página teria
   * topo congelado e cauda móvel — anular um voto depois da premiação mexeria
   * na 4ª e não na 3ª, e uma casa poderia aparecer em 4º com nota maior que a
   * do 3º lugar.
   *
   * Só elegíveis: o piso do Art. 18 e a desclassificação do Art. 22 já foram
   * aplicados na apuração, e `posicao` só existe para quem concorre.
   */
  /**
   * Desclassificada (Art. 22) fica fora do retrato: foi excluída da competição,
   * não é participante que ficou mal colocada.
   */
  const participantes = linhas.filter((l) => !l.desclassificada)

  const elegiveis = participantes
    .filter((l) => l.elegivel && l.posicao >= 1)
    .sort((a, b) => a.posicao - b.posicao)

  if (elegiveis.length === 0) {
    return NextResponse.json(
      {
        erro: 'Nenhuma casa elegível para o ranking. Confira o piso mínimo do Art. 18 na tela de apuração.',
      },
      { status: 409 },
    )
  }

  /**
   * Inelegível entra no retrato com `posicao = 0`.
   *
   * Art. 18: quem não alcança o piso não entra no ranking — mas continua sendo
   * participante, e o Art. 23 lhe garante prato de parede e certificado.
   * Gravar com posição sequencial diria que ficou em último, que é diferente
   * de não ter concorrido; deixar de fora apagaria a participação.
   */
  const inelegiveis = participantes.filter((l) => !l.elegivel)

  const lugares: LugarParaPublicar[] = [
    ...elegiveis.map((l) => ({
      posicao: l.posicao,
      elegivel: true,
      casaId: l.id,
      notaFinal: Number((l.mediaGeral ?? 0).toFixed(3)),
      totalAvaliacoes: l.avaliacoes,
    })),
    ...inelegiveis.map((l) => ({
      posicao: 0,
      elegivel: false,
      casaId: l.id,
      notaFinal: Number((l.mediaGeral ?? 0).toFixed(3)),
      totalAvaliacoes: l.avaliacoes,
    })),
  ]

  try {
    await publicarPodio(lugares, (publicadoPor ?? '').trim(), visivel === true, EDICAO_ATUAL)
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : 'Falha ao publicar.' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    publicadas: lugares.length,
    noRanking: elegiveis.length,
    foraDoRanking: inelegiveis.length,
    piso: Number(piso.toFixed(2)),
    visivel: visivel === true,
  })
}
