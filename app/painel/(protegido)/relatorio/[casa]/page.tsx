import Link from 'next/link'
import { notFound } from 'next/navigation'
import BotaoImprimir from '@/components/painel/BotaoImprimir'
import { CRITERIOS_DA_APURACAO, apurar, lerGarcons, lerObservacoes, lerVotosDaCasa } from '@/lib/painel'
import { EDICAO, NOTA_MAXIMA_TOTAL, PISO_MINIMO_PERCENTUAL, PREMIACAO, PREMIO_DE_PARTICIPACAO } from '@/data/edicao'

export const dynamic = 'force-dynamic'

/**
 * Relatório de uma casa, para a ACIA entregar ao estabelecimento.
 *
 * É a devolutiva que o dono do bar recebe: onde ficou, a nota nos quatro
 * critérios, quem da equipe foi mais avaliado e o que os clientes escreveram.
 * Sai em uma folha pelo botão de imprimir — e o resto da página (a navegação,
 * os avisos para quem opera o painel) some na impressão.
 *
 * **A nota aparece com três decimais, aqui e na apuração.** Com duas, o 1º e o
 * 2º colocados saem os dois como "19,92" e a ordem fica sem explicação na mão
 * de quem vai contestar — foi exatamente a dúvida que a ACIA levantou.
 */

const nota = (v: number) => v.toFixed(3).replace('.', ',')
const media = (v: number) => v.toFixed(2).replace('.', ',')

type Props = { params: Promise<{ casa: string }> }

