import { NextResponse, type NextRequest } from 'next/server'
import { recusarSemSessao } from '@/lib/painel-auth'
import { apurar } from '@/lib/painel'
import {
  EDICAO_ATUAL,
  podePublicar,
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

  const { confirmar, confirmarRepublicacao, publicadoPor } = (await pedido
    .json()
    .catch(() => ({}))) as {
    confirmar?: boolean
    confirmarRepublicacao?: boolean
    publicadoPor?: string
  }

  // Art. 20: a apuração é de 11 a 13 de outubro. Antes disso não há o que
  // congelar — o festival ainda está recebendo voto.
  if (!podePublicar()) {
    return NextResponse.json(
      {
        erro: `A apuração começa em ${dataLonga(CALENDARIO.inicioApuracao)}. Antes disso o festival ainda está recebendo votos e não há resultado para congelar.`,
      },
      { status: 409 },
    )
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

  const { linhas } = await apurar()

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
  const podio = linhas.filter((l) => l.elegivel && l.posicao >= 1).sort((a, b) => a.posicao - b.posicao)

  if (podio.length === 0) {
    return NextResponse.json(
      {
        erro: 'Nenhuma casa elegível para o pódio. Confira o piso mínimo do Art. 18 na tela de apuração.',
      },
      { status: 409 },
    )
  }

  const lugares: LugarParaPublicar[] = podio.map((l) => ({
    posicao: l.posicao,
    casaId: l.id,
    notaFinal: Number((l.mediaGeral ?? 0).toFixed(3)),
    totalAvaliacoes: l.avaliacoes,
  }))

  try {
    await publicarPodio(lugares, (publicadoPor ?? '').trim(), EDICAO_ATUAL)
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : 'Falha ao publicar.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, publicadas: lugares.length })
}
