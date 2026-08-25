import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import FormularioDeEntrada from '@/components/painel/FormularioDeEntrada'
import { temSessaoDoPainel } from '@/lib/painel-auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Entrar no painel',
  robots: { index: false, follow: false },
}

export default async function Entrar() {
  if (await temSessaoDoPainel()) redirect('/painel')

  return (
    <section className="grid min-h-screen place-content-center bg-marinho px-6">
      <div className="w-[min(380px,90vw)]">
        <p className="mb-3.5">
          <span className="rotulo">Acesso restrito</span>
        </p>
        <h1 className="display text-[30px] text-branco">Painel do Boteco ACIA</h1>
        <p className="mt-3 mb-7 text-[15px] text-selo">
          Apuração, auditoria e cadastro das casas.
        </p>
        <FormularioDeEntrada />
      </div>
    </section>
  )
}