export default async function Relatorio({ params }: Props) {
  const { casa: slug } = await params

  const [apuracao, garcons, observacoes] = await Promise.all([
    apurar(),
    lerGarcons(),
    lerObservacoes(),
  ])

  const linha = apuracao.linhas.find((l) => l.slug === slug)
  if (!linha || linha.mediaGeral === null) notFound()

  const votos = await lerVotosDaCasa(linha.id)

  const atendimento = garcons.find((c) => c.slug === slug)
  const comentarios = observacoes.find((c) => c.slug === slug)
  const premio = PREMIACAO[linha.posicao - 1]

  /**
   * A equipe sai por **volume**, não por nota — e isso precisa estar escrito.
   * Quase todo mundo tem média 5,0, então ordenar por média devolveria um
   * empate geral desempatado por acaso. A casa vai usar esta lista para pagar
   * prêmio a quem atendeu melhor; deixar implícito que o critério é a nota
   * seria entregar o dinheiro pelo motivo errado.
   */
  const equipe = [...(atendimento?.garcons ?? [])]
    .sort((a, b) => b.avaliacoes - a.avaliacoes || b.media - a.media)
    .slice(0, 6)

  return (
    <div className="wrap max-w-[64ch]">
      {/* Nada daqui vai para o papel: é a navegação de quem opera o painel. */}
      <div className="naoimprime">
        <p className="pt-2">
          <Link
            href="/painel"
            className="inline-block py-1.5 text-[14px] font-bold text-marinho underline underline-offset-2"
          >
            ← Apuração
          </Link>
        </p>

        {atendimento && atendimento.sugestoes.length > 0 ? (
          <p className="mt-4 rounded-2xl bg-creme p-4 text-[13.5px]">
            <b className="text-tinta">Resolva as uniões pendentes antes de entregar.</b> Esta casa
            tem {atendimento.sugestoes.length}{' '}
            {atendimento.sugestoes.length === 1 ? 'grafia' : 'grafias'} que podem ser a mesma
            pessoa — e é o <b>volume</b> que decide quem aparece em primeiro na equipe. Veja em{' '}
            <Link
              href={`/painel/garcons?casa=${encodeURIComponent(slug)}`}
              className="font-bold text-marinho underline underline-offset-2"
            >
              Garçons
            </Link>
            .
          </p>
        ) : null}

        <p className="mt-4 mb-6">
          <BotaoImprimir />
        </p>
      </div>

      <article className="rounded-2xl bg-claro p-7 folha">
        <header className="border-b border-risco pb-5">
          <p className="font-display text-[12.5px] font-extrabold tracking-[0.12em] text-ambar-e uppercase">
            {EDICAO.nome} · {EDICAO.ordinal}
          </p>
          <h1 className="display mt-1 text-[clamp(24px,3vw,32px)]">{linha.nome}</h1>
          <p className="mt-1 text-[14px] text-tinta-3">
            Relatório do estabelecimento · {EDICAO.cidade}/{EDICAO.uf}
          </p>
        </header>

        <section className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
          <div>
            <p className="rotulo-rel">Colocação</p>
            {linha.elegivel ? (
              <p className="display text-[clamp(30px,5vw,44px)] text-marinho">{linha.posicao}º lugar</p>
            ) : (
              <p className="display text-[clamp(20px,3vw,26px)] text-tinta-3">Fora do ranking</p>
            )}
          </div>
          <div>
            <p className="rotulo-rel">Nota final</p>
            <p className="display text-[clamp(26px,4vw,36px)]">
              {nota(linha.mediaGeral)}
              <span className="text-[15px] font-normal text-tinta-3"> / {NOTA_MAXIMA_TOTAL}</span>
            </p>
          </div>
          <div>
            <p className="rotulo-rel">Avaliações recebidas</p>
            <p className="display text-[clamp(26px,4vw,36px)]">{linha.avaliacoes}</p>
          </div>
        </section>

        {!linha.elegivel ? (
          <p className="mt-5 rounded-xl bg-creme px-4 py-3 text-[14px]">
            {/* `Math.ceil`, não arredondamento: o piso é 45,78 e quem tem 45 está
                fora. `toFixed(0)` acertaria aqui por acaso e erraria num piso
                de 45,4 — dizendo "45" para uma casa com 45 que não qualificou.
                É o número que a casa contestante vai citar. */}
            Esta casa não alcançou o mínimo de avaliações do <b>Art. 18º</b> —{' '}
            {PISO_MINIMO_PERCENTUAL}% da média do festival, o que nesta edição deu{' '}
            <b>{Math.ceil(apuracao.piso)} avaliações</b>. Por isso não entrou no ranking, e{' '}
            <b>recebe normalmente</b> {PREMIO_DE_PARTICIPACAO.toLowerCase()}
          </p>
        ) : premio ? (
          <p className="mt-5 rounded-xl bg-creme px-4 py-3 text-[14px]">
            <b>Premiação:</b> R$ {premio.valor?.toLocaleString('pt-BR')} · {premio.extra}
          </p>
        ) : (
          <p className="mt-5 rounded-xl bg-creme px-4 py-3 text-[14px]">
            <b>Premiação:</b> {PREMIO_DE_PARTICIPACAO}
          </p>
        )}

        <section className="mt-7">
          <h2 className="titulo-rel">Nota por critério</h2>
          <p className="mb-3 text-[13px] text-tinta-3">
            Cada critério vale de 0 a 5, e a nota final é a soma dos quatro — por isso a escala é de
            0 a {NOTA_MAXIMA_TOTAL} pontos.
          </p>
          <table className="w-full text-[14.5px]">
            <tbody className="divide-y divide-risco">
              {CRITERIOS_DA_APURACAO.map((criterio) => {
                const valor = linha.medias[criterio.chave]
                return (
                  <tr key={criterio.chave}>
                    <td className="py-2.5">{criterio.nome}</td>
                    <td className="w-[45%] py-2.5">
                      <span className="block h-2 w-full rounded-full bg-creme">
                        <span
                          className="block h-2 rounded-full bg-marinho"
                          style={{ width: `${((valor ?? 0) / 5) * 100}%` }}
                        />
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-display font-extrabold tabular-nums">
                      {valor === null ? '—' : media(valor)}
                      <span className="text-[12px] font-normal text-tinta-3"> / 5</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {equipe.length > 0 ? (
          <section className="mt-7">
            <h2 className="titulo-rel">Atendimento em destaque</h2>
            <p className="mb-3 text-[13px] text-tinta-3">
              Quem o cliente citou ao avaliar o atendimento, com o nome que ele escreveu. A ordem é
              por <b className="text-tinta">quantos clientes avaliaram cada pessoa</b> — quase toda
              a equipe ficou com média 5,0, então o que separa é o volume, não a nota. Este número
              é de avaliações recebidas, não de mesas atendidas.
            </p>
            <table className="w-full text-[14.5px]">
              <tbody className="divide-y divide-risco">
                {equipe.map((pessoa, i) => (
                  <tr key={pessoa.nome}>
                    <td className="py-2.5">
                      <b className="font-display font-extrabold">{pessoa.nome}</b>
                      {i === 0 ? (
                        <span className="ml-2 rounded-full bg-ambar px-2 py-0.5 text-[11px] font-bold text-marinho-2">
                          mais avaliado
                        </span>
                      ) : null}
                      {pessoa.grafias.length > 0 ? (
                        <span className="mt-0.5 block text-[12px] text-tinta-3">
                          também escrito: {pessoa.grafias.join(', ')}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 text-right text-[13.5px] whitespace-nowrap text-tinta-3">
                      {pessoa.avaliacoes} {pessoa.avaliacoes === 1 ? 'avaliação' : 'avaliações'}
                    </td>
                    <td className="py-2.5 pl-4 text-right font-display font-extrabold tabular-nums">
                      {pessoa.media.toLocaleString('pt-BR', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                      <span className="text-[12px] font-normal text-tinta-3"> / 5</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {atendimento && atendimento.semNome + atendimento.varios.length > 0 ? (
              <p className="mt-3 text-[12.5px] text-tinta-3">
                Outras {atendimento.semNome + atendimento.varios.length} avaliações de atendimento
                não puderam ser atribuídas a uma pessoa — o cliente escreveu &ldquo;não sei&rdquo;,
                um cargo, um elogio solto, ou citou mais de um nome.
              </p>
            ) : null}
          </section>
        ) : null}

        {comentarios && comentarios.itens.length > 0 ? (
          <section className="mt-7 quebrapagina">
            <h2 className="titulo-rel">
              O que os clientes escreveram
              <span className="ml-2 text-[13px] font-normal text-tinta-3">
                {comentarios.itens.length}{' '}
                {comentarios.itens.length === 1 ? 'observação' : 'observações'}
              </span>
            </h2>
            <p className="mb-3 text-[13px] text-tinta-3">
              Campo opcional da tela de voto. Vem <b className="text-tinta">sem data e sem ordem</b>
              , e não há como ligar um texto a quem o escreveu — é assim de propósito.
            </p>
            <ul className="flex flex-col gap-2">
              {comentarios.itens.map((item) => (
                <li
                  key={item.id}
                  className="border-l-2 border-risco pl-3 text-[14px] leading-snug break-words"
                >
                  {item.texto}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* A base de votos da casa, com o CPF mascarado — pedido da ACIA para o
            estabelecimento ver que cada voto tem um CPF distinto por trás.
            Começa em folha nova: são centenas de linhas. */}
        {votos.length > 0 ? (
          <section className="mt-7 quebrapagina">
            <h2 className="titulo-rel">
              Base dos votos
              <span className="ml-2 text-[13px] font-normal text-tinta-3">
                {votos.length} {votos.length === 1 ? 'avaliação' : 'avaliações'}
              </span>
            </h2>
            <p className="mb-3 max-w-[70ch] text-[13px] text-tinta-3">
              Uma linha por avaliação, com o <b className="text-tinta">CPF mascarado</b>: aparecem
              os três primeiros e os dois últimos dígitos. Serve para conferir que cada voto tem um
              CPF distinto por trás — o sistema aceita{' '}
              <b className="text-tinta">uma avaliação por pessoa em cada casa</b>. Sem data e sem
              hora, e fora da ordem de chegada: a sequência diria quem passou pelo salão e quando.
            </p>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-risco text-left text-[11px] font-bold tracking-[0.04em] text-tinta-3 uppercase">
                  <th className="py-1.5 pr-3">CPF</th>
                  {CRITERIOS_DA_APURACAO.map((c) => (
                    <th key={c.chave} className="py-1.5 pr-3 text-right">
                      {c.nome.slice(0, 7)}
                    </th>
                  ))}
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-risco">
                {votos.map((v, i) => (
                  <tr key={`${v.cpf}-${i}`}>
                    <td className="py-1.5 pr-3 font-mono text-[12.5px]">{v.cpf}</td>
                    {CRITERIOS_DA_APURACAO.map((c) => (
                      <td key={c.chave} className="py-1.5 pr-3 text-right tabular-nums">
                        {v.notas[c.chave]}
                      </td>
                    ))}
                    <td className="py-1.5 text-right font-display font-extrabold tabular-nums">
                      {v.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <footer className="mt-8 border-t border-risco pt-4 text-[12px] text-tinta-3">
          Apuração conforme o regulamento do {EDICAO.nome}: nota final é a soma dos quatro critérios
          dividida pelo número de avaliações (Art. 17º). Documento gerado pela ACIA — Associação
          Comercial e Industrial de Ariquemes.
        </footer>
      </article>
    </div>
  )
}
