import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import CapaInterna from '@/components/CapaInterna'
import { CALENDARIO, NOTA_MAXIMA_TOTAL, PREMIACAO, PREMIO_DE_PARTICIPACAO } from '@/lib/dados'
import { contagem, mostrarVencedores } from '@/lib/fase'
import { dataLonga, reais } from '@/lib/formato'
import { lerPodio, podioVisivel } from '@/lib/resultado'

/**
 * O pódio vem da tabela `resultado` — retrato congelado publicado pela
 * Comissão. **Nunca de `avaliacoes`:** ranking derivado ao vivo entregaria a
 * parcial antes da premiação para quem soubesse abrir esta URL.
 *
 * `force-dynamic` porque a visibilidade depende da data de hoje, e uma página
 * cacheada mostraria o pódio antes ou depois da hora.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Vencedores',
  description:
    'Resultado da primeira edição do Boteco ACIA, apurado a partir das avaliações do público.',
}

const nota = (v: number) => v.toFixed(2).replace('.', ',')

const CORES = [
  'bg-marinho text-branco',
  'bg-claro',
  'bg-claro',
] as const

export default async function Vencedores() {
  const publicado = await lerPodio()
  // A data manda sobre a existência do registro: publicado antes da hora
  // continua invisível até o dia da divulgação.
  const mostrar = podioVisivel(publicado.length)
  const estado = contagem()

  return (
    <>
      <CapaInterna
        atual="Vencedores"
        selo={mostrar ? 'Resultado oficial' : 'Ainda não'}
        titulo={mostrar ? 'Os vencedores' : 'O resultado ainda não saiu'}
        sub={
          mostrar
            ? `Apurado a partir de todas as avaliações válidas do público, pela média aritmética simples. A nota vai de 0 a ${NOTA_MAXIMA_TOTAL} pontos.`
            : `${estado.detalhe}. A apuração acontece de ${dataLonga(
                CALENDARIO.inicioApuracao,
              )} a ${dataLonga(CALENDARIO.fimApuracao)}, e o resultado é divulgado a partir de ${dataLonga(
                CALENDARIO.divulgacao,
              )}.`
        }
      />

      <section className="py-14">
        <div className="wrap">
          {mostrar ? (
            <ol className="grid gap-4 media:grid-cols-3">
              {publicado.map((lugar, i) => (
                <li
                  key={lugar.posicao}
                  className={`overflow-hidden rounded-2xl ${CORES[i] ?? 'bg-claro'} ${
                    lugar.posicao === 1 ? 'media:-mt-4' : ''
                  }`}
                >
                  <div className="relative aspect-4/3 bg-marinho-2">
                    {lugar.casa.fotoUrl ? (
                      <Image
                        src={lugar.casa.fotoUrl}
                        alt={`${lugar.casa.prato ?? 'Prato'}, de ${lugar.casa.nome}`}
                        fill
                        sizes="(max-width: 760px) 92vw, 380px"
                        priority={lugar.posicao === 1}
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full place-content-center text-[12.5px] font-semibold text-selo">
                        foto do prato
                      </span>
                    )}
                    <span
                      className={`absolute top-3 left-3 grid size-11 place-content-center rounded-full font-display text-[17px] font-extrabold ${
                        lugar.posicao === 1 ? 'bg-ambar text-marinho' : 'bg-branco text-tinta'
                      }`}
                    >
                      {lugar.posicao}º
                    </span>
                  </div>

                  <div className="p-6">
                    <h2 className="display text-[21px]">
                      {lugar.casa.pratoConfirmado && lugar.casa.prato
                        ? lugar.casa.prato
                        : 'Prato da casa'}
                    </h2>
                    <p
                      className={`mt-1 font-display text-[16px] font-bold ${
                        lugar.posicao === 1 ? 'text-ouro' : 'text-tinta-3'
                      }`}
                    >
                      {lugar.casa.nome}
                    </p>

                    <p className="mt-4 flex items-baseline gap-2">
                      <b className="font-display text-[30px] leading-none font-extrabold">
                        {nota(lugar.notaFinal)}
                      </b>
                      <span
                        className={`text-[13.5px] ${
                          lugar.posicao === 1 ? 'text-selo' : 'text-tinta-3'
                        }`}
                      >
                        de {NOTA_MAXIMA_TOTAL}, em {lugar.totalAvaliacoes}{' '}
                        {lugar.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
                      </span>
                    </p>

                    <p className="mt-5">
                      <Link
                        href={`/casas/${lugar.casa.slug}`}
                        className={`btn btn-pequeno ${lugar.posicao === 1 ? 'btn-ambar' : ''}`}
                      >
                        Ver a casa
                      </Link>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-risco bg-claro p-9 text-center">
              <p className="font-display text-[20px] font-bold">Pódio a divulgar</p>
              <p className="mx-auto mt-2 max-w-[46ch] text-[15.5px] text-tinta-3">
                As três primeiras colocadas aparecem aqui com nome da casa, prato e nota final,
                a partir de {dataLonga(CALENDARIO.divulgacao)}.
              </p>
              <p className="mt-6">
                <Link href="/#casas" className="btn">
                  Ver as casas na disputa
                </Link>
              </p>
            </div>
          )}

          <h2 className="display mt-12 text-[clamp(22px,2.6vw,30px)]">
            O que cada colocação recebe
          </h2>
          <ul className="mt-6 grid gap-3.5 media:grid-cols-3">
            {PREMIACAO.map((premio) => (
              <li key={premio.posicao} className="rounded-2xl bg-creme p-6">
                <span className="rotulo text-[12.5px]">{premio.posicao}</span>
                <b className="mt-3.5 block font-display text-[32px] leading-none font-extrabold text-ambar-e">
                  {premio.valor === null ? '—' : reais(premio.valor)}
                </b>
                <p className="mt-2 text-[15px] text-tinta-3">{premio.extra}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-[68ch] text-[15px] text-tinta-3">
            {PREMIO_DE_PARTICIPACAO} Vale para toda casa inscrita, inclusive as que não
            alcançaram o piso mínimo de avaliações.
          </p>
        </div>
      </section>
    </>
  )
}
