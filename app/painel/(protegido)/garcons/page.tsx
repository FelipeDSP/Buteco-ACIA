import Link from 'next/link'
import FotoPrato from '@/components/FotoPrato'
import { Bloco, Numero, Numeros, Selo, TopoDaTela, Vazio } from '@/components/painel/Peças'
import { lerGarcons, type GarconsDaCasa } from '@/lib/painel'

export const dynamic = 'force-dynamic'

/**
 * Avaliação de quem atendeu, em duas camadas como as observações: a grade das
 * casas e, ao clicar, a lista de uma casa só — por nome, com quantas notas e
 * qual a média.
 *
 * **Não entra na apuração.** Não é critério do regulamento; é devolutiva para
 * o estabelecimento saber quem está sendo bem avaliado. E **não há CPF, IP
 * nem hora aqui** porque a tabela `avaliacoes_garcom` não guarda nenhum dos
 * três — o nome é de terceiro e vai ser lido pelo dono da casa; ligá-lo a
 * quem escreveu é o que a separação existe para impedir.
 *
 * A lista mostra agregados por nome, não as notas uma a uma: a sequência de
 * notas em ordem de chegada reconstruiria quem passou pela casa.
 */
export default async function Garcons({
  searchParams,
}: {
  searchParams: Promise<{ casa?: string }>
}) {
  const { casa: slug } = await searchParams
  const casas = await lerGarcons()

  const escolhida = slug ? casas.find((c) => c.slug === slug) : undefined
  if (escolhida) return <UmaCasa casa={escolhida} />

  const total = casas.reduce((soma, c) => soma + c.total, 0)
  const comAlguma = casas.filter((c) => c.total > 0).length

  return (
    <div className="wrap">
      <TopoDaTela
        titulo="Garçons"
        sub="A nota que o cliente deu a quem o atendeu, com o nome que ele escreveu. Não é critério do regulamento e não entra em cálculo nenhum — nem na média, nem no desempate, nem no piso. Não há CPF, IP nem horário aqui porque nada disso é guardado junto: a avaliação do garçom não fica ligada ao voto nem a quem votou."
      />

      <Numeros>
        <Numero valor={total} rotulo="Avaliações de atendimento" tom="destaque" />
        <Numero
          valor={`${comAlguma}/${casas.length}`}
          rotulo="Casas que já receberam alguma"
          detalhe={
            comAlguma < casas.length
              ? `${casas.length - comAlguma} ainda sem nenhuma`
              : 'todas receberam'
          }
        />
      </Numeros>

      {casas.length === 0 ? (
        <div className="mt-7">
          <Bloco>
            <Vazio
              titulo="Nenhuma casa cadastrada"
              texto="A grade mostra uma casa por cartão. Cadastre as casas na aba Casas para elas aparecerem aqui."
            />
          </Bloco>
        </div>
      ) : (
        <div className="mt-7 grid gap-4 duas:grid-cols-2 media:grid-cols-3 ampla:grid-cols-4">
          {casas.map((casa) => (
            <Cartao key={casa.id} casa={casa} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Cartão da grade. Casa sem avaliação continua aqui, apagada e zerada. */
function Cartao({ casa }: { casa: GarconsDaCasa }) {
  const vazia = casa.total === 0
  const nomes = casa.garcons.length

  return (
    <Link
      href={`/painel/garcons?casa=${encodeURIComponent(casa.slug)}`}
      className={`group flex flex-col overflow-hidden rounded-2xl bg-claro transition-opacity ${
        vazia ? 'opacity-60 hover:opacity-100' : ''
      }`}
    >
      <FotoPrato
        src={casa.foto}
        prato={casa.prato}
        casa={casa.nome}
        className="aspect-[4/3] w-full"
        sizes="(max-width: 640px) 100vw, (max-width: 760px) 50vw, (max-width: 1280px) 33vw, 25vw"
      />

      <span className="flex flex-1 flex-col gap-1 p-4">
        <span className="font-display text-[17px] leading-tight font-extrabold group-hover:underline">
          {casa.prato}
        </span>
        <span className="text-[13.5px] text-tinta-3">{casa.nome}</span>

        <span className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <b className={`display text-[26px] ${vazia ? 'text-tinta-3' : 'text-marinho'}`}>
            {casa.total}
          </b>
          <span className="text-[13px] text-tinta-3">
            {casa.total === 1 ? 'avaliação' : 'avaliações'}
            {nomes > 0 ? ` · ${nomes} ${nomes === 1 ? 'nome' : 'nomes'}` : ''}
          </span>
        </span>

        {!casa.ativa ? (
          <span className="mt-1.5">
            <Selo titulo="Casa inativa no site">inativa</Selo>
          </span>
        ) : null}
      </span>
    </Link>
  )
}

/** Segunda camada: os nomes de uma casa só. */
function UmaCasa({ casa }: { casa: GarconsDaCasa }) {
  const quantas = casa.total === 1 ? '1 avaliação' : `${casa.total} avaliações`
  const media = (n: number) =>
    n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return (
    <div className="wrap">
      <p className="pt-2">
        <Link
          href="/painel/garcons"
          className="inline-block py-1.5 text-[14px] font-bold text-marinho underline underline-offset-2"
        >
          ← Todas as casas
        </Link>
      </p>

      <TopoDaTela
        titulo={casa.prato}
        sub={`${casa.nome} — ${quantas} de atendimento. Por nome: quantas notas e a média de 0 a 5. Sem CPF, sem IP e sem horário: nada disso é guardado junto.`}
      />

      <div className="mt-6 mb-6 flex flex-col gap-1 rounded-2xl bg-claro p-4">
        <a
          href={`/api/painel/garcons?casa=${encodeURIComponent(casa.slug)}`}
          className="btn btn-pequeno self-start"
        >
          CSV desta casa
        </a>
        <span className="max-w-[52ch] text-[12px] text-tinta-3">
          nome, quantas avaliações e média — sem data, sem hora e sem as notas uma a uma
        </span>
      </div>

      <Bloco>
        {casa.total === 0 ? (
          <Vazio
            titulo="Esta casa ainda não recebeu avaliação de atendimento"
            texto="O campo é opcional na tela de voto. Os nomes aparecem aqui conforme os clientes forem avaliando."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14.5px]">
              <thead>
                <tr className="border-b border-risco text-left text-[12.5px] font-bold tracking-[0.03em] text-tinta-3 uppercase">
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3 text-right">Avaliações</th>
                  <th className="px-5 py-3 text-right">Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-risco">
                {casa.garcons.map((g) => (
                  <tr key={g.nome}>
                    <td className="px-5 py-3.5">
                      <b className="font-display text-[15.5px] font-extrabold">{g.nome}</b>
                      {g.grafias.length > 0 ? (
                        <span className="mt-0.5 block text-[12.5px] text-tinta-3">
                          também escrito: {g.grafias.join(', ')}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">{g.avaliacoes}</td>
                    <td className="px-5 py-3.5 text-right font-display text-[17px] font-extrabold text-marinho tabular-nums">
                      {media(g.media)}
                      <span className="text-[12px] font-normal text-tinta-3"> / 5</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bloco>

      <p className="mt-6 max-w-[78ch] text-[12.5px] text-tinta-3">
        <b className="text-tinta">O nome é o que o cliente escreveu.</b> Grafias que diferem só em
        acento, maiúscula ou espaço são juntadas e listadas como &ldquo;também escrito&rdquo;;
        &ldquo;João&rdquo; e &ldquo;João Pedro&rdquo; ficam separados — quem sabe se são a mesma
        pessoa é a casa. Uma nota só não é média de nada: olhe o volume junto.
      </p>
    </div>
  )
}
