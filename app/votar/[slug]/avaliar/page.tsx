import type { Metadata } from 'next'
import Link from 'next/link'
import FormularioVoto from '@/components/FormularioVoto'
import { CRITERIOS, obterCasa, nomeDoPrato } from '@/lib/dados'
import { situacaoDaCasa, descreverFaixas } from '@/lib/horarios'
import { RECUSA, lerSessao } from '@/lib/sessao'
import { ACEITE_VERSAO } from '@/lib/voto'

/* Tela de voto: sempre fresca, nunca cacheada — depende de cookie e de hora. */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Avaliar',
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ erro?: string }>
}

function Aviso({
  titulo,
  texto,
  detalhe,
}: {
  titulo: string
  texto: string
  detalhe?: string
}) {
  return (
    <section className="py-14">
      <div className="wrap max-w-[46ch]">
        <h1 className="display text-[clamp(26px,5vw,36px)]">{titulo}</h1>
        <p className="mt-4 text-[16.5px] text-tinta-3">{texto}</p>
        {detalhe ? (
          <p className="mt-3 rounded-xl bg-creme px-4 py-3 text-[15px] font-semibold">
            {detalhe}
          </p>
        ) : null}
        <p className="mt-7">
          <Link href="/#casas" className="btn btn-linha">
            Ver as casas do festival
          </Link>
        </p>
      </div>
    </section>
  )
}

export default async function Avaliar({ params, searchParams }: Props) {
  const { slug } = await params
  const { erro } = await searchParams

  const casa = await obterCasa(slug)

  if (!casa || erro === 'casa') {
    return (
      <Aviso
        titulo="Essa casa não está na disputa"
        texto="O QR que você leu aponta para uma casa que não existe nesta edição ou saiu do festival."
      />
    )
  }

  if (erro === 'fechada') {
    const situacao = situacaoDaCasa(casa.horarios)
    return (
      <Aviso
        titulo="A votação desta casa está fechada agora"
        texto={`${casa.nome} não está no horário de funcionamento. Volte quando a casa abrir e leia o QR de novo.`}
        detalhe={`Hoje: ${descreverFaixas(situacao.hoje)}`}
      />
    )
  }

  if (erro === 'sessao') {
    return (
      <Aviso
        titulo="Não deu para abrir a votação"
        texto="Houve uma falha ao iniciar a sua sessão de voto. Aponte a câmera para o QR code da mesa de novo."
      />
    )
  }

  const verificacao = await lerSessao(casa.id)
  if (!verificacao.ok) {
    return <Aviso titulo="Sessão de voto não encontrada" texto={RECUSA[verificacao.motivo]} />
  }

  return (
    <>
      <header className="bg-marinho py-9 text-branco">
        <div className="wrap max-w-[46ch]">
          <p className="mb-3">
            <span className="rotulo">Sua avaliação</span>
          </p>
          <h1 className="display text-[clamp(26px,5vw,38px)]">{nomeDoPrato(casa)}</h1>
          <p className="mt-2 font-display text-[17px] font-bold text-ouro">{casa.nome}</p>
          <p className="mt-4 text-[15.5px] text-selo">
            Quatro toques e o CPF. Leva menos de um minuto e não precisa de cadastro.
          </p>
        </div>
      </header>

      <section className="py-9">
        <div className="wrap max-w-[46ch]">
          <FormularioVoto
            slug={casa.slug}
            casa={casa.nome}
            prato={nomeDoPrato(casa)}
            criterios={CRITERIOS}
            aceiteVersao={ACEITE_VERSAO}
          />
        </div>
      </section>
    </>
  )
}
