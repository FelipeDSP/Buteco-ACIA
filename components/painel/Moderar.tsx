'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Ocultar e corrigir o que um cliente escreveu.
 *
 * Fica recolhido atrás de um link discreto: a aba existe para a ACIA **ler** a
 * devolutiva, não para moderá-la, e um botão de ocultar em cada linha convida
 * a limpar o que incomoda. Suprimir o que um cliente escreveu tem de custar um
 * clique a mais que lê-lo.
 *
 * O motivo é obrigatório aqui, no route handler e no banco — três lugares,
 * porque a decisão pode ser questionada pela casa e "achei estranho" não se
 * sustenta numa reunião.
 */

type Props =
  | { alvo: 'observacao'; id: string; oculta?: boolean }
  | { alvo: 'garcom'; casaId: string; grafias: string[]; oculta?: boolean }

export default function Moderar(props: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const chamar = async (corpo: Record<string, unknown>) => {
    setEnviando(true)
    setErro(null)
    try {
      const r = await fetch('/api/painel/moderar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...props, ...corpo }),
      })
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { erro?: string }
        setErro(j.erro ?? 'Não deu para gravar.')
        return
      }
      setAberto(false)
      setMotivo('')
      setNome('')
      router.refresh()
    } catch {
      setErro('Falha de rede. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  if (props.oculta) {
    return (
      <button
        type="button"
        disabled={enviando}
        onClick={() => chamar({ acao: 'mostrar' })}
        className="text-[12px] font-bold text-marinho underline underline-offset-2 disabled:opacity-50"
      >
        reexibir
      </button>
    )
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-[12px] text-tinta-3 underline underline-offset-2 hover:text-marinho"
      >
        ocultar{props.alvo === 'garcom' ? ' ou corrigir' : ''}
      </button>
    )
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-xl bg-creme p-3">
      {props.alvo === 'garcom' ? (
        <label className="flex flex-col gap-1 text-[12.5px]">
          <span className="font-bold">
            Corrigir para outro nome{' '}
            <span className="font-normal text-tinta-3">
              — vale para todas as linhas desta casa com esta grafia
            </span>
          </span>
          <span className="flex flex-wrap gap-2">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex.: Junior"
              maxLength={60}
              className="min-w-[14ch] flex-1 rounded-lg border border-risco bg-claro px-2.5 py-1.5 text-[16px]"
            />
            <button
              type="button"
              disabled={enviando || nome.trim().length < 2}
              onClick={() => chamar({ acao: 'corrigir', nome })}
              className="btn btn-pequeno disabled:opacity-50"
            >
              Corrigir
            </button>
          </span>
        </label>
      ) : null}

      <label className="flex flex-col gap-1 text-[12.5px]">
        <span className="font-bold">
          Ou ocultar — <span className="font-normal text-tinta-3">motivo obrigatório</span>
        </span>
        <span className="flex flex-wrap gap-2">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="ex.: conteúdo ofensivo"
            maxLength={300}
            className="min-w-[16ch] flex-1 rounded-lg border border-risco bg-claro px-2.5 py-1.5 text-[16px]"
          />
          <button
            type="button"
            disabled={enviando || motivo.trim().length < 3}
            onClick={() => chamar({ acao: 'ocultar', motivo })}
            className="btn btn-pequeno btn-linha disabled:opacity-50"
          >
            Ocultar
          </button>
        </span>
      </label>

      {erro ? <p className="text-[12.5px] font-semibold text-ambar-e">{erro}</p> : null}

      <p>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-[12px] text-tinta-3 underline underline-offset-2"
        >
          cancelar
        </button>
      </p>
    </div>
  )
}
