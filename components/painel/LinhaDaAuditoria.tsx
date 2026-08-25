'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Anomalia } from '@/lib/painel'

/**
 * Uma linha da auditoria, com o botão de anular.
 *
 * Anular pede motivo obrigatório: a decisão fica registrada no banco e pode
 * ser questionada depois pela casa afetada. "Anulei porque achei estranho" não
 * se sustenta numa reunião; o campo existe para obrigar a escrever o porquê.
 */

const ETIQUETA: Record<Anomalia, string> = {
  'ip-repetido': 'IP repetido',
  'ip-em-varias-casas': 'IP em várias casas',
  rajada: 'Rajada',
  'fora-de-horario': 'Fora de horário',
}

export type Props = {
  id: string
  quando: string
  casa: string
  ip: string | null
  notas: Record<string, number>
  anulada: boolean
  motivo: string | null
  anomalias: Anomalia[]
  doIpNaCasa: number
  casasDoIp: number
}

export default function LinhaDaAuditoria({ linha }: { linha: Props }) {
  const router = useRouter()
  const [abrindo, setAbrindo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function chamar(corpo: Record<string, unknown>) {
    setOcupado(true)
    setErro(null)
    const resposta = await fetch('/api/painel/anular', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    const dados = await resposta.json().catch(() => ({}))
    setOcupado(false)
    if (!resposta.ok) {
      setErro(dados?.erro ?? 'Não deu para concluir.')
      return
    }
    setAbrindo(false)
    setMotivo('')
    router.refresh()
  }

  const quando = new Date(linha.quando).toLocaleString('pt-BR', {
    timeZone: 'America/Porto_Velho',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <tr className={`border-b border-risco ${linha.anulada ? 'opacity-55' : ''}`}>
      <td className="py-3 pr-3 whitespace-nowrap text-tinta-3">{quando}</td>
      <td className="py-3 pr-3 font-semibold">{linha.casa}</td>
      <td className="py-3 pr-3 font-mono text-[13px] text-tinta-3">{linha.ip ?? '—'}</td>
      <td className="py-3 pr-3 font-mono text-[13px] whitespace-nowrap">
        {linha.notas.apresentacao}·{linha.notas.sabor}·{linha.notas.criatividade}·
        {linha.notas.atendimento}
      </td>
      <td className="py-3 pr-3">
        <span className="flex flex-wrap gap-1">
          {linha.anomalias.map((a) => {
            // O número que disparou o sinal fica no selo: sem ele, quem lê não
            // sabe se foram 15 avaliações ou 300, e o selo diz a mesma coisa.
            const quantos =
              a === 'ip-repetido'
                ? linha.doIpNaCasa
                : a === 'ip-em-varias-casas'
                  ? linha.casasDoIp
                  : null
            return (
              <span
                key={a}
                title="Ver a legenda acima da tabela: sinal é pista, não prova."
                className="cursor-help rounded-full bg-ambar/25 px-2.5 py-0.5 text-[11.5px] font-bold text-ambar-e"
              >
                {ETIQUETA[a]}
                {quantos !== null ? ` · ${quantos}` : ''}
              </span>
            )
          })}
        </span>
      </td>
      <td className="py-3 text-right">
        {linha.anulada ? (
          <span className="flex flex-col items-end gap-1">
            <span
              className="text-[12.5px] text-tinta-3"
              title={linha.motivo ?? undefined}
            >
              anulada: {linha.motivo?.slice(0, 40) ?? '—'}
            </span>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => chamar({ id: linha.id, desfazer: true })}
              className="text-[12.5px] font-bold text-marinho underline underline-offset-2 disabled:opacity-50"
            >
              restaurar
            </button>
          </span>
        ) : abrindo ? (
          <span className="flex flex-col items-end gap-1.5">
            <input
              autoFocus
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo da anulação"
              className="w-[210px] rounded-lg bg-creme px-3 py-1.5 text-[13px]"
            />
            {erro ? <span className="text-[12px] font-semibold text-ambar-e">{erro}</span> : null}
            <span className="flex gap-2">
              <button
                type="button"
                disabled={ocupado}
                onClick={() => chamar({ id: linha.id, motivo })}
                className="rounded-full bg-marinho px-3 py-1 text-[12.5px] font-bold text-branco disabled:opacity-50"
              >
                {ocupado ? '…' : 'Anular'}
              </button>
              <button
                type="button"
                onClick={() => setAbrindo(false)}
                className="text-[12.5px] font-semibold text-tinta-3"
              >
                cancelar
              </button>
            </span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setAbrindo(true)}
            className="rounded-full bg-creme px-3 py-1 text-[12.5px] font-bold text-tinta-3 hover:bg-risco"
          >
            Anular
          </button>
        )}
      </td>
    </tr>
  )
}
