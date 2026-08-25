import type { Metadata } from 'next'
import Link from 'next/link'
import CartaoCasa from '@/components/CartaoCasa'
import { obterCasa, outrasCasas, nomeDoPrato } from '@/lib/dados'
import { notFound } from 'next/navigation'

/**
 * Confirmação. Além do agradecimento, empurra para a próxima casa — é o
 * momento de maior chance de a pessoa emendar outra parada, com o celular já
 * na mão. As sugestões são as casas mais próximas desta.
 *
 * Nenhuma nota, média ou posição aqui: o resultado é fechado até a premiação.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Voto registrado',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ slug: string }> }

export default async function Obrigado({ params }: Props) {
  const { slug } = await params
  const casa = await obterCasa(slug)
  if (!casa) notFound()

  const proximas = await outrasCasas(slug, 3)

  return (
    <>
      <header className="bg-marinho py-12 text-branco">
        <div className="wrap max-w-[52ch]">
          <p className="mb-3.5">
            <span className="rotulo">Voto registrado</span>
          </p>
          <h1 className="display text-[clamp(28px,5vw,42px)]">
            Obrigado por avaliar o {nomeDoPrato(casa)}.
          </h1>
          <p className="mt-4 text-[16.5px] text-selo">
            Sua avaliação de <b className="font-semibold text-branco">{casa.nome}</b> entrou
            na apuração. O resultado sai só na premiação, na segunda quinzena de outubro —
            até lá ninguém vê nota nem posição, nem as casas.
          </p>
        </div>
      </header>

      {proximas.length > 0 ? (
        <section className="py-14">
          <div className="wrap">
            <p className="mb-3.5">
              <span className="rotulo">Para onde ir agora</span>
            </p>
            <h2 className="display text-[clamp(22px,3vw,32px)]">
              As casas mais perto daqui
            </h2>
            <p className="mt-2.5 max-w-[52ch] text-[16px] text-tinta-3">
              Você pode avaliar quantas casas quiser — uma vez em cada. Estas são as
              vizinhas de {casa.nome}.
            </p>

            <ul className="mt-8 grid gap-4 duas:grid-cols-2 larga:grid-cols-3">
              {proximas.map((outra) => (
                <li key={outra.slug} className="flex">
                  <CartaoCasa casa={outra} />
                </li>
              ))}
            </ul>

            <p className="mt-8">
              <Link href="/#casas" className="btn btn-linha">
                Ver todas as casas
              </Link>
            </p>
          </div>
        </section>
      ) : null}
    </>
  )
}
