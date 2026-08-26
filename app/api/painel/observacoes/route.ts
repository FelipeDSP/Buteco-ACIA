import { type NextRequest } from 'next/server'
import { recusarSemSessao } from '@/lib/painel-auth'
import { auditar } from '@/lib/painel'

export const dynamic = 'force-dynamic'

/** Vírgula e aspas quebram CSV; o Excel brasileiro espera ponto e vírgula. */
const campo = (v: unknown) => {
  const t = v === null || v === undefined ? '' : String(v)
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

const semAcento = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()

/**
 * Exporta as observações em dois modos, e a diferença entre eles é de
 * privacidade, não de formato.
 *
 * **interno** — data, hora, casa e texto. Fica com a ACIA.
 *
 * **estabelecimento** — só o texto, uma observação por linha, **sem data,
 * sem hora e em ordem embaralhada**. Data e hora deixariam o dono cruzar com
 * a comanda e descobrir quem escreveu, ainda mais em noite de pouco
 * movimento. E só tirar o horário não bastaria: a ordem cronológica sozinha
 * já reconstrói a sequência de quem passou pela casa.
 */
export async function GET(pedido: NextRequest) {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const params = pedido.nextUrl.searchParams
  const casaFiltrada = params.get('casa') ?? ''
  const paraCasa = params.get('modo') === 'estabelecimento'

  const linhas = (await auditar())
    .filter((l) => l.comentario && !l.anulada)
    .filter((l) => !casaFiltrada || l.casaSlug === casaFiltrada)

  const quando = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Porto_Velho',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  let csv: string
  let nome: string

  if (paraCasa) {
    // Embaralha para a ordem não virar linha do tempo. Sem `Math.random` em
    // sequência previsível — é troca de Fisher-Yates simples, e basta aqui.
    const textos = linhas.map((l) => l.comentario as string)
    for (let i = textos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[textos[i], textos[j]] = [textos[j], textos[i]]
    }
    csv = ['observacao', ...textos.map(campo)].join('\r\n')
    nome = `observacoes-${casaFiltrada || 'todas'}-para-o-estabelecimento`
  } else {
    const cabecalho = ['data', 'hora', 'casa', 'observacao'].join(';')
    const corpo = linhas.map((l) => {
      const [data, hora] = quando(l.quando).split(', ')
      return [data, hora, l.casa, l.comentario].map(campo).join(';')
    })
    csv = [cabecalho, ...corpo].join('\r\n')
    nome = `observacoes-${casaFiltrada || 'todas'}-interno`
  }

  const data = new Date().toISOString().slice(0, 10)
  // BOM na frente: sem ele o Excel abre os acentos errados.
  return new Response('﻿' + csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${semAcento(nome)}-${data}.csv"`,
    },
  })
}
