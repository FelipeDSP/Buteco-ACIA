import LinhaDaAuditoria from '@/components/painel/LinhaDaAuditoria'
import { auditar } from '@/lib/painel'

export const dynamic = 'force-dynamic'

export default async function Auditoria() {
  const linhas = await auditar()
  const suspeitas = linhas.filter((l) => l.anomalias.length > 0 && !l.anulada)
  const anuladas = linhas.filter((l) => l.anulada)

  return (
    <div className="wrap">
      <h1 className="display text-[clamp(24px,3vw,34px)]">Auditoria</h1>
      <p className="mt-2 max-w-[74ch] text-[15px] text-tinta-3">
        {linhas.length} {linhas.length === 1 ? 'avaliação' : 'avaliações'} ·{' '}
        {suspeitas.length} com sinal de anomalia · {anuladas.length} anuladas. O CPF
        não aparece aqui nem em lugar nenhum: ele nunca foi gravado, só o hash.
      </p>

      <p className="mt-4 max-w-[74ch] rounded-xl bg-creme px-4 py-3 text-[13.5px] text-tinta-3">
        Sinal de anomalia é pista, não prova. O wi-fi do próprio bar faz clientes
        honestos dividirem o mesmo IP, e mesa cheia gera rajada legítima. Olhe o
        conjunto antes de anular — e escreva o motivo, porque a casa afetada pode
        perguntar.
      </p>

      {linhas.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-creme px-6 py-10 text-center text-[15.5px] text-tinta-3">
          Nenhuma avaliação registrada ainda.
        </p>
      ) : (
        <div className="mt-7 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-[14.5px]">
            <thead>
              <tr className="border-b-2 border-risco text-left">
                <th className="py-2.5 pr-3 font-semibold">Quando</th>
                <th className="py-2.5 pr-3 font-semibold">Casa</th>
                <th className="py-2.5 pr-3 font-semibold">IP</th>
                <th className="py-2.5 pr-3 font-semibold" title="Apresentação · Sabor · Criatividade · Atendimento">
                  Notas
                </th>
                <th className="py-2.5 pr-3 font-semibold">Sinais</th>
                <th className="py-2.5 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <LinhaDaAuditoria key={linha.id} linha={linha} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
