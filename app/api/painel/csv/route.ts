import { recusarSemSessao } from '@/lib/painel-auth'
import { CRITERIOS_DA_APURACAO, apurar } from '@/lib/painel'
import { NOTA_MAXIMA_POR_CRITERIO, NOTA_MAXIMA_TOTAL } from '@/data/edicao'

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

  const { linhas, votos, mediaDeAvaliacoes, piso } = await apurar()

  const cabecalho = [
    'posicao',
    'casa',
    'slug',
    'ativa',
    'elegivel',
    'avaliacoes_validas',
    'avaliacoes_anuladas',
    `nota_final_de_0_a_${NOTA_MAXIMA_TOTAL}`,
    ...CRITERIOS_DA_APURACAO.map((c) => `media_${c.chave}_de_0_a_${NOTA_MAXIMA_POR_CRITERIO}`),
  ]

  const corpo = linhas.map((l) =>
    [
      l.posicao === 0 ? '' : l.posicao,
      l.nome,
      l.slug,
      l.ativa ? 'sim' : 'nao',
      l.elegivel ? 'sim' : 'nao',
      l.avaliacoes,
      l.anuladas,
      numero(l.mediaGeral),
      ...CRITERIOS_DA_APURACAO.map((c) => numero(l.medias[c.chave])),
    ]
      .map(campo)
      .join(';'),
  )

  /**
   * Rodapé com a conta do piso (Art. 18º). Quem abrir a planilha depois precisa
   * conseguir refazer o número e entender por que uma casa ficou sem posição —
   * sem isso, "elegivel: nao" vira uma decisão sem explicação.
   */
  const rodape = [
    '',
    `Regra;Art. 17 - nota final = soma das notas / numero de avaliacoes (0 a ${NOTA_MAXIMA_TOTAL})`,
    `Avaliacoes validas no festival;${votos}`,
    `Media de avaliacoes por estabelecimento;${numero(mediaDeAvaliacoes)}`,
    `Piso minimo para concorrer (Art. 18, 10%);${numero(piso)}`,
  ].map((l) => l.split(';').map(campo).join(';'))

  const data = new Date().toISOString().slice(0, 10)
  // BOM na frente: sem ele o Excel abre os acentos errados.
  const csv = '﻿' + [cabecalho.join(';'), ...corpo, ...rodape].join('\r\n')

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="apuracao-boteco-acia-${data}.csv"`,
    },
  })
}
