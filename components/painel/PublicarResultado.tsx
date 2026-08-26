'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Publicação do pódio. É a ação mais séria do painel: congela o resultado que
 * vai para a premiação, para a imprensa e para o certificado das casas.
 *
 * Por isso a confirmação mostra **exatamente quem vai ser gravado**, com nota
 * e volume. Confirmar às cegas seria pedir para publicar o pódio errado.
 */

export type Candidata = {
  posicao: number
  nome: string
  notaFinal: string
  avaliacoes: number
}

export default function PublicarResultado({
  candidatas,
  liberado,
  motivoBloqueio,
  jaPublicado,
  publicadoEm,
  exigeConfirmacaoExtra,
}: {
  candidatas: Candidata[]
  liberado: boolean
  motivoBloqueio: string
  jaPublicado: boolean
  publicadoEm: string | null
  /** Depois da divulgação, republicar mexe no que o público já viu. */
  exigeConfirmacaoExtra: boolean
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [quem, setQuem] = useState('')
  const [cienteDaRepublicacao, setCiente] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function publicar() {
    setOcupado(true)
    setErro(null)
    const resposta = await fetch('/api/painel/publicar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirmar: true,
        confirmarRepublicacao: cienteDaRepublicacao,
        publicadoPor: quem,
      }),
    })
    const dados = await resposta.json().catch(() => ({}))
    setOcupado(false)
    if (!resposta.ok) {
      setErro(dados?.erro ?? 'Não deu para publicar.')
      return
    }
    setAberto(false)
    setCiente(false)
    router.refresh()
  }

  if (!liberado) {
    return (
      <span
        title={motivoBloqueio}
        className="inline-block cursor-help rounded-full bg-creme px-4 py-2 text-[13.5px] font-bold text-tinta-3"
      >
        Publicar resultado · bloqueado
      </span>
    )
  }

  if (!aberto) {
    return (
      <span className="flex flex-col items-end gap-1">
        <button type="button" onClick={() => setAberto(true)} className="btn btn-pequeno">
          {jaPublicado ? 'Republicar resultado' : 'Publicar resultado oficial'}
        </button>
        {publicadoEm ? (
          <span className="text-[12px] text-tinta-3">Publicado em {publicadoEm}</span>
        ) : null}
      </span>
    )
  }

  return (
    <div className="w-full rounded-2xl bg-claro p-5 larga:max-w-[440px]">
      <b className="display block text-[17px]">
        {jaPublicado ? 'Republicar o pódio' : 'Publicar o pódio oficial'}
      </b>

      <p className="mt-2 text-[13.5px] text-tinta-3">
        Isto <b className="text-tinta">congela</b> o resultado. A partir daqui, anular uma
        avaliação ou desclassificar uma casa <b className="text-tinta">não muda</b> o que foi
        publicado — o pódio vira um retrato, não uma conta ao vivo.
      </p>

      <ol className="mt-4 flex flex-col gap-1.5">
        {candidatas.map((c) => (
          <li
            key={c.posicao}
            className="flex items-baseline justify-between gap-3 rounded-xl bg-creme px-3.5 py-2"
          >
            <span className="font-display text-[14px] font-extrabold">
              {c.posicao}º {c.nome}
            </span>
            <span className="text-[13px] text-tinta-3">
              {c.notaFinal} · {c.avaliacoes} aval.
            </span>
          </li>
        ))}
      </ol>

      <label className="mt-4 block">
        <span className="text-[13px] font-bold">Quem está publicando</span>
        <input
          value={quem}
          onChange={(e) => setQuem(e.target.value)}
          placeholder="Nome de quem assina a publicação"
          className="mt-1 w-full rounded-xl bg-creme px-3.5 py-2 text-[14px]"
        />
        <span className="mt-1 block text-[12px] text-tinta-3">
          Fica registrado junto do resultado. O painel tem senha única e não sabe quem está
          do outro lado.
        </span>
      </label>

      {exigeConfirmacaoExtra ? (
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-ambar/20 px-3.5 py-3 text-[13px] text-ambar-e">
          <input
            type="checkbox"
            checked={cienteDaRepublicacao}
            onChange={(e) => setCiente(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-marinho)]"
          />
          <span>
            O resultado <b>já é público</b>. Entendo que republicar altera o que as casas e a
            imprensa já viram, e pode tirar o título de quem já comemorou.
          </span>
        </label>
      ) : null}

      {erro ? (
        <p aria-live="assertive" className="mt-3 text-[13px] font-semibold text-ambar-e">
          {erro}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={ocupado} onClick={publicar} className="btn btn-pequeno">
          {ocupado ? 'Publicando…' : jaPublicado ? 'Republicar' : 'Publicar'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-[13px] font-semibold text-tinta-3"
        >
          cancelar
        </button>
      </div>
    </div>
  )
}
