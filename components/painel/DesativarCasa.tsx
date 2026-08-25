'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * "Remover" casa é sempre `ativa = false`.
 *
 * Nunca DELETE: `avaliacoes.casa_id` aponta para a casa, e apagar levaria os
 * votos junto. Por isso a confirmação diz quantas avaliações estão penduradas
 * — quem clica precisa saber o tamanho do que está mexendo.
 */
export default function DesativarCasa({
  id,
  nome,
  ativa,
  avaliacoes,
}: {
  id: string
  nome: string
  ativa: boolean
  avaliacoes: number
}) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  async function mudar(paraAtiva: boolean) {
    setOcupado(true)
    await fetch('/api/painel/casa', {
      method: paraAtiva ? 'POST' : 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(paraAtiva ? { id, ativa: true } : { id }),
    })
    setOcupado(false)
    setConfirmando(false)
    router.refresh()
  }

  if (!ativa) {
    return (
      <button
        type="button"
        disabled={ocupado}
        onClick={() => mudar(true)}
        className="rounded-full bg-creme px-3 py-1 text-[12.5px] font-bold text-tinta-3 hover:bg-risco disabled:opacity-50"
      >
        {ocupado ? '…' : 'Reativar'}
      </button>
    )
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-full bg-creme px-3 py-1 text-[12.5px] font-bold text-tinta-3 hover:bg-risco"
      >
        Desativar
      </button>
    )
  }

  return (
    <span className="flex flex-col items-end gap-1.5">
      <span className="max-w-[280px] text-right text-[12.5px] text-tinta-3">
        {nome} sai do site e o QR para de aceitar voto.{' '}
        {avaliacoes > 0 ? (
          <b className="text-ambar-e">
            As {avaliacoes} avaliações já registradas continuam no banco e na apuração.
          </b>
        ) : (
          'Nenhuma avaliação registrada até agora.'
        )}
      </span>
      <span className="flex gap-2">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => mudar(false)}
          className="rounded-full bg-marinho px-3 py-1 text-[12.5px] font-bold text-branco disabled:opacity-50"
        >
          {ocupado ? '…' : 'Desativar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="text-[12.5px] font-semibold text-tinta-3"
        >
          cancelar
        </button>
      </span>
    </span>
  )
}
