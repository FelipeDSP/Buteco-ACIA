'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function FormularioDeEntrada() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!senha || entrando) return

    setEntrando(true)
    setErro(null)

    try {
      const resposta = await fetch('/api/painel/entrar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ senha }),
      })

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => ({}))
        setErro(corpo?.erro ?? 'Não foi possível entrar.')
        setEntrando(false)
        setSenha('')
        return
      }

      router.replace('/painel')
      router.refresh()
    } catch {
      setErro('Sem conexão com o servidor.')
      setEntrando(false)
    }
  }

  return (
    // method="post" pela mesma razão da tela de voto: sem JavaScript, um submit
    // nativo em GET colocaria a senha na barra de endereço e no log de acesso.
    <form method="post" onSubmit={entrar} className="flex flex-col gap-3">
      <label htmlFor="senha" className="sr-only">
        Senha do painel
      </label>
      <input
        id="senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha"
        className="rounded-xl bg-claro px-4 py-3.5 text-[16px] text-tinta"
      />

      {erro ? (
        <p
          aria-live="assertive"
          className="rounded-xl bg-ambar/20 px-4 py-2.5 text-[14px] font-semibold text-ambar"
        >
          {erro}
        </p>
      ) : null}

      <button type="submit" disabled={entrando} className="btn btn-ambar disabled:opacity-60">
        {entrando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
