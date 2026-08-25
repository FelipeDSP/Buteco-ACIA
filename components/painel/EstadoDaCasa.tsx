'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Os dois estados que tiram uma casa do site, que são coisas diferentes:
 *
 * **Inativa** é visibilidade. Some do site, o QR para de aceitar voto, e
 * reativar não tem consequência nenhuma. Serve para casa em cadastro, ou que
 * pediu para sair.
 *
 * **Desclassificada** é o Art. 22: ato da Comissão Organizadora por fraude
 * comprovada. Sai do ranking, fica registrada com data e motivo, e as
 * avaliações permanecem no banco como lastro da decisão — a casa pode
 * contestar, e aí é preciso mostrar o que a motivou.
 *
 * Misturar as duas apagaria a diferença entre "não quis participar" e "foi
 * desclassificada por fraude", que é uma diferença séria de dizer sobre um
 * negócio da cidade.
 */

export default function EstadoDaCasa({
  id,
  nome,
  ativa,
  desclassificada,
  desclassificadaMotivo,
  avaliacoes,
}: {
  id: string
  nome: string
  ativa: boolean
  desclassificada: boolean
  desclassificadaMotivo: string | null
  avaliacoes: number
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState<'nenhum' | 'desativar' | 'desclassificar'>('nenhum')
  const [motivo, setMotivo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function chamar(rota: string, corpo: Record<string, unknown>, metodo = 'POST') {
    setOcupado(true)
    setErro(null)
    const resposta = await fetch(rota, {
      method: metodo,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    const dados = await resposta.json().catch(() => ({}))
    setOcupado(false)
    if (!resposta.ok) {
      setErro(dados?.erro ?? 'Não deu para concluir.')
      return
    }
    setAberto('nenhum')
    setMotivo('')
    router.refresh()
  }

  if (desclassificada) {
    return (
      <span className="flex flex-col items-end gap-1">
        <span className="max-w-[260px] text-right text-[12px] text-tinta-3" title={desclassificadaMotivo ?? undefined}>
          {desclassificadaMotivo?.slice(0, 60) ?? 'sem motivo registrado'}
        </span>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => chamar('/api/painel/desclassificar', { id, reverter: true })}
          className="text-[12.5px] font-bold text-marinho underline underline-offset-2 disabled:opacity-50"
        >
          reverter desclassificação
        </button>
      </span>
    )
  }

  if (aberto === 'desclassificar') {
    return (
      <span className="flex flex-col items-end gap-1.5">
        <span className="max-w-[300px] text-right text-[12px] text-ambar-e">
          Art. 22 — fraude comprovada. {nome} sai do ranking e do site, e a decisão fica
          registrada com data e motivo.{' '}
          {avaliacoes > 0 ? `As ${avaliacoes} avaliações permanecem no banco.` : ''}
        </span>
        <textarea
          autoFocus
          rows={2}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="O que foi comprovado, e como"
          className="w-[280px] rounded-lg bg-creme px-3 py-1.5 text-[13px]"
        />
        {erro ? <span className="max-w-[280px] text-right text-[12px] font-semibold text-ambar-e">{erro}</span> : null}
        <span className="flex gap-2">
          <button
            type="button"
            disabled={ocupado}
            onClick={() => chamar('/api/painel/desclassificar', { id, motivo })}
            className="rounded-full bg-marinho px-3 py-1 text-[12.5px] font-bold text-branco disabled:opacity-50"
          >
            {ocupado ? '…' : 'Desclassificar'}
          </button>
          <button
            type="button"
            onClick={() => setAberto('nenhum')}
            className="text-[12.5px] font-semibold text-tinta-3"
          >
            cancelar
          </button>
        </span>
      </span>
    )
  }

  if (aberto === 'desativar') {
    return (
      <span className="flex flex-col items-end gap-1.5">
        <span className="max-w-[280px] text-right text-[12px] text-tinta-3">
          {nome} sai do site e o QR para de aceitar voto. Reversível, sem registro.{' '}
          {avaliacoes > 0 ? (
            <b className="text-ambar-e">As {avaliacoes} avaliações continuam na apuração.</b>
          ) : null}
        </span>
        <span className="flex gap-2">
          <button
            type="button"
            disabled={ocupado}
            onClick={() => chamar('/api/painel/casa', { id }, 'DELETE')}
            className="rounded-full bg-marinho px-3 py-1 text-[12.5px] font-bold text-branco disabled:opacity-50"
          >
            {ocupado ? '…' : 'Desativar'}
          </button>
          <button
            type="button"
            onClick={() => setAberto('nenhum')}
            className="text-[12.5px] font-semibold text-tinta-3"
          >
            cancelar
          </button>
        </span>
      </span>
    )
  }

  return (
    <span className="flex flex-wrap justify-end gap-1.5">
      {ativa ? (
        <button
          type="button"
          onClick={() => setAberto('desativar')}
          className="rounded-full bg-creme px-3 py-1 text-[12.5px] font-bold text-tinta-3 hover:bg-risco"
        >
          Desativar
        </button>
      ) : (
        <button
          type="button"
          disabled={ocupado}
          onClick={() => chamar('/api/painel/casa', { id, ativa: true })}
          className="rounded-full bg-creme px-3 py-1 text-[12.5px] font-bold text-tinta-3 hover:bg-risco disabled:opacity-50"
        >
          {ocupado ? '…' : 'Reativar'}
        </button>
      )}
      <button
        type="button"
        onClick={() => setAberto('desclassificar')}
        title="Art. 22 — fraude comprovada. Registra data e motivo."
        className="rounded-full bg-ambar/25 px-3 py-1 text-[12.5px] font-bold text-ambar-e hover:bg-ambar/40"
      >
        Desclassificar
      </button>
    </span>
  )
}
