'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cpfValido, formatarCpf, limparCpf } from '@/lib/cpf'
import { COMENTARIO_MAXIMO } from '@/lib/voto'

/**
 * Tela de voto. É a página mais vista do projeto e a que tem prazo real:
 * alguém sentado no bar, com uma mão, à noite, com 4G ruim.
 *
 * Por isso as notas são botões grandes em vez de deslizador, e o CPF vem por
 * último, depois das notas: se a fricção do documento vier antes, a taxa de
 * resposta despenca.
 *
 * Nenhuma nota, média ou posição aparece aqui nem em lugar nenhum do site —
 * o resultado é fechado até a premiação.
 */

export type Criterio = { chave: string; nome: string; descricao: string }

const NOTAS = [0, 1, 2, 3, 4, 5]

export default function FormularioVoto({
  slug,
  casa,
  prato,
  criterios,
  aceiteVersao,
}: {
  slug: string
  casa: string
  prato: string
  criterios: readonly Criterio[]
  aceiteVersao: string
}) {
  const router = useRouter()

  const [notas, setNotas] = useState<Record<string, number>>({})
  const [cpf, setCpf] = useState('')
  const [comentario, setComentario] = useState('')
  const [aceite, setAceite] = useState(false)
  const [enviando, setEnviando] = useState(false)
  /**
   * Só vira true depois que o React assume a tela. Antes disso o botão fica
   * travado de propósito — ver o comentário do <form> logo abaixo.
   */
  const [pronto, setPronto] = useState(false)
  useEffect(() => setPronto(true), [])
  const [erro, setErro] = useState<string | null>(null)
  const [tentou, setTentou] = useState(false)

  const digitos = limparCpf(cpf)
  const cpfCompleto = digitos.length === 11
  const cpfOk = cpfCompleto && cpfValido(digitos)
  const faltamNotas = criterios.filter((c) => notas[c.chave] === undefined)
  const podeEnviar = faltamNotas.length === 0 && cpfOk && aceite && !enviando

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setTentou(true)
    if (!podeEnviar) return

    setEnviando(true)
    setErro(null)

    try {
      const resposta = await fetch('/api/voto', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, cpf: digitos, aceite, aceiteVersao, notas, comentario }),
      })
      const corpo = await resposta.json().catch(() => ({}))

      if (!resposta.ok) {
        setErro(corpo?.erro ?? 'Não foi possível registrar o seu voto. Tente de novo.')
        setEnviando(false)
        return
      }

      router.replace(`/votar/${slug}/obrigado`)
    } catch {
      setErro('Sem conexão com o servidor. Confira a internet e tente de novo.')
      setEnviando(false)
    }
  }

  return (
    /**
     * `method="post"` não é decoração. Sem ele, um formulário sem `method` faz
     * submit nativo em GET quando o JavaScript não está ativo — e aí os campos
     * viram query string: o CPF apareceria na barra de endereço, no histórico
     * do celular, no log de acesso do servidor e no cabeçalho Referer. Todo o
     * cuidado do HMAC não valeria nada.
     *
     * Com POST os campos vão no corpo. E o botão só destrava quando o React
     * assume: se os scripts não carregarem, a pessoa vê um aviso em vez de um
     * envio que parece dar certo e não grava nada.
     */
    <form method="post" onSubmit={enviar} noValidate className="flex flex-col gap-7">
      {criterios.map((criterio) => {
        const escolhida = notas[criterio.chave]
        const emFalta = tentou && escolhida === undefined

        return (
          <fieldset key={criterio.chave}>
            <legend className="font-display text-[19px] leading-tight font-extrabold">
              {criterio.nome}
            </legend>
            <p className="mt-1 mb-3 text-[14px] text-tinta-3">{criterio.descricao}</p>

            <div className="grid grid-cols-6 gap-1.5" role="radiogroup">
              {NOTAS.map((nota) => {
                const marcada = escolhida === nota
                return (
                  <label
                    key={nota}
                    className={`flex h-14 cursor-pointer items-center justify-center rounded-xl font-display text-[19px] font-extrabold transition-colors ${
                      marcada
                        ? 'bg-marinho text-branco'
                        : 'bg-claro text-tinta-3 hover:bg-creme'
                    } ${emFalta ? 'ring-2 ring-ambar-e' : ''}`}
                  >
                    <input
                      type="radio"
                      name={criterio.chave}
                      value={nota}
                      checked={marcada}
                      onChange={() =>
                        setNotas((atuais) => ({ ...atuais, [criterio.chave]: nota }))
                      }
                      className="sr-only"
                    />
                    <span aria-hidden="true">{nota}</span>
                    <span className="sr-only">
                      nota {nota} para {criterio.nome}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        )
      })}

      <div>
        <label htmlFor="comentario" className="mb-1 block font-display text-[17px] font-extrabold">
          Quer deixar uma observação? <span className="font-normal text-tinta-3">(opcional)</span>
        </label>
        {/* O desvínculo é de banco, não de promessa: a observação vai para
            outra tabela, sem CPF, sem IP e sem hora. Ver `lib/painel.ts`. */}
        <p className="mt-1 mb-3 text-[14px] text-tinta-3">
          Ela não fica ligada à sua avaliação nem a você: é guardada à parte, sem o seu CPF e sem
          horário. A casa recebe só o texto, fora de ordem.
        </p>
        <textarea
          id="comentario"
          name="comentario"
          rows={3}
          maxLength={COMENTARIO_MAXIMO}
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, COMENTARIO_MAXIMO))}
          placeholder="O que funcionou, o que dava para melhorar…"
          /* 16px é piso, não estética: abaixo disso o Safari do iOS dá zoom ao
             focar o campo e desalinha a tela no meio do voto. */
          className="w-full rounded-xl bg-claro px-4 py-3 text-[16px] text-tinta"
        />
        <p
          aria-live="polite"
          className={`mt-1 text-right text-[12.5px] ${
            comentario.length >= COMENTARIO_MAXIMO ? 'font-bold text-ambar-e' : 'text-tinta-3'
          }`}
        >
          {comentario.length} de {COMENTARIO_MAXIMO}
        </p>
      </div>

      <div className="rounded-2xl bg-creme p-5">
        <label htmlFor="cpf" className="block font-display text-[17px] font-extrabold">
          Seu CPF
        </label>
        <p className="mt-1 mb-3 text-[14px] text-tinta-3">
          Impede que a mesma pessoa vote duas vezes na mesma casa, e fica registrado para
          conferência da organização.
        </p>

        <input
          id="cpf"
          name="cpf"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(formatarCpf(e.target.value))}
          aria-invalid={cpfCompleto && !cpfOk}
          aria-describedby="cpf-aviso"
          className="w-full rounded-xl bg-claro px-4 py-3.5 font-display text-[20px] tracking-[0.02em] text-tinta"
        />

        <p id="cpf-aviso" className="mt-2 min-h-5 text-[13.5px] font-semibold">
          {cpfCompleto && !cpfOk ? (
            <span className="text-ambar-e">
              Esse CPF não confere. Verifique os números digitados.
            </span>
          ) : cpfOk ? (
            <span className="text-tinta-3">CPF válido.</span>
          ) : null}
        </p>

        <label className="mt-3 flex cursor-pointer items-start gap-3 text-[14px] text-tinta-3">
          <input
            type="checkbox"
            checked={aceite}
            onChange={(e) => setAceite(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[var(--color-marinho)]"
          />
          {/*
            Texto de aceite vigente desde 27/08/2026, quando a ACIA decidiu
            passar a armazenar o CPF. Ele precisa dizer as duas coisas que
            mudaram — que o número fica registrado, e que a organização o
            acessa — porque `ACEITE_VERSAO` só distingue as versões se elas de
            fato disserem coisas diferentes. Mexer aqui exige subir a versão em
            `lib/voto.ts`.
          */}
          <span>
            Concordo em informar meu CPF. Ele <b className="text-tinta">fica registrado</b> junto
            da minha avaliação e é acessível à organização do festival para conferência e
            auditoria. Serve para impedir que a mesma pessoa vote duas vezes na mesma casa. Minha
            observação, se eu escrever uma, é guardada separada e não fica ligada ao meu CPF.
          </span>
        </label>
      </div>

      {tentou && !podeEnviar && !erro ? (
        <p aria-live="polite" className="text-[14.5px] font-semibold text-ambar-e">
          {faltamNotas.length > 0
            ? `Falta dar nota em: ${faltamNotas.map((c) => c.nome).join(', ')}.`
            : !cpfOk
              ? 'Preencha um CPF válido.'
              : 'Marque o aceite para enviar.'}
        </p>
      ) : null}

      {erro ? (
        <p
          aria-live="assertive"
          className="rounded-xl bg-ambar/20 px-4 py-3 text-[14.5px] font-semibold text-ambar-e"
        >
          {erro}
        </p>
      ) : null}

      {!pronto ? (
        <p
          aria-live="polite"
          className="rounded-xl bg-creme px-4 py-3 text-center text-[14.5px] font-semibold text-tinta-3"
        >
          Preparando o formulário… Se esta mensagem não sair, recarregue a
          página com o QR code da mesa.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!pronto || enviando}
        className="btn w-full disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : `Enviar minha avaliação de ${prato}`}
      </button>

      <noscript>
        <p className="rounded-xl bg-ambar/20 px-4 py-3 text-[14.5px] font-semibold text-ambar-e">
          Esta página precisa de JavaScript para enviar a avaliação. Ative nas
          configurações do navegador e leia o QR code da mesa de novo.
        </p>
      </noscript>

      <p className="text-center text-[13px] text-tinta-3">
        Uma avaliação por pessoa em {casa}. Versão dos termos: {aceiteVersao}.
      </p>
    </form>
  )
}
