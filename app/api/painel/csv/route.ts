import { recusarSemSessao } from '@/lib/painel-auth'
import { CRITERIOS_DA_APURACAO, apurar } from '@/lib/painel'

export const dynamic = 'force-dynamic'

/** Vírgula e aspas quebram CSV; o Excel brasileiro ainda espera ponto e vírgula. */
const campo = (v: unknown) => {
  const t = v === null || v === undefined ? '' : String(v)
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

const numero = (v: number | null) => (v === null ? '' : v.toFixed(3).replace('.', ','))

export async function GET() {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const linhas = await apurar()
  const cabecalho = [
    'posicao', 'casa', 'slug', 'ativa', 'avaliacoes_validas', 'avaliacoes_anuladas',
    'media_geral', ...CRITERIOS_DA_APURACAO.map((c) => `media_${c.chave}`),
  ]

  const corpo = linhas.map((l) =>
    [
      l.posicao, l.nome, l.slug, l.ativa ? 'sim' : 'nao', l.avaliacoes, l.anuladas,
      numero(l.mediaGeral), ...CRITERIOS_DA_APURACAO.map((c) => numero(l.medias[c.chave])),
    ]
      .map(campo)
      .join(';'),
  )

  const data = new Date().toISOString().slice(0, 10)
  // BOM na frente: sem ele o Excel abre os acentos errados.
  const csv = '\uFEFF' + [cabecalho.join(';'), ...corpo].join('\r\n')

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="apuracao-boteco-acia-${data}.csv"`,
    },
  })
}
