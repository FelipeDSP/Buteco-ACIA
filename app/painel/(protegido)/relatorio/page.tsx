import Link from 'next/link'
import BotaoImprimir from '@/components/painel/BotaoImprimir'
import { CRITERIOS_DA_APURACAO, apurar, lerRecorrencia } from '@/lib/painel'
import { EDICAO, CALENDARIO, NOTA_MAXIMA_TOTAL, PISO_MINIMO_PERCENTUAL } from '@/data/edicao'
import { dataLonga } from '@/lib/formato'

export const dynamic = 'force-dynamic'

/**
 * Relatório geral do festival, para a ACIA apresentar e arquivar.
 *
 * É o par do relatório por casa: o mesmo tratamento de folha, mas com o
 * festival inteiro. Existe porque a apuração só saía em CSV, e CSV serve para
 * recalcular, não para mostrar a alguém — quem recebia precisava formatar a
 * planilha antes de usar.
 *
 * **O CSV continua existindo**, e é ele que deve ser usado para conferir conta
 * ou cruzar dado. São ferramentas diferentes para públicos diferentes.
 */

const nota = (v: number | null) => (v === null ? '—' : v.toFixed(3).replace('.', ','))
const media = (v: number | null) => (v === null ? '—' : v.toFixed(2).replace('.', ','))
const pct = (parte: number, todo: number) =>
  todo === 0 ? '—' : `${((parte / todo) * 100).toFixed(1).replace('.', ',')}%`

