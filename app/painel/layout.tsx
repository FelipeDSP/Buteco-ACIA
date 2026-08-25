import type { Metadata } from 'next'
import Link from 'next/link'
import { exigirSessaoDoPainel } from '@/lib/painel-auth'
import SairDoPainel from '@/components/painel/SairDoPainel'

/**
 * Trava de tudo que fica abaixo de /painel.
 *
 * A verificação roda aqui, no servidor, antes de qualquer dado ser lido —
 * esconder no cliente não seria proteção. Os route handlers de escrita têm a
 * sua própria checagem, porque quem chama a API direto não passa por este
 * layout.
 *
 * `/painel/entrar` não fica abaixo deste layout, por motivo óbvio.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
}

const ABAS = [
  { href: '/painel', rotulo: 'Apuração' },
  { href: '/painel/auditoria', rotulo: 'Auditoria' },
  { href: '/painel/casas', rotulo: 'Casas' },
]

export default async function LayoutDoPainel({ children }: { children: React.ReactNode }) {
  await exigirSessaoDoPainel()

  return (
    <div className="min-h-screen bg-branco">
      <header className="bg-marinho-2 text-branco">
        <div className="wrap flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <b className="font-display text-[17px] font-extrabold">Painel · Boteco ACIA</b>
            <nav>
              <ul className="flex flex-wrap gap-1 text-[14.5px] font-semibold">
                {ABAS.map((aba) => (
                  <li key={aba.href}>
                    <Link
                      href={aba.href}
                      className="block rounded-full px-3.5 py-1.5 text-selo hover:bg-white/10 hover:text-branco"
                    >
                      {aba.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <SairDoPainel />
        </div>
      </header>

      <main className="py-9">{children}</main>
    </div>
  )
}
