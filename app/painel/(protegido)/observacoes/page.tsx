import Link from 'next/link'
import { Bloco, Filtros, Numero, Numeros, Selo, TopoDaTela, Vazio } from '@/components/painel/Peças'
import { auditar, listarCasasDoPainel } from '@/lib/painel'

export const dynamic = 'force-dynamic'

/**
 * Observações deixadas por quem votou.
 *
 * O CPF nunca aparece aqui — nem o hash. A observação é devolutiva para a
 * casa, e ligar texto a identificador seria justamente o que a tela de voto
 * promete que não acontece.
 */
export default async function Observacoes({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>
}) {
  const { ver } = await searchParams
  const todas = (await auditar()).filter((l) => l.comentario)
  const casas = await listarCasasDoPainel()

  const slugsValidos = new Set(casas.map((c) => c.slug))
  const casaAtiva = ver && slugsValidos.has(ver) ? ver : 'todas'

  const visiveis = (
    casaAtiva === 'todas' ? todas : todas.filter((l) => l.casaSlug === casaAtiva)
  )
    // Da mais recente para a mais antiga.
    .sort((a, b) => Date.parse(b.quando) - Date.parse(a.quando))

  const opcoes = [
    { valor: 'todas', rotulo: 'Todas as casas', quantos: todas.length },
    ...casas
      .map((c) => ({
        valor: c.slug,
        rotulo: c.nome,
        quantos: todas.filter((l) => l.casaSlug === c.slug).length,
      }))
      .filter((o) => o.quantos > 0),
  ]

  const anuladas = visiveis.filter((l) => l.anulada).length
  const query = casaAtiva === 'todas' ? '' : `?casa=${encodeURIComponent(casaAtiva)}`
  const juntar = (extra: string) => (query ? `${query}&${extra}` : `?${extra}`)

  return (
    <div className="wrap">
      <TopoDaTela
        titulo="Observações"
        sub="O que quem votou escreveu. Não entra em cálculo nenhum — nem na média, nem no desempate, nem no piso — e não aparece em nenhuma página pública. O CPF não é mostrado aqui porque nunca foi gravado."
      />

      <Numeros>
        <Numero valor={todas.length} rotulo="Observações no total" tom="destaque" />
        <Numero
          valor={casaAtiva === 'todas' ? opcoes.length - 1 : 1}
          rotulo="Casas com observação"
        />
        <Numero valor={visiveis.length} rotulo="No filtro atual" />
        <Numero
          valor={anuladas}
          rotulo="De avaliação anulada"
          tom={anuladas > 0 ? 'alerta' : 'neutro'}
          detalhe={anuladas > 0 ? 'fora dos dois CSV' : undefined}
        />
      </Numeros>

      <div className="mt-7 mb-4">
        <Filtros base="/painel/observacoes" atual={casaAtiva} opcoes={opcoes} />
      </div>

      {/* Dois botões, dois destinos. O rótulo diz para quem é cada arquivo,
          porque exportar o errado é o tipo de engano que não dá para desfazer:
          o dono já leu. */}
      <div className="mb-6 flex flex-wrap gap-3 rounded-2xl bg-claro p-4">
        <span className="flex flex-col gap-1">
          <a href={`/api/painel/observacoes${query}`} className="btn btn-pequeno btn-linha">
            CSV interno (ACIA)
          </a>
          <span className="text-[12px] text-tinta-3">data, hora, casa e texto</span>
        </span>

        <span className="flex flex-col gap-1">
          <a
            href={`/api/painel/observacoes${juntar('modo=estabelecimento')}`}
            className="btn btn-pequeno"
          >
            CSV para o estabelecimento
          </a>
          <span className="max-w-[42ch] text-[12px] text-tinta-3">
            só o texto, sem data nem hora e em ordem embaralhada — data e hora deixariam o dono
            cruzar com a comanda e descobrir quem escreveu
          </span>
        </span>
      </div>

      <Bloco>
        {visiveis.length === 0 ? (
          <Vazio
            titulo={todas.length === 0 ? 'Nenhuma observação ainda' : 'Nada nesta casa'}
            texto={
              todas.length === 0
                ? 'O campo é opcional na tela de voto. As observações aparecem aqui conforme forem escritas.'
                : 'Esta casa ainda não recebeu observação. Escolha outra no filtro acima.'
            }
          />
        ) : (
          <ul className="divide-y divide-risco">
            {visiveis.map((linha) => (
              <li key={linha.id} className={`p-5 ${linha.anulada ? 'opacity-55' : ''}`}>
                <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                  <span className="text-tinta-3">
                    {new Date(linha.quando).toLocaleString('pt-BR', {
                      timeZone: 'America/Porto_Velho',
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <Link href="/painel/casas" className="font-semibold hover:underline">
                    {linha.casa}
                  </Link>
                  {linha.comentariosIguais > 1 ? (
                    <Selo
                      tom="alerta"
                      titulo="Texto idêntico em mais de uma avaliação desta casa"
                    >
                      repetido {linha.comentariosIguais}×
                    </Selo>
                  ) : null}
                  {linha.anulada ? <Selo>avaliação anulada</Selo> : null}
                </div>
                <p className="text-[15px] whitespace-pre-wrap">{linha.comentario}</p>
              </li>
            ))}
          </ul>
        )}
      </Bloco>
    </div>
  )
}