export default async function RelatorioGeral() {
  const [apuracao, recorrencia] = await Promise.all([apurar(), lerRecorrencia()])

  const comVoto = apuracao.linhas.filter((l) => l.avaliacoes > 0)
  const elegiveis = comVoto.filter((l) => l.elegivel)
  const foraDoPiso = comVoto.filter((l) => !l.elegivel && !l.desclassificada)
  const umaCasaSo = recorrencia.distribuicao.find((d) => d.casas === 1)?.pessoas ?? 0
  const maisDeUma = recorrencia.pessoas - umaCasaSo

  return (
    <div className="wrap max-w-[86ch]">
      <div className="naoimprime">
        <p className="pt-2">
          <Link
            href="/painel"
            className="inline-block py-1.5 text-[14px] font-bold text-marinho underline underline-offset-2"
          >
            ← Apuração
          </Link>
        </p>
        <p className="mt-4 mb-6 flex flex-wrap gap-3">
          <BotaoImprimir />
          <a href="/api/painel/csv" className="btn btn-linha btn-pequeno">
            CSV, para recalcular
          </a>
        </p>
      </div>

      <article className="rounded-2xl bg-claro p-7 folha">
        <header className="border-b border-risco pb-5">
          <p className="font-display text-[12.5px] font-extrabold tracking-[0.12em] text-ambar-e uppercase">
            {EDICAO.nome} · {EDICAO.ordinal}
          </p>
          <h1 className="display mt-1 text-[clamp(24px,3vw,32px)]">Relatório da apuração</h1>
          <p className="mt-1 text-[14px] text-tinta-3">
            Festival de {dataLonga(CALENDARIO.inicioFestival)} a{' '}
            {dataLonga(CALENDARIO.fimFestival)} · {EDICAO.cidade}/{EDICAO.uf}
          </p>
        </header>

        <section className="mt-6 grid gap-5 duas:grid-cols-4">
          {[
            { r: 'Avaliações válidas', v: apuracao.votos },
            { r: 'Pessoas distintas', v: recorrencia.pessoas },
            { r: 'Casas com avaliação', v: comVoto.length },
            { r: 'Mínimo para concorrer', v: Math.ceil(apuracao.piso) },
          ].map((n) => (
            <div key={n.r}>
              <p className="rotulo-rel">{n.r}</p>
              <p className="display text-[clamp(22px,3vw,30px)]">{n.v}</p>
            </div>
          ))}
        </section>

        <p className="mt-4 text-[13px] text-tinta-3">
          O mínimo vem do <b className="text-tinta">Art. 18º</b>:{' '}
          {PISO_MINIMO_PERCENTUAL}% da média de avaliações por estabelecimento, que nesta edição
          foi de {apuracao.mediaDeAvaliacoes.toFixed(1).replace('.', ',')}. Quem ficou abaixo não
          entra no ranking, mas recebe placa e certificado.
        </p>

        <section className="mt-7">
          <h2 className="titulo-rel">Classificação</h2>
          <p className="mb-3 text-[13px] text-tinta-3">
            Nota final é a soma dos quatro critérios dividida pelo número de avaliações (Art. 17º),
            na escala de 0 a {NOTA_MAXIMA_TOTAL}. Três decimais porque as primeiras colocadas se
            separam na terceira.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-[14px]">
              <thead>
                <tr className="border-b border-risco text-left text-[11.5px] font-bold tracking-[0.04em] text-tinta-3 uppercase">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-3">Casa</th>
                  <th className="py-2 pr-3 text-right">Nota</th>
                  {CRITERIOS_DA_APURACAO.map((c) => (
                    <th key={c.chave} className="py-2 pr-3 text-right">
                      {c.nome.slice(0, 7)}
                    </th>
                  ))}
                  <th className="py-2 text-right">Aval.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-risco">
                {comVoto.map((l) => (
                  <tr key={l.id} className={l.elegivel ? '' : 'text-tinta-3'}>
                    <td className="py-2.5 pr-2 font-display font-extrabold tabular-nums">
                      {l.elegivel ? `${l.posicao}º` : '—'}
                    </td>
                    <td className="py-2.5 pr-3">
                      {l.nome}
                      {!l.elegivel ? (
                        <span className="block text-[11.5px]">abaixo do mínimo</span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-display font-extrabold tabular-nums">
                      {nota(l.mediaGeral)}
                    </td>
                    {CRITERIOS_DA_APURACAO.map((c) => (
                      <td key={c.chave} className="py-2.5 pr-3 text-right tabular-nums">
                        {media(l.medias[c.chave])}
                      </td>
                    ))}
                    <td className="py-2.5 text-right tabular-nums">{l.avaliacoes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {foraDoPiso.length > 0 ? (
            <p className="mt-3 text-[12.5px] text-tinta-3">
              {foraDoPiso.length === 1 ? 'Uma casa ficou' : `${foraDoPiso.length} casas ficaram`}{' '}
              abaixo do mínimo do Art. 18º e, por isso, fora do ranking:{' '}
              {foraDoPiso.map((l) => l.nome).join(', ')}.
            </p>
          ) : null}
        </section>

        <section className="mt-7">
          <h2 className="titulo-rel">Recorrência: quantas casas cada pessoa visitou</h2>
          <p className="mb-3 text-[13px] text-tinta-3">
            Contado por CPF distinto. Responde se o festival gerou circulação entre bares ou se
            cada pessoa avaliou só onde já ia comer.
          </p>
          <table className="w-full max-w-[46ch] text-[14px]">
            <tbody className="divide-y divide-risco">
              {recorrencia.distribuicao.map((d) => (
                <tr key={d.casas}>
                  <td className="py-2">
                    {d.casas} {d.casas === 1 ? 'casa' : 'casas'}
                  </td>
                  <td className="py-2 text-right font-display font-extrabold tabular-nums">
                    {d.pessoas}
                  </td>
                  <td className="w-[8ch] py-2 text-right text-tinta-3 tabular-nums">
                    {pct(d.pessoas, recorrencia.pessoas)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 max-w-[70ch] text-[13px]">
            <b>{pct(umaCasaSo, recorrencia.pessoas)}</b> das pessoas avaliaram{' '}
            <b>uma casa só</b>; {maisDeUma}{' '}
            {maisDeUma === 1 ? 'avaliou' : 'avaliaram'} mais de uma. A média é de{' '}
            {(recorrencia.avaliacoes / Math.max(recorrencia.pessoas, 1))
              .toFixed(2)
              .replace('.', ',')}{' '}
            avaliação por pessoa.
            {recorrencia.semCpf > 0 ? (
              <>
                {' '}
                Outras {recorrencia.semCpf} avaliações são anteriores ao registro de CPF e ficam
                fora desta conta.
              </>
            ) : null}
          </p>
        </section>

        <section className="mt-7">
          <h2 className="titulo-rel">Relatório individual por casa</h2>
          <p className="mb-3 text-[13px] text-tinta-3">
            Cada estabelecimento tem a sua folha, com a equipe mais avaliada e o que os clientes
            escreveram.
          </p>
          <ul className="grid gap-x-6 gap-y-1 duas:grid-cols-2">
            {comVoto.map((l) => (
              <li key={l.id} className="text-[14px]">
                {/* No papel o link vira o próprio nome, que é o que interessa
                    numa folha impressa. Não precisa de versão separada. */}
                <Link
                  href={`/painel/relatorio/${l.slug}`}
                  className="inline-block py-0.5 text-marinho underline underline-offset-2"
                >
                  {l.nome}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-8 border-t border-risco pt-4 text-[12px] text-tinta-3">
          Documento interno da ACIA — Associação Comercial e Industrial de Ariquemes. Nota, média e
          posição não aparecem em nenhuma página pública até a divulgação do resultado.
        </footer>
      </article>
    </div>
  )
}
