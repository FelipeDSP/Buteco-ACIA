import { recusarSemSessao } from '@/lib/painel-auth'
import { CRITERIOS_DA_APURACAO, apurar, auditar } from '@/lib/painel'
import { formatarCpf } from '@/lib/cpf'
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

  const [{ linhas, votos, mediaDeAvaliacoes, piso }, avaliacoes] = await Promise.all([
    apurar(),
    auditar(),
  ])

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

  /**
   * Detalhe por avaliacao, **com o CPF em claro** - decisao da ACIA de
   * 27/08/2026. Vai depois do rodape porque a planilha continua sendo a da
   * apuracao: as colunas de cima sao a conta do regulamento, e este bloco e o
   * lastro dela.
   *
   * Observacao nao entra aqui, e o motivo nao e espaco: os textos deixaram de
   * morar na avaliacao, e traze-los para a mesma linha do CPF refaria por
   * planilha o vinculo que a separacao desfez no banco.
   */
  const detalhe = [
    '',
    'Avaliacoes (detalhe)',
    [
      'data',
      'casa',
      'cpf',
      'apresentacao',
      'sabor',
      'criatividade',
      'atendimento',
      `total_de_0_a_${NOTA_MAXIMA_TOTAL}`,
      'anulada',
    ]
      .map(campo)
      .join(';'),
    ...avaliacoes.map((a) =>
      [
        new Date(a.quando).toLocaleDateString('pt-BR', { timeZone: 'America/Porto_Velho' }),
        a.casa,
        // Antes de 27/08/2026 o CPF nao era guardado. Celula vazia pareceria
        // exportacao truncada; a palavra diz que nao existe numero para por.
        a.cpf ? formatarCpf(a.cpf) : 'nao registrado',
        a.notas.apresentacao,
        a.notas.sabor,
        a.notas.criatividade,
        a.notas.atendimento,
        a.notas.apresentacao + a.notas.sabor + a.notas.criatividade + a.notas.atendimento,
        a.anulada ? 'sim' : 'nao',
      ]
        .map(campo)
        .join(';'),
    ),
  ]

  const data = new Date().toISOString().slice(0, 10)
  // BOM na frente: sem ele o Excel abre os acentos errados.
  const csv = '﻿' + [cabecalho.join(';'), ...corpo, ...rodape, ...detalhe].join('\r\n')

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="apuracao-boteco-acia-${data}.csv"`,
    },
  })
}
