import Link from 'next/link'
import Etiqueta from '@/components/Etiqueta'
import FotoPrato from '@/components/FotoPrato'
import { linkComoChegar, nomeDoPrato, type Casa } from '@/lib/tipos'

/**
 * Cartão da grade. `h-full` + `flex-1` no miolo e `mt-auto` no pé garantem que
 * todos os cartões terminem alinhados, mesmo com nome de prato de uma ou de
 * três linhas.
 */

type Props = {
  casa: Casa
  prioridade?: boolean
}

export default function CartaoCasa({ casa, prioridade = false }: Props) {
  return (
    <article className="revela relative flex h-full flex-col overflow-hidden rounded-2xl bg-claro transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_12px_26px_rgba(7,38,88,0.16)]">
      <div className="relative aspect-4/3">
        <FotoPrato
          src={casa.prato.foto}
          prato={nomeDoPrato(casa)}
          casa={casa.nome}
          prioridade={prioridade}
          sizes="(max-width: 640px) 92vw, (max-width: 1240px) 44vw, 300px"
          className="absolute inset-0 h-full w-full"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 pt-4.5">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          <Etiqueta tom="tipo">{casa.tipo}</Etiqueta>
          {casa.bairro ? <Etiqueta>{casa.bairro}</Etiqueta> : null}
        </div>

        <h3 className="display text-[20px]">
          {/* O cartão inteiro é clicável, mas o link real é o nome do prato */}
          <Link href={`/casas/${casa.slug}`} className="before:absolute before:inset-0">
            {nomeDoPrato(casa)}
          </Link>
        </h3>
        <p className="mt-1 text-[14.5px] font-medium text-tinta-3">{casa.nome}</p>

        <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-4">
          <Link href={`/casas/${casa.slug}`} className="btn btn-pequeno">
            Ver a casa
          </Link>
          <a
            href={linkComoChegar(casa)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-linha btn-pequeno"
          >
            Como chegar
            <span className="sr-only"> até {casa.nome} (abre em nova aba)</span>
          </a>
        </div>
      </div>
    </article>
  )
}
