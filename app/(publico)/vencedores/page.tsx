import type { Metadata } from 'next'
import Link from 'next/link'
import CapaInterna from '@/components/CapaInterna'
import Podio from '@/components/Podio'
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

export default async function Vencedores() {
  const publicado = await lerPodio()
  // A data manda sobre a existência do registro: publicado antes da hora
  // continua invisível até o dia da divulgação.
  const mostrar = podioVisivel(publicado.length)
  const estado = contagem()

  // Três faixas distintas, e a diferença entre as duas últimas importa:
  // "4º colocado" e "não concorreu" não são a mesma coisa.
  const classificadas = publicado.filter((l) => l.elegivel)
  const podio = classificadas.filter((l) => l.posicao <= 3)
  const demais = classificadas.filter((l) => l.posicao > 3)
  const foraDoRanking = publicado.filter((l) => !l.elegivel)

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
            <>
              <Podio lugares={podio} notaMaxima={NOTA_MAXIMA_TOTAL} />

              {demais.length > 0 ? (
                <div className="mt-12">
                  <h2 className="display text-[clamp(20px,2.4vw,26px)]">
                    As demais colocadas
                  </h2>
                  <p className="mt-2 max-w-[62ch] text-[14.5px] text-tinta-3">
                    Casas que alcançaram o mínimo de avaliações e concorreram ao prêmio.
                  </p>

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-[15px]">
                      <thead>
                        <tr className="border-b-2 border-risco text-left">
                          <th className="py-2.5 pr-3 font-semibold">#</th>
                          <th className="py-2.5 pr-3 font-semibold">Casa</th>
                          <th className="py-2.5 pr-3 font-semibold">Prato</th>
                          <th
                            className="py-2.5 pr-3 text-right font-semibold"
                            title={`Nota final, de 0 a ${NOTA_MAXIMA_TOTAL}`}
                          >
                            Nota
                          </th>
                          <th className="py-2.5 text-right font-semibold">Avaliações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demais.map((lugar) => (
                          <tr key={lugar.posicao} className="border-b border-risco">
                            <td className="py-3 pr-3 font-display font-extrabold text-tinta-3">
                              {lugar.posicao}º
                            </td>
                            <td className="py-3 pr-3">
                              <Link
                                href={`/casas/${lugar.casa.slug}`}
                                className="font-semibold hover:underline"
                              >
                                {lugar.casa.nome}
                              </Link>
                            </td>
                            <td className="py-3 pr-3 text-tinta-3">
                              {lugar.casa.pratoConfirmado && lugar.casa.prato
                                ? lugar.casa.prato
                                : '—'}
                            </td>
                            <td className="py-3 pr-3 text-right font-display font-extrabold">
                              {nota(lugar.notaFinal)}
                            </td>
                            <td className="py-3 text-right text-tinta-3">
                              {lugar.totalAvaliacoes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {foraDoRanking.length > 0 ? (
                <div className="mt-12">
                  <h2 className="display text-[clamp(20px,2.4vw,26px)]">
                    Casas participantes fora do ranking
                  </h2>
                  {/* Sem número de colocação, de propósito: elas não ficaram em
                      último — não entraram na disputa por colocação. */}
                  <p className="mt-2 max-w-[68ch] text-[14.5px] text-tinta-3">
                    Estas casas serviram o prato durante todo o festival, mas não alcançaram o
                    mínimo de avaliações que o regulamento exige para concorrer à colocação
                    (Art. 18). Recebem, como todas as participantes, prato personalizado de
                    parede e certificado.
                  </p>

                  <ul className="mt-5 grid gap-3 duas:grid-cols-2 larga:grid-cols-3">
                    {foraDoRanking.map((lugar) => (
                      <li key={lugar.casa.slug} className="rounded-2xl bg-creme p-5">
                        <Link
                          href={`/casas/${lugar.casa.slug}`}
                          className="font-display text-[16px] font-extrabold hover:underline"
                        >
                          {lugar.casa.nome}
                        </Link>
                        {lugar.casa.pratoConfirmado && lugar.casa.prato ? (
                          <p className="mt-1 text-[14px] text-tinta-3">{lugar.casa.prato}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
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
