import { NextResponse, type NextRequest } from 'next/server'
import { recusarSemSessao } from '@/lib/painel-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * Art. 22º — "O estabelecimento que for comprovadamente beneficiado por fraude
 * na votação será desclassificado, sem direito a ressarcimento da taxa."
 *
 * Desclassificar é diferente de desativar. Desativar é visibilidade e se
 * desfaz sem consequência; desclassificar é ato da Comissão Organizadora, tira
 * a casa do ranking e do site, e **fica registrado com data e motivo** porque
 * a casa afetada pode contestar.
 *
 * As avaliações dela continuam no banco. São o lastro da decisão: sem elas não
 * há como mostrar depois o que motivou a desclassificação.
 */
export async function POST(pedido: NextRequest) {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const { id, motivo, reverter } = (await pedido.json().catch(() => ({}))) as {
    id?: string
    motivo?: string
    reverter?: boolean
  }

  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ erro: 'Casa não informada.' }, { status: 400 })
  }

  const banco = supabaseAdmin()

  if (reverter === true) {
    const { error } = await banco
      .from('casas')
      .update({
        desclassificada_em: null,
        desclassificada_motivo: null,
        atualizada_em: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // O banco também exige (check constraint), mas errar aqui dá mensagem legível.
  if (typeof motivo !== 'string' || motivo.trim().length < 10) {
    return NextResponse.json(
      {
        erro: 'Descreva o que foi comprovado. O Art. 22 fala em fraude comprovada, e a casa pode contestar a decisão.',
      },
      { status: 400 },
    )
  }

  const { error } = await banco
    .from('casas')
    .update({
      desclassificada_em: new Date().toISOString(),
      desclassificada_motivo: motivo.trim().slice(0, 600),
      atualizada_em: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
