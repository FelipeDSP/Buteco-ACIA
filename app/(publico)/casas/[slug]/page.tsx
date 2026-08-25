import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CartaoCasa from '@/components/CartaoCasa'
import Migalha from '@/components/Migalha'
import Etiqueta from '@/components/Etiqueta'
import FotoPrato from '@/components/FotoPrato'
import { TampinhaDeco } from '@/components/Ornamentos'
import {
  enderecoCompleto,
  linkComoChegar,
  nomeDoPrato,
  listarCasas,
  obterCasa,
  outrasCasas,
} from '@/lib/dados'
import { faseAtual } from '@/lib/fase'

/* URL estável entre edições: /casas/[slug] não muda de ano para ano. */
export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    return (await listarCasas()).map((casa) => ({ slug: casa.slug }))
  } catch {
    /**
     * O build lê o banco para pré-renderizar as páginas das casas. Num deploy
     * por container isso vira acoplamento ruim: Supabase fora do ar por um
     * minuto derruba o deploy inteiro. Sem lista, as páginas passam a ser
     * geradas sob demanda — o site continua de pé, só sem o ganho do pré-render.
     */
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const casa = await obterCasa(slug)
  if (!casa) return { title: 'Casa não encontrada' }

  return {
    title: `${casa.nome} — ${nomeDoPrato(casa)}`,
    description:
      casa.prato.descricao ||
      `${casa.nome}, ${casa.tipo.toLowerCase()} no bairro ${casa.bairro}, está na disputa do Boteco ACIA.`,
  }
}

function comoVotarAqui(fase: ReturnType<typeof faseAtual>) {
  switch (fase) {
    case 'pre-festival':
      return 'A votação abre em 19 de setembro. A partir daí, o QR code fica na mesa desta casa.'
    case 'festival':
      return 'Peça o prato da disputa e aponte a câmera para o QR code da mesa. A avaliação leva menos de um minuto.'
    case 'apuracao':
      return 'A votação encerrou em 10 de outubro. As notas estão sendo apuradas.'
    default:
      return 'A votação desta edição está encerrada.'
  }
}

export default async function PaginaCasa({ params }: Props) {
  const { slug } = await params
  const casa = await obterCasa(slug)
  if (!casa) notFound()

  const vizinhas = await outrasCasas(slug, 2)
  const fase = faseAtual()

  const contatos: { rotulo: string; texto: string; href: string }[] = []
  if (casa.instagram) {
    contatos.push({
      rotulo: 'Instagram',
      texto: `@${casa.instagram}`,
      href: `https://instagram.com/${casa.instagram}`,
    })
  }
  if (casa.telefone) {
    contatos.push({
      rotulo: 'Telefone',
      texto: casa.telefone,
      href: `tel:${casa.telefone.replace(/\D/g, '')}`,
    })
  }

  return (
    <>
      <section className="relative overflow-hidden bg-marinho py-12 text-branco">
        <TampinhaDeco
          style={{ right: -60, bottom: -60, width: 200, opacity: 0.9 }}
          tom="escuro"
        />
        <div className="wrap">
          <div className="mb-6">
            <Migalha trilha={[{ href: '/#casas', rotulo: 'As casas' }]} atual={casa.nome} />
          </div>

          <div className="grid items-center gap-9 larga:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-selo/25 px-3 py-0.5 text-[12.5px] font-bold text-branco">
                  {casa.tipo}
                </span>
                {casa.bairro ? (
                  <span className="rounded-full bg-ambar px-3 py-0.5 text-[12.5px] font-bold text-marinho">
                    {casa.bairro}
                  </span>
                ) : null}
              </div>

              <h1 className="display text-[clamp(30px,4.4vw,52px)]">
                {nomeDoPrato(casa)}
              </h1>
              <p className="mt-2 font-display text-[19px] font-bold text-ouro">
                {casa.nome}
              </p>

              <p className="mt-4 max-w-[46ch] text-[16.5px] text-selo">
                {!casa.prato.confirmado
                  ? 'Esta casa ainda está fechando o prato com a ACIA. O nome entra aqui assim que for confirmado.'
                  : casa.prato.descricao ||
                    'A descrição do prato entra assim que a casa enviar à ACIA.'}
              </p>

              {casa.prato.confirmado && casa.prato.preco ? (
                <p className="mt-3 font-display text-[17px] font-bold text-ambar">
                  {casa.prato.preco}
                </p>
              ) : null}

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={linkComoChegar(casa)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ambar"
                >
                  Como chegar
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
                <Link href="/como-se-vota" className="btn btn-ouro">
                  Como se vota
                </Link>
              </div>
            </div>

            <FotoPrato
              src={casa.prato.foto}
              prato={nomeDoPrato(casa)}
              casa={casa.nome}
              prioridade
              sizes="(max-width: 900px) 90vw, 380px"
              className="aspect-4/3 rounded-2xl ring-1 ring-ouro/25"
            />
          </div>
        </div>
      </section>

      <section className="py-13">
        <div className="wrap grid items-start gap-9 larga:grid-cols-2">
          <div className="rounded-2xl bg-claro p-7">
            <h2 className="font-display text-[22px] font-extrabold">Onde é</h2>
            <address className="mt-3 text-[16px] not-italic text-tinta-3">
              {enderecoCompleto(casa)}
            </address>
            <p className="mt-5">
              <a
                href={linkComoChegar(casa)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-linha btn-pequeno"
              >
                Abrir no mapa
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </p>

            {contatos.length > 0 ? (
              <dl className="mt-6 flex flex-col gap-2 border-t border-risco pt-5 text-[15px]">
                {contatos.map((c) => (
                  <div key={c.rotulo} className="flex gap-2">
                    <dt className="font-semibold text-tinta-3">{c.rotulo}:</dt>
                    <dd>
                      <a
                        href={c.href}
                        className="font-semibold text-marinho underline underline-offset-4"
                      >
                        {c.texto}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          <div className="rounded-2xl bg-creme p-7">
            <h2 className="font-display text-[22px] font-extrabold">
              Como avaliar esta casa
            </h2>
            <p className="mt-3 text-[16px] text-tinta-3">{comoVotarAqui(fase)}</p>
            <p className="mt-5">
              <Link href="/como-se-vota" className="btn btn-linha btn-pequeno">
                Como se vota
              </Link>
            </p>
          </div>
        </div>
      </section>

      {vizinhas.length > 0 ? (
        <section className="bg-creme py-13">
          <div className="wrap">
            <h2 className="display text-[clamp(22px,2.6vw,30px)]">
              Continue o roteiro
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {vizinhas.map((outra) => (
                <li key={outra.slug} className="flex">
                  <CartaoCasa casa={outra} />
                </li>
              ))}
            </ul>
            <p className="mt-7">
              <Link href="/#casas" className="btn">
                Ver todas as casas
              </Link>
            </p>
          </div>
        </section>
      ) : null}
    </>
  )
}
