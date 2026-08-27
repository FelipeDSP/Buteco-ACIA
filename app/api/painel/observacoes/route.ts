import { type NextRequest } from 'next/server'
import { recusarSemSessao } from '@/lib/painel-auth'
import { lerObservacoes } from '@/lib/painel'

export const dynamic = 'force-dynamic'

/** Vírgula e aspas quebram CSV; o Excel brasileiro espera ponto e vírgula. */
const campo = (v: unknown) => {
  const t = v === null || v === undefined ? '' : String(v)
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

const semAcento = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()

/**
 * Exportação das observações de **uma** casa: só o texto, uma por linha, em
 * ordem embaralhada.
 *
 * Não existe mais um segundo modo com data, hora e casa. Antes existia porque
 * a observação era coluna da avaliação e a ACIA precisava do contexto; agora a
 * tabela não guarda hora nenhuma, e a única data que existe é o dia. O arquivo
 * é o mesmo para a ACIA e para o estabelecimento porque não sobrou diferença
 * de privacidade entre os dois — o que havia para proteger foi protegido no
 * banco, não no formato.
 *
 * A ordem embaralhada vem de `lerObservacoes`: ordem cronológica sozinha já
 * reconstrói a sequência de quem passou pela casa, mesmo sem horário na tela.
 */
export async function GET(pedido: NextRequest) {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const slug = pedido.nextUrl.searchParams.get('casa') ?? ''
  const casa = (await lerObservacoes()).find((c) => c.slug === slug)

  if (!casa) {
    return new Response('Casa não encontrada, ou ainda sem observações.', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  const csv = ['observacao', ...casa.itens.map((i) => campo(i.texto))].join('\r\n')
  const dia = new Date().toISOString().slice(0, 10)

  // BOM na frente: sem ele o Excel abre os acentos errados.
  return new Response('﻿' + csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="observacoes-${semAcento(casa.slug)}-${dia}.csv"`,
    },
  })
}
