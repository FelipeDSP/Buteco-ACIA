import Link from 'next/link'
import LinhaDaAuditoria from '@/components/painel/LinhaDaAuditoria'
import { Bloco, Filtros, Numero, Numeros, TopoDaTela, Vazio } from '@/components/painel/Peças'
import LegendaDeSinais from '@/components/painel/LegendaDeSinais'
import { auditar, limiares, type Anomalia } from '@/lib/painel'

export const dynamic = 'force-dynamic'

const FILTROS = [
  'todas',
  'anomalias',
  'ip-em-varias-casas',
  'ip-repetido',
  'rajada',
  'fora-de-horario',
  'anuladas',
] as const
type Filtro = (typeof FILTROS)[number]

const ROTULO: Record<Filtro, string> = {
  todas: 'Todas',
  anomalias: 'Com sinal',
  'ip-repetido': 'IP repetido',
  'ip-em-varias-casas': 'IP em várias casas',
  rajada: 'Rajada',
  'fora-de-horario': 'Fora de horário',
  anuladas: 'Anuladas',
}

export default async function Auditoria({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; casa?: string }>
}) {
  const { ver, casa } = await searchParams
  const { linhas, suprimidos } = await auditar()
  const limites = limiares()

  const combina = (linha: (typeof linhas)[number], filtro: Filtro) => {
    if (filtro === 'todas') return true
    if (filtro === 'anuladas') return linha.anulada
    if (filtro === 'anomalias') return linha.anomalias.length > 0
    return linha.anomalias.includes(filtro as Anomalia)
  }

  // Parâmetro inventado cai para "todas", como no resto do site.
  const atual: Filtro = FILTROS.includes(ver as Filtro) ? (ver as Filtro) : 'todas'

  /**
   * As casas saem das próprias linhas, não de uma consulta nova: casa sem voto
   * não tem o que auditar, e uma pílula zerada só ocuparia espaço. Ordenadas
   * por nome, que é como a pessoa procura.
   */
  const casasNaLista = [...new Map(linhas.map((l) => [l.casaSlug, l.casa])).entries()]
    .map(([slug, nome]) => ({ slug, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const casaAtual = casasNaLista.some((c) => c.slug === casa) ? (casa as string) : 'todas'
  const daCasa = (l: (typeof linhas)[number]) => casaAtual === 'todas' || l.casaSlug === casaAtual

  const visiveis = linhas.filter((l) => combina(l, atual) && daCasa(l))

  /**
   * Cada contagem já considera o OUTRO filtro: a pílula diz quantas linhas
   * sobram se você clicar nela mantendo o que já está escolhido. Contar sobre
   * a lista inteira prometeria um número que o clique não entrega.
   */
  const quantosVer = (f: Filtro) => linhas.filter((l) => combina(l, f) && daCasa(l)).length
  const quantosCasa = (slug: string) =>
    linhas.filter((l) => combina(l, atual) && (slug === 'todas' || l.casaSlug === slug)).length

  const comSinal = linhas.filter((l) => l.anomalias.length > 0).length
  const ipsDistintos = new Set(linhas.map((l) => l.ip).filter(Boolean)).size
  const anuladas = linhas.filter((l) => l.anulada).length

  const filtrando = (atual !== 'todas' ? 1 : 0) + (casaAtual !== 'todas' ? 1 : 0)
  const nomeDaCasa = casasNaLista.find((c) => c.slug === casaAtual)?.nome

  return (
    <div className="wrap">
      <TopoDaTela
        titulo="Auditoria"
        sub="O CPF de quem votou aparece inteiro, por decisão da ACIA — quem abre esta tela está vendo dado pessoal de cliente de bar da cidade. A observação não está aqui: ela vive na aba Observações, sem vínculo com a avaliação. Os marcadores dirigem o olhar; a decisão de anular é da comissão, olhando o conjunto."
      />

      {/* Os números do topo são sempre do festival inteiro, nunca do filtro.
          É o retrato geral que a comissão usa para decidir onde olhar, e ele
          mudar a cada pílula clicada tiraria o ponto de referência. */}
      <Numeros>
        <Numero valor={linhas.length} rotulo="Avaliações" tom="destaque" />
        <Numero
          valor={comSinal}
          rotulo="Com sinal"
          tom={comSinal > 0 ? 'alerta' : 'neutro'}
          detalhe={
            linhas.length > 0 ? `${Math.round((comSinal / linhas.length) * 100)}% do total` : undefined
          }
        />
        <Numero valor={ipsDistintos} rotulo="IPs distintos" />
        <Numero valor={anuladas} rotulo="Anuladas" />
      </Numeros>

      {/* O marcador que se desligou não some em silêncio: sem este aviso, a
          Comissão leria ausência de alerta como ausência de problema. */}
      {suprimidos.length > 0 ? (
        <section className="mt-6 rounded-2xl bg-creme p-5">
          <h2 className="font-display text-[15.5px] font-extrabold">
            {suprimidos.length === 1 ? 'Um marcador foi desligado' : `${suprimidos.length} marcadores foram desligados`}
          </h2>
          <p className="mt-1.5 max-w-[72ch] text-[13px] text-tinta-3">
            Acendiam em mais de {limites.tetoDeSinalPct}% das avaliações, e alerta que dispara em
            quase tudo não é sensível — é inútil, e convida a anular voto legítimo. Voltam sozinhos
            quando pararem de disparar tanto.
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-[13.5px]">
            {suprimidos.map((s) => (
              <li key={s.sinal} className="border-t border-risco pt-1.5">
                <b className="font-display font-extrabold">{ROTULO[s.sinal as Filtro]}</b> —
                acenderia em <b className="tabular-nums">{s.disparos}</b> avaliações,{' '}
                <b className="tabular-nums">{Math.round(s.pct)}%</b> do total
              </li>
            ))}
          </ul>
          {suprimidos.some((s) => s.sinal.startsWith('ip')) ? (
            <p className="mt-3 max-w-[72ch] text-[12.5px] text-tinta-3">
              <b className="text-tinta">Os sinais de IP dependem de um endereço que identifique
              quem votou</b>, e nesta edição ele não identifica: as {linhas.length} avaliações
              chegaram por apenas {ipsDistintos} endereços, todos de intermediário. Com tão poucos,
              cada um aparece em todas as casas legitimamente. Resolver isso é o que traz estes
              marcadores de volta.
            </p>
          ) : null}
        </section>
      ) : null}

      <LegendaDeSinais limites={limites} />

      {/* O CSV leva o CPF junto. O rótulo diz isso antes do clique: planilha
          exportada sai do painel e não volta. */}
      <div className="mt-6 flex flex-col gap-1 rounded-2xl bg-claro p-4">
        <a href="/api/painel/auditoria" className="btn btn-pequeno btn-linha self-start">
          CSV da auditoria (ACIA)
        </a>
        <span className="text-[12px] text-tinta-3">
          uma linha por avaliação, com CPF, IP, notas e sinais — contém dado pessoal. Sai sempre
          completo, sem os filtros da tela
        </span>
      </div>

      {/* Os filtros ficam recolhidos. Eram sete pílulas de sinal; com as casas
          passam de vinte — uma parede antes da tabela, que é o que a pessoa
          veio ver. `<details>` resolve sem JavaScript, como o resto do painel,
          e já vem com teclado e leitor de tela de graça.

          Abre sozinho quando há filtro ligado: tabela curta com o painel
          fechado faria a comissão procurar dado que está escondido por uma
          escolha que ninguém lembra de ter feito. */}
      <details open={filtrando > 0} className="mt-6 mb-4 rounded-2xl bg-claro">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 px-5 py-3.5 font-display text-[14.5px] font-extrabold select-none [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="text-tinta-3">
            &#9776;
          </span>
          Filtros
          {filtrando > 0 ? (
            <span className="rounded-full bg-marinho px-2.5 py-0.5 text-[12px] font-bold text-branco">
              {filtrando === 1 ? '1 ativo' : `${filtrando} ativos`}
            </span>
          ) : (
            <span className="text-[13px] font-normal text-tinta-3">
              {linhas.length} avaliações, nenhum filtro
            </span>
          )}
        </summary>

        <div className="flex flex-col gap-4 border-t border-risco px-5 pt-4 pb-5">
          <div>
            <p className="mb-2 text-[12.5px] font-bold tracking-[0.03em] text-tinta-3 uppercase">
              Sinal
            </p>
            <Filtros
              base="/painel/auditoria"
              atual={atual}
              preservar={{ casa: casaAtual }}
              opcoes={FILTROS.map((f) => ({
                valor: f,
                rotulo: ROTULO[f],
                quantos: quantosVer(f),
              }))}
            />
          </div>

          {casasNaLista.length > 1 ? (
            <div>
              <p className="mb-2 text-[12.5px] font-bold tracking-[0.03em] text-tinta-3 uppercase">
                Casa
              </p>
              <Filtros
                base="/painel/auditoria"
                parametro="casa"
                atual={casaAtual}
                preservar={{ ver: atual }}
                opcoes={[
                  { valor: 'todas', rotulo: 'Todas as casas', quantos: quantosCasa('todas') },
                  ...casasNaLista.map((c) => ({
                    valor: c.slug,
                    rotulo: c.nome,
                    quantos: quantosCasa(c.slug),
                  })),
                ]}
              />
            </div>
          ) : null}

          {filtrando > 0 ? (
            <p>
              <Link
                href="/painel/auditoria"
                className="inline-block py-1 text-[13.5px] font-bold text-marinho underline underline-offset-2"
              >
                Limpar filtros
              </Link>
            </p>
          ) : null}
        </div>
      </details>

      {filtrando > 0 ? (
        <p className="mb-4 text-[14px] text-tinta-3">
          Mostrando <b className="text-tinta">{visiveis.length}</b> de {linhas.length} avaliações
          {nomeDaCasa ? (
            <>
              {' '}
              em <b className="text-tinta">{nomeDaCasa}</b>
            </>
          ) : null}
          {atual !== 'todas' ? (
            <>
              {' '}
              com o sinal <b className="text-tinta">{ROTULO[atual]}</b>
            </>
          ) : null}
          .
        </p>
      ) : null}

      <Bloco>
        {visiveis.length === 0 ? (
          <Vazio
            titulo={linhas.length === 0 ? 'Nenhuma avaliação registrada' : 'Nada nestes filtros'}
            texto={
              linhas.length === 0
                ? 'As avaliações aparecem aqui assim que os votos começarem a entrar pelos QR das mesas.'
                : 'Nenhuma avaliação se encaixa na combinação escolhida. Abra "Filtros" e use "Limpar filtros" para ver a lista inteira.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-[14.5px]">
              <thead>
                <tr className="border-b border-risco bg-creme text-left">
                  <th className="px-5 py-2.5 font-semibold">Quando</th>
                  <th className="py-2.5 pr-3 font-semibold">Casa</th>
                  <th className="py-2.5 pr-3 font-semibold">CPF</th>
                  <th className="py-2.5 pr-3 font-semibold">IP</th>
                  <th
                    className="py-2.5 pr-3 font-semibold"
                    title="Apresentação · Sabor · Criatividade · Atendimento"
                  >
                    Notas
                  </th>
                  <th className="py-2.5 pr-3 font-semibold">Sinais</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((linha) => (
                  <LinhaDaAuditoria key={linha.id} linha={linha} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bloco>
    </div>
  )
}
