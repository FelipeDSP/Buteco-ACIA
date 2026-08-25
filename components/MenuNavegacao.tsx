'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ehAtual, type ItemMenu } from '@/lib/navegacao'

/**
 * Um único componente serve as duas larguras: linha de abas no desktop,
 * painel recolhível no celular. O botão só existe abaixo de 900px.
 */
export default function MenuNavegacao({ itens }: { itens: ItemMenu[] }) {
  const caminho = usePathname()
  const [aberto, setAberto] = useState(false)

  // Fecha ao trocar de página e ao apertar Esc.
  useEffect(() => setAberto(false), [caminho])
  useEffect(() => {
    if (!aberto) return
    const fechar = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [aberto])

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="menu-principal"
        className="flex items-center gap-2 rounded-full bg-marinho px-4 py-2.5 text-sm font-bold text-branco larga:hidden"
      >
        <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
          <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            {aberto ? (
              <path d="M2 2l14 10M16 2L2 12" />
            ) : (
              <path d="M1 2h16M1 7h16M1 12h16" />
            )}
          </g>
        </svg>
        Menu
      </button>

      <ul
        id="menu-principal"
        className={`${
          aberto ? 'flex' : 'hidden'
        } w-full flex-col gap-1 pb-2 text-[15.5px] font-semibold larga:flex larga:w-auto larga:flex-row larga:items-center larga:pb-0`}
      >
        {itens.map((item) => {
          const atual = ehAtual(item.href, caminho)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={atual ? 'page' : undefined}
                className={`block rounded-full px-4 py-2.5 transition-colors ${
                  atual
                    ? 'bg-marinho text-branco'
                    : 'text-tinta-3 hover:bg-creme hover:text-tinta'
                }`}
              >
                {item.rotulo}
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
