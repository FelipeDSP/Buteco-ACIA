'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * O interruptor do pódio: um clique mostra, outro oculta.
 *
 * Não passa pela publicação de propósito — mudar de ideia sobre **mostrar**
 * não deve refazer a apuração nem regravar o retrato congelado. O número
 * publicado fica exatamente como estava; só o interruptor se mexe.
 *
 * Ocultar pede confirmação porque tira do ar algo que o público, a imprensa e
 * as casas podem já ter visto. Mostrar não pede: é a ação que a Comissão vai
 * querer fazer rápido, muitas vezes de pé, no meio da cerimônia.
 */
export default function BotaoVisibilidade({
  jaVisivel,
  existePublicacao,
  atrasado,
}: {
  jaVisivel: boolean
  existePublicacao: boolean
  /** A data prevista de divulgação passou e o pódio continua oculto. */
  atrasado: boolean
}) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!existePublicacao) return null

  async function mudar(visivel: boolean) {
    setOcupado(true)
    setErro(null)
    const resposta = await fetch('/api/painel/visibilidade', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visivel }),
    })
    const dados = await resposta.json().catch(() => ({}))
    setOcupado(false)
    setConfirmando(false)
    if (!resposta.ok) {
      setErro(dados?.erro ?? 'Não deu para mudar.')
      return
    }
    router.refresh()
  }

  return (
    <span className="flex flex-col items-end gap-1.5">
      <span className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${
            jaVisivel ? 'bg-ambar text-marinho' : 'bg-creme text-tinta-3'
          }`}
        >
          <span
            aria-hidden
            className={`size-2 rounded-full ${jaVisivel ? 'bg-marinho' : 'bg-tinta-3'}`}
          />
          {jaVisivel ? 'Pódio no ar' : 'Pódio oculto'}
        </span>

        {jaVisivel ? (
          confirmando ? (
            <span className="flex items-center gap-2">
              <button
                type="button"
                disabled={ocupado}
                onClick={() => mudar(false)}
                className="btn btn-pequeno"
              >
                {ocupado ? 'Ocultando…' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="text-[13px] font-semibold text-tinta-3"
              >
                cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="btn btn-pequeno btn-linha"
            >
              Ocultar do site
            </button>
          )
        ) : (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => mudar(true)}
            className="btn btn-pequeno"
          >
            {ocupado ? 'Mostrando…' : 'Mostrar no site'}
          </button>
        )}
      </span>

      {confirmando ? (
        <span className="text-[12px] whitespace-nowrap text-tinta-3">
          Não apaga o resultado — dá para mostrar de novo.
        </span>
      ) : null}

      {/* A data deixou de mandar na visibilidade, então ela avisa. Sem isto,
          trocar a data por um botão criaria um jeito novo de errar: esquecer
          de clicar no dia da premiação. */}
      {atrasado ? (
        <span className="rounded-lg bg-ambar/20 px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap text-ambar-e">
          A data de divulgação já passou e o pódio segue oculto.
        </span>
      ) : null}

      {erro ? (
        <span aria-live="assertive" className="text-[12px] font-semibold text-ambar-e">
          {erro}
        </span>
      ) : null}
    </span>
  )
}
