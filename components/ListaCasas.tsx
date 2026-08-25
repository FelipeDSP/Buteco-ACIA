import Link from 'next/link'
import BuscaCasas from '@/components/BuscaCasas'
import CartaoCasa from '@/components/CartaoCasa'
import FiltroPilulas from '@/components/FiltroPilulas'
import { TituloSecao } from '@/components/Secao'
import type { Casa } from '@/lib/tipos'

/**
 * A lista é o conteúdo principal da home. Busca e filtro vivem na URL:
 * funcionam sem JavaScript, sobrevivem ao botão voltar e são compartilháveis.
 */

type Props = {
  casas: Casa[]
  total: number
  bairros: string[]
  bairroAtivo?: string
  busca?: string
}

export default function ListaCasas({
  casas,
  total,
  bairros,
  bairroAtivo,
  busca,
}: Props) {
  const filtrando = Boolean(bairroAtivo || busca)

  return (
    <section id="casas" className="scroll-mt-4 py-16">
      <div className="wrap">
        <TituloSecao
          rotulo="Os concorrentes"
          titulo="Quem está na disputa"
          sub={
            total === 0
              ? 'A lista das casas participantes entra assim que a ACIA fechar a relação.'
              : 'Procure pelo nome da casa ou do prato, ou filtre pelo bairro que fica no seu caminho.'
          }
        />

        {total > 0 ? (
          <>
            <div className="mt-7 flex flex-wrap items-center gap-4 rounded-2xl bg-creme p-4">
              <BuscaCasas valor={busca} bairro={bairroAtivo} />
              <FiltroPilulas
                legenda="Bairro"
                parametro="bairro"
                opcoes={bairros}
                ativo={bairroAtivo}
                outros={{ busca }}
                rotuloTodos="Todos"
                ancora="#casas"
              />
            </div>

            <p
              aria-live="polite"
              className="mt-6 text-[15px] font-semibold text-tinta-3"
            >
              {casas.length === 0
                ? 'Nenhuma casa com essa combinação.'
                : `${casas.length} de ${total} ${total === 1 ? 'casa' : 'casas'}.`}
              {filtrando ? (
                <>
                  {' '}
                  <Link
                    href="/#casas"
                    className="font-bold text-marinho underline underline-offset-4"
                  >
                    Limpar tudo
                  </Link>
                </>
              ) : null}
            </p>
          </>
        ) : null}

        {casas.length > 0 ? (
          <ul className="mt-5 grid gap-4 duas:grid-cols-2 larga:grid-cols-3 ampla:grid-cols-4">
            {casas.map((casa, i) => (
              <li key={casa.slug} className="flex">
                <CartaoCasa casa={casa} prioridade={i < 4} />
              </li>
            ))}
          </ul>
        ) : total > 0 ? (
          <div className="mt-5 rounded-2xl bg-creme py-16 text-center">
            <b className="display block text-[24px]">Nenhuma casa aqui</b>
            <p className="mt-1.5 text-[15px] text-tinta-3">
              Tente outro bairro ou limpe a busca.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
