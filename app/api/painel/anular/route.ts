import { NextResponse, type NextRequest } from 'next/server'
import { recusarSemSessao } from '@/lib/painel-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * Anular não apaga: preenche `anulada_em` e `anulada_motivo`. A avaliação sai
 * de toda média e continua no banco como lastro — se a decisão for contestada,
 * o voto e o motivo estão lá.
 */
export async function POST(pedido: NextRequest) {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const { id, motivo, desfazer } = (await pedido.json().catch(() => ({}))) as {
    id?: string
    motivo?: string
    desfazer?: boolean
  }

  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ erro: 'Avaliação não informada.' }, { status: 400 })
  }

  if (desfazer === true) {
    const { error } = await supabaseAdmin()
      .from('avaliacoes')
      .update({ anulada_em: null, anulada_motivo: null })
      .eq('id', id)
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (typeof motivo !== 'string' || motivo.trim().length < 3) {
    return NextResponse.json(
      { erro: 'Escreva o motivo da anulação — ele fica registrado.' },
      { status: 400 },
    )
  }

  const { error } = await supabaseAdmin()
    .from('avaliacoes')
    .update({ anulada_em: new Date().toISOString(), anulada_motivo: motivo.trim().slice(0, 400) })
    .eq('id', id)

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
