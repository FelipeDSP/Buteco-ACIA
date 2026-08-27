import { recusarSemSessao } from '@/lib/painel-auth'
import { auditar } from '@/lib/painel'
import { formatarCpf } from '@/lib/cpf'

export const dynamic = 'force-dynamic'

/** Vírgula e aspas quebram CSV; o Excel brasileiro espera ponto e vírgula. */
const campo = (v: unknown) => {
  const t = v === null || v === undefined ? '' : String(v)
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

/**
 * CSV da auditoria — uma linha por avaliação, **com o CPF em claro**.
 *
 * Por decisão da ACIA o CPF é dado da organização, e este arquivo é a forma de
 * levá-lo para fora do painel. Duas coisas que ele deliberadamente não tem:
 *
 * - **Observação.** Os textos não moram mais na avaliação, e juntá-los aqui
 *   refaria por planilha o vínculo que a separação desfez no banco.
 * - **Versão para o estabelecimento.** Não existe: o que vai para a casa é o
 *   CSV da aba Observações, só com o texto e embaralhado.
 */
export async function GET() {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const linhas = await auditar()

  const quando = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Porto_Velho',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const cabecalho = [
    'data',
    'hora',
    'casa',
    'cpf',
    'ip',
    'apresentacao',
    'sabor',
    'criatividade',
    'atendimento',
    'total_de_0_a_20',
    'sinais',
    'anulada',
    'anulada_motivo',
  ].join(';')

  const corpo = linhas.map((l) => {
    const [data, hora] = quando(l.quando).split(', ')
    const total =
      l.notas.apresentacao + l.notas.sabor + l.notas.criatividade + l.notas.atendimento

    return [
      data,
      hora,
      l.casa,
      // Avaliação anterior a 27/08/2026 não tem CPF guardado. A planilha diz
      // isso com palavra, não com célula vazia — vazio parece exportação
      // truncada, e alguém tentaria "consertar".
      l.cpf ? formatarCpf(l.cpf) : 'nao registrado',
      l.ip,
      l.notas.apresentacao,
      l.notas.sabor,
      l.notas.criatividade,
      l.notas.atendimento,
      total,
      l.anomalias.join(' | '),
      l.anulada ? 'sim' : 'nao',
      l.motivo,
    ]
      .map(campo)
      .join(';')
  })

  const dia = new Date().toISOString().slice(0, 10)
  // BOM na frente: sem ele o Excel abre os acentos errados.
  const csv = '﻿' + [cabecalho, ...corpo].join('\r\n')

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="auditoria-boteco-acia-${dia}.csv"`,
    },
  })
}
