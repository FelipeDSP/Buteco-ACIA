import Link from 'next/link'
import { Bloco, Numero, Numeros, Selo, TopoDaTela, Vazio } from '@/components/painel/Peças'
import { CRITERIOS_DA_APURACAO, apurar } from '@/lib/painel'

export const dynamic = 'force-dynamic'

const nota = (v: number | null) => (v === null ? '—' : v.toFixed(2).replace('.', ','))

/** Proporção da média sobre o máximo, para comparar de relance. */
const proporcao = (v: number | null) => (v === null ? 0 : Math.max(0, Math.min(1, v / 5)))

export default async function Apuracao() {
  const linhas = await apurar()
  const votos = linhas.reduce((s, l) => s + l.avaliacoes, 0)
  const anuladas = linhas.reduce((s, l) => s + l.anuladas, 0)
  const comVoto = linhas.filter((l) => l.avaliacoes > 0)
  const mediaDoFestival =
    comVoto.length === 0
      ? null
      : comVoto.reduce((s, l) => s + (l.mediaGeral ?? 0) * l.avaliacoes, 0) / votos

  const podio = linhas.filter((l) => l.mediaGeral !== null).slice(0, 3)

  return (
    <div className="wrap">
      <TopoDaTela
        titulo="Apuração"
        sub="Média das quatro notas, por avaliação. Avaliação anulada não entra em conta nenhuma. Empate resolve na ordem do regulamento: sabor, criatividade, número de avaliações."
        acao={
          <a href="/api/painel/csv" className="btn btn-pequeno">
            Exportar CSV
          </a>
        }
      />

      <Numeros>
        <Numero valor={votos} rotulo="Avaliações válidas" tom="destaque" />
        <Numero
          valor={`${comVoto.length}/${linhas.length}`}
          rotulo="Casas com voto"
          detalhe={comVoto.length < linhas.length ? `${linhas.length - comVoto.length} ainda sem` : undefined}
        />
        <Numero valor={nota(mediaDoFestival)} rotulo="Média do festival" />
        <Numero
          valor={anuladas}
          rotulo="Anuladas"
          tom={anuladas > 0 ? 'alerta' : 'neutro'}
          detalhe={anuladas > 0 ? 'fora da conta' : undefined}
        />
      </Numeros>

      {podio.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-[15px] font-extrabold">Parcial</h2>
          <div className="grid gap-3 media:grid-cols-3">
            {podio.map((linha) => (
              <div
                key={linha.slug}
                className={`rounded-2xl px-5 py-4 ${
                  linha.posicao === 1 ? 'bg-marinho text-branco' : 'bg-claro'
                }`}
              >
                <span
                  className={`font-display text-[13px] font-extrabold ${
                    linha.posicao === 1 ? 'text-ouro' : 'text-tinta-3'
                  }`}
                >
                  {linha.posicao}º lugar
                </span>
                <b className="mt-1 block font-display text-[19px] leading-tight font-extrabold">
                  {linha.nome}
                </b>
                <span
                  className={`mt-2 flex items-baseline gap-2 ${
                    linha.posicao === 1 ? 'text-selo' : 'text-tinta-3'
                  }`}
                >
                  <b
                    className={`font-display text-[26px] leading-none font-extrabold ${
                      linha.posicao === 1 ? 'text-branco' : 'text-tinta'
                    }`}
                  >
                    {nota(linha.mediaGeral)}
                  </b>
                  <span className="text-[13px]">
                    em {linha.avaliacoes} {linha.avaliacoes === 1 ? 'avaliação' : 'avaliações'}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-tinta-3">
            Parcial interna. O resultado só é público na premiação — nem as casas veem
            nota ou posição antes disso.
          </p>
        </div>
      ) : null}

      <Bloco titulo="Todas as casas" className="mt-8">
        {votos === 0 ? (
          <Vazio
            titulo="Nenhuma avaliação ainda"
            texto="A tabela se preenche sozinha quando os votos começarem a entrar pelos QR das mesas."
          />
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-[14.5px]">
            <thead>
              <tr className="border-b border-risco bg-creme text-left">
                <th className="px-5 py-2.5 font-semibold">#</th>
                <th className="py-2.5 pr-3 font-semibold">Casa</th>
                <th className="py-2.5 pr-3 font-semibold">Média</th>
                {CRITERIOS_DA_APURACAO.map((c) => (
                  <th key={c.chave} className="py-2.5 pr-3 text-right font-semibold text-tinta-3">
                    {c.nome}
                  </th>
                ))}
                <th className="px-5 py-2.5 text-right font-semibold">Avaliações</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha, i) => (
                <tr
                  key={linha.slug}
                  className={`border-b border-risco last:border-0 ${i % 2 === 1 ? 'bg-creme/40' : ''}`}
                >
                  <td className="px-5 py-3">
                    {linha.mediaGeral === null ? (
                      <span className="text-tinta-3">—</span>
                    ) : (
                      <span
                        className={`inline-grid size-7 place-content-center rounded-full font-display text-[13px] font-extrabold ${
                          linha.posicao <= 3 ? 'bg-marinho text-branco' : 'bg-creme text-tinta-3'
                        }`}
                      >
                        {linha.posicao}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <Link href={`/painel/casas`} className="font-semibold hover:underline">
                      {linha.nome}
                    </Link>
                    {!linha.ativa ? (
                      <span className="ml-2">
                        <Selo>inativa</Selo>
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3">
                    <span className="flex items-center gap-2.5">
                      <b className="w-[42px] font-display text-[16px] font-extrabold">
                        {nota(linha.mediaGeral)}
                      </b>
                      {/* Barra para comparar de relance, sem ler número por número. */}
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-[70px] overflow-hidden rounded-full bg-creme"
                      >
                        <span
                          className="block h-full rounded-full bg-marinho"
                          style={{ width: `${proporcao(linha.mediaGeral) * 100}%` }}
                        />
                      </span>
                    </span>
                  </td>
                  {CRITERIOS_DA_APURACAO.map((c) => (
                    <td key={c.chave} className="py-3 pr-3 text-right text-tinta-3">
                      {nota(linha.medias[c.chave])}
                    </td>
                  ))}
                  <td className="px-5 py-3 text-right">
                    <b>{linha.avaliacoes}</b>
                    {linha.anuladas > 0 ? (
                      <span className="ml-1.5">
                        <Selo tom="alerta" titulo="Anuladas, fora da média">
                          +{linha.anuladas}
                        </Selo>
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloco>
    </div>
  )
}
