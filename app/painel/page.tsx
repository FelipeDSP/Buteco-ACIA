import Link from 'next/link'
import { CRITERIOS_DA_APURACAO, apurar } from '@/lib/painel'

export const dynamic = 'force-dynamic'

const nota = (v: number | null) => (v === null ? '—' : v.toFixed(2).replace('.', ','))

export default async function Apuracao() {
  const linhas = await apurar()
  const totalDeVotos = linhas.reduce((s, l) => s + l.avaliacoes, 0)
  const anuladas = linhas.reduce((s, l) => s + l.anuladas, 0)

  return (
    <div className="wrap">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(24px,3vw,34px)]">Apuração</h1>
          <p className="mt-2 text-[15px] text-tinta-3">
            {totalDeVotos} {totalDeVotos === 1 ? 'avaliação válida' : 'avaliações válidas'}
            {anuladas > 0 ? ` · ${anuladas} anulada${anuladas === 1 ? '' : 's'} fora da conta` : ''}.
            Média das quatro notas, por avaliação.
          </p>
        </div>
        <a href="/api/painel/csv" className="btn btn-pequeno">
          Exportar CSV
        </a>
      </div>

      {totalDeVotos === 0 ? (
        <p className="mt-8 rounded-2xl bg-creme px-6 py-10 text-center text-[15.5px] text-tinta-3">
          Nenhuma avaliação ainda. A tabela se preenche sozinha quando os votos começarem.
        </p>
      ) : null}

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[14.5px]">
          <thead>
            <tr className="border-b-2 border-risco text-left">
              <th className="py-2.5 pr-3 font-semibold">#</th>
              <th className="py-2.5 pr-3 font-semibold">Casa</th>
              <th className="py-2.5 pr-3 text-right font-semibold">Média</th>
              {CRITERIOS_DA_APURACAO.map((c) => (
                <th key={c.chave} className="py-2.5 pr-3 text-right font-semibold text-tinta-3">
                  {c.nome}
                </th>
              ))}
              <th className="py-2.5 text-right font-semibold">Avaliações</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.slug} className="border-b border-risco">
                <td className="py-3 pr-3 font-display font-extrabold text-tinta-3">
                  {linha.mediaGeral === null ? '—' : linha.posicao}
                </td>
                <td className="py-3 pr-3">
                  <Link href={`/casas/${linha.slug}`} className="font-semibold hover:underline">
                    {linha.nome}
                  </Link>
                  {!linha.ativa ? (
                    <span className="ml-2 rounded-full bg-creme px-2 py-0.5 text-[11.5px] font-bold text-tinta-3">
                      inativa
                    </span>
                  ) : null}
                </td>
                <td className="py-3 pr-3 text-right font-display text-[17px] font-extrabold">
                  {nota(linha.mediaGeral)}
                </td>
                {CRITERIOS_DA_APURACAO.map((c) => (
                  <td key={c.chave} className="py-3 pr-3 text-right text-tinta-3">
                    {nota(linha.medias[c.chave])}
                  </td>
                ))}
                <td className="py-3 text-right">
                  {linha.avaliacoes}
                  {linha.anuladas > 0 ? (
                    <span className="text-[12.5px] text-tinta-3"> (+{linha.anuladas} anul.)</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 max-w-[70ch] text-[13.5px] text-tinta-3">
        Empate resolve na ordem do regulamento: maior média em sabor, depois em
        criatividade, depois maior número de avaliações. Casa sem avaliação não
        recebe posição.
      </p>
    </div>
  )
}
