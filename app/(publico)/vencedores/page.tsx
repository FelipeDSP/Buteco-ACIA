import type { Metadata } from 'next'
import Link from 'next/link'
import CapaInterna from '@/components/CapaInterna'
import Podio from '@/components/Podio'
import ChuvaDoFestival from '@/components/ChuvaDoFestival'
import { Espiga, TampinhaDeco } from '@/components/Ornamentos'
import { CALENDARIO, PREMIACAO, PREMIO_DE_PARTICIPACAO } from '@/lib/dados'
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

export default async function Vencedores() {
  const publicado = await lerPodio()
  // Aparece só se a Comissão liberou. A data não manda mais aqui.
  const mostrar = podioVisivel(publicado)
  const estado = contagem()

  /**
   * **Só as três primeiras, e sem número nenhum** — decisão da ACIA em
   * 30/09/2026, que substituiu a lista completa das classificadas.
   *
   * A página existe para anunciar quem ganhou. Publicar o ranking inteiro com
   * nota e contagem de votos expõe, na cidade e para a própria clientela, a
   * casa que ficou em último — que serviu o festival inteiro e vai receber
   * placa e certificado como todas as outras. Não há leitor servido por essa
   * informação que justifique o custo para ela.
   *
   * Isso é escolha de publicação, não de apuração: o retrato em `resultado`
   * continua guardando as doze posições, a nota de cada uma e quem ficou
   * abaixo do piso do Art. 18. O painel e o certificado seguem com o número.
   */
  const podio = publicado.filter((l) => l.elegivel && l.posicao <= 3)

  return (
    <>
      <CapaInterna
        compacta={mostrar}
        semDeco={mostrar}
        atual="Vencedores"
        selo={mostrar ? 'Resultado oficial' : 'Ainda não'}
        titulo={mostrar ? 'Os vencedores' : 'O resultado ainda não saiu'}
        sub={
          mostrar
            ? undefined
            : `${estado.detalhe}. A apuração acontece de ${dataLonga(
                CALENDARIO.inicioApuracao,
              )} a ${dataLonga(CALENDARIO.fimApuracao)}, e o resultado é divulgado a partir de ${dataLonga(
                CALENDARIO.divulgacao,
              )}.`
        }
      />

      {/* O PALCO. O pódio vive sobre marinho, emendado na capa, e é o único
          lugar do site em que o ouro aparece como ornamento — a regra é "ouro
          só sobre marinho", e é o cartão do campeão que o carrega. Sobre o
          creme das outras seções, âmbar e ouro não brilhavam. */}
      {mostrar ? (
        <section className="relative overflow-hidden bg-marinho pt-4 pb-16 text-branco">
          {/* As duas decorações do palco, e a capa vem sem a dela
              (`semDeco`). Antes havia a tampinha da capa, cortada na emenda,
              mais outra aqui: dois círculos cortados um dentro do outro. Agora
              é uma só, posicionada para vazar pela borda direita — que é um
              corte com motivo — em vez de morrer numa emenda invisível. */}
          <TampinhaDeco
            style={{ right: -72, top: 34, width: 184, opacity: 0.75 }}
            tom="escuro"
          />
          <Espiga
            style={{ left: -58, bottom: -70, width: 160, opacity: 0.16 }}
            className="text-ouro"
          />
          <ChuvaDoFestival />
          <div className="wrap relative">
            <Podio lugares={podio} />
          </div>
        </section>
      ) : null}

      <section className="py-14">
        <div className="wrap">
          {mostrar ? null : (
            <div className="rounded-2xl border-2 border-dashed border-risco bg-claro p-9 text-center">
              <p className="font-display text-[20px] font-bold">Pódio a divulgar</p>
              <p className="mx-auto mt-2 max-w-[46ch] text-[15.5px] text-tinta-3">
                As três primeiras colocadas aparecem aqui com nome da casa e prato, a
                partir de {dataLonga(CALENDARIO.divulgacao)}.
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
