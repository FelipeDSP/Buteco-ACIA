'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SairDoPainel() {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)

  return (
    <button
      type="button"
      disabled={saindo}
      onClick={async () => {
        setSaindo(true)
        await fetch('/api/painel/sair', { method: 'POST' })
        router.replace('/painel/entrar')
        router.refresh()
      }}
      className="rounded-full bg-white/10 px-4 py-1.5 text-[14px] font-semibold text-branco hover:bg-white/20 disabled:opacity-60"
    >
      {saindo ? 'Saindo…' : 'Sair'}
    </button>
  )
}
