import Link from 'next/link'
import DesativarCasa from '@/components/painel/DesativarCasa'
import { listarCasasDoPainel } from '@/lib/painel'
import { situacaoDaCasa } from '@/lib/horarios'

export const dynamic = 'force-dynamic'

export default async function Casas() {
  const casas = await listarCasasDoPainel()
  const semHorario = casas.filter(
    (c) => c.ativa && situacaoDaCasa(c.horarios ?? {}).semCadastro,
  ).length

  return (
    <div className="wrap">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(24px,3vw,34px)]">Casas</h1>
          <p className="mt-2 text-[15px] text-tinta-3">
            {casas.filter((c) => c.ativa).length} ativas de {casas.length}.
          </p>
        </div>
        <Link href="/painel/casas/nova" className="btn btn-pequeno">
          Adicionar casa
        </Link>
      </div>

      {semHorario > 0 ? (
        <p className="mt-5 rounded-xl bg-ambar/20 px-4 py-3 text-[14px] font-semibold text-ambar-e">
          {semHorario} {semHorario === 1 ? 'casa ativa está' : 'casas ativas estão'} sem
          horário cadastrado. Enquanto estiverem, o QR aceita voto a qualquer hora —
          inclusive com a casa fechada.
        </p>
      ) : null}

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[14.5px]">
          <thead>
            <tr className="border-b-2 border-risco text-left">
              <th className="py-2.5 pr-3 font-semibold">Casa</th>
              <th className="py-2.5 pr-3 font-semibold">Prato</th>
              <th className="py-2.5 pr-3 font-semibold">Bairro</th>
              <th className="py-2.5 pr-3 font-semibold">Horário</th>
              <th className="py-2.5 pr-3 text-right font-semibold">Avaliações</th>
              <th className="py-2.5 text-right font-semibold">Ação</th>
            </tr>
          </thead>
          <tbody>
            {casas.map((casa) => {
              const situacao = situacaoDaCasa(casa.horarios ?? {})
              return (
                <tr key={casa.id} className={`border-b border-risco ${casa.ativa ? '' : 'opacity-55'}`}>
                  <td className="py-3 pr-3">
                    <Link href={`/painel/casas/${casa.id}`} className="font-semibold hover:underline">
                      {casa.nome}
                    </Link>
                    <span className="block font-mono text-[12px] text-tinta-3">/{casa.slug}</span>
                  </td>
                  <td className="py-3 pr-3">
                    {casa.prato ?? '—'}
                    {!casa.prato_confirmado ? (
                      <span className="ml-1.5 rounded-full bg-creme px-2 py-0.5 text-[11px] font-bold text-tinta-3">
                        a confirmar
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 text-tinta-3">{casa.bairro || '—'}</td>
                  <td className="py-3 pr-3">
                    {situacao.semCadastro ? (
                      <span className="rounded-full bg-ambar/25 px-2.5 py-0.5 text-[11.5px] font-bold text-ambar-e">
                        sem cadastro
                      </span>
                    ) : (
                      <span className="text-[13px] text-tinta-3">cadastrado</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right">{casa.avaliacoes}</td>
                  <td className="py-3 text-right">
                    <DesativarCasa
                      id={casa.id}
                      nome={casa.nome}
                      ativa={casa.ativa}
                      avaliacoes={casa.avaliacoes}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
