import { type NextRequest } from 'next/server'
import { recusarSemSessao } from '@/lib/painel-auth'
import { lerGarcons } from '@/lib/painel'
import { campoCsv as campo } from '@/lib/csv'

export const dynamic = 'force-dynamic'

const semAcento = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()

/**
 * Exportação das avaliações de atendimento de **uma** casa: por nome, quantas
 * notas e a média. Não saem as notas uma a uma nem data — a sequência de
 * chegada reconstruiria quem passou pela casa, e o arquivo vai para o dono.
 */
export async function GET(pedido: NextRequest) {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const slug = pedido.nextUrl.searchParams.get('casa') ?? ''
  const casa = (await lerGarcons()).find((c) => c.slug === slug)

  if (!casa) {
    return new Response('Casa não encontrada, ou ainda sem avaliações de atendimento.', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  const linhas = casa.garcons.map((g) =>
    [
      campo(g.nome),
      campo(g.grafias.join(' | ')),
      g.avaliacoes,
      // Vírgula decimal: é o Excel em português que vai abrir.
      g.media.toFixed(1).replace('.', ','),
    ].join(';'),
  )
  const csv = ['nome;tambem_escrito;avaliacoes;media', ...linhas].join('\r\n')
  const dia = new Date().toISOString().slice(0, 10)

  // BOM na frente: sem ele o Excel abre os acentos errados.
  return new Response('﻿' + csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="garcons-${semAcento(casa.slug)}-${dia}.csv"`,
    },
  })
}
