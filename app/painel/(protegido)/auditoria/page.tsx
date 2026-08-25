import LinhaDaAuditoria from '@/components/painel/LinhaDaAuditoria'
import { Bloco, Filtros, Numero, Numeros, TopoDaTela, Vazio } from '@/components/painel/Peças'
import { auditar, type Anomalia } from '@/lib/painel'

export const dynamic = 'force-dynamic'

const FILTROS = ['todas', 'anomalias', 'ip-repetido', 'rajada', 'fora-de-horario', 'anuladas'] as const
type Filtro = (typeof FILTROS)[number]

const ROTULO: Record<Filtro, string> = {
  todas: 'Todas',
  anomalias: 'Com sinal',
  'ip-repetido': 'IP repetido',
  rajada: 'Rajada',
  'fora-de-horario': 'Fora de horário',
  anuladas: 'Anuladas',
}

export default async function Auditoria({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>
}) {
  const { ver } = await searchParams
  const linhas = await auditar()

  const combina = (linha: (typeof linhas)[number], filtro: Filtro) => {
    if (filtro === 'todas') return true
    if (filtro === 'anuladas') return linha.anulada
    if (filtro === 'anomalias') return linha.anomalias.length > 0
    return linha.anomalias.includes(filtro as Anomalia)
  }

  // Parâmetro inventado cai para "todas", como no resto do site.
  const atual: Filtro = FILTROS.includes(ver as Filtro) ? (ver as Filtro) : 'todas'
  const visiveis = linhas.filter((l) => combina(l, atual))

  const quantos = (f: Filtro) => linhas.filter((l) => combina(l, f)).length
  const comSinal = quantos('anomalias')
  const ipsDistintos = new Set(linhas.map((l) => l.ip).filter(Boolean)).size

  return (
    <div className="wrap">
      <TopoDaTela
        titulo="Auditoria"
        sub="O CPF não aparece aqui nem em lugar nenhum: ele nunca foi gravado, só o HMAC. Sinal de anomalia é pista, não prova — o wi-fi do próprio bar faz clientes honestos dividirem IP, e mesa cheia gera rajada legítima."
      />

      <Numeros>
        <Numero valor={linhas.length} rotulo="Avaliações" tom="destaque" />
        <Numero
          valor={comSinal}
          rotulo="Com sinal"
          tom={comSinal > 0 ? 'alerta' : 'neutro'}
          detalhe={linhas.length > 0 ? `${Math.round((comSinal / linhas.length) * 100)}% do total` : undefined}
        />
        <Numero valor={ipsDistintos} rotulo="IPs distintos" />
        <Numero valor={quantos('anuladas')} rotulo="Anuladas" />
      </Numeros>

      <div className="mt-7 mb-4">
        <Filtros
          base="/painel/auditoria"
          atual={atual}
          opcoes={FILTROS.map((f) => ({ valor: f, rotulo: ROTULO[f], quantos: quantos(f) }))}
        />
      </div>

      <Bloco>
        {visiveis.length === 0 ? (
          <Vazio
            titulo={linhas.length === 0 ? 'Nenhuma avaliação registrada' : 'Nada neste filtro'}
            texto={
              linhas.length === 0
                ? 'As avaliações aparecem aqui assim que os votos começarem a entrar pelos QR das mesas.'
                : 'Nenhuma avaliação se encaixa no filtro escolhido. Volte para "Todas" para ver a lista inteira.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-[14.5px]">
              <thead>
                <tr className="border-b border-risco bg-creme text-left">
                  <th className="px-5 py-2.5 font-semibold">Quando</th>
                  <th className="py-2.5 pr-3 font-semibold">Casa</th>
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
