import Link from 'next/link'
import FotoPrato from '@/components/FotoPrato'
import { Bloco, Numero, Numeros, Selo, TopoDaTela, Vazio } from '@/components/painel/Peças'
import { lerObservacoes, limiares, type ObservacoesDaCasa } from '@/lib/painel'

export const dynamic = 'force-dynamic'

/**
 * Observações de quem votou, em duas camadas: a grade das casas e, ao clicar,
 * a lista de uma casa só.
 *
 * **Não há CPF, não há IP e não há hora nesta tela — e não é omissão de
 * interface: a tabela `observacoes` não guarda nenhum dos três.** O texto
 * deixou de ser coluna da avaliação justamente para que a aba Auditoria, que
 * mostra o CPF inteiro, não pudesse ser cruzada com esta.
 *
 * A lista de uma casa sai sempre embaralhada, nunca em ordem de chegada. Só
 * tirar o horário não bastaria: a sequência cronológica sozinha já reconstrói
 * quem passou pela casa, e bastaria alinhá-la com a auditoria para devolver o
 * vínculo que a separação desfez.
 *
 * A navegação entre as duas camadas é por parâmetro de URL, como no resto do
 * site: funciona sem JS, é compartilhável, e slug inventado cai na grade.
 */
export default async function Observacoes({
  searchParams,
}: {
  searchParams: Promise<{ casa?: string }>
}) {
  const { casa: slug } = await searchParams
  const casas = await lerObservacoes()
  const limites = limiares()

  const escolhida = slug ? casas.find((c) => c.slug === slug) : undefined
  if (escolhida) return <UmaCasa casa={escolhida} limiar={limites.comentariosIguais} />

  const total = casas.reduce((soma, c) => soma + c.total, 0)
  const comAlguma = casas.filter((c) => c.total > 0).length

  return (
    <div className="wrap">
      <TopoDaTela
        titulo="Observações"
        sub="O que quem votou escreveu, por casa. Não entra em cálculo nenhum — nem na média, nem no desempate, nem no piso — e não aparece em nenhuma página pública. Não há CPF, IP nem horário aqui porque nada disso é guardado junto do texto: a observação não fica ligada à avaliação nem a quem escreveu."
      />

      <Numeros>
        <Numero valor={total} rotulo="Observações no total" tom="destaque" />
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

/**
 * Cartão da grade. **Casa com zero observações aparece igual às outras**, só
 * mais apagada e com o número zerado — sumir daria a impressão de que a tela
 * não carregou, e a ACIA ficaria sem saber se a casa não recebeu nada ou se
 * faltou dado.
 */
function Cartao({ casa }: { casa: ObservacoesDaCasa }) {
  const vazia = casa.total === 0

  return (
    <Link
      href={`/painel/observacoes?casa=${encodeURIComponent(casa.slug)}`}
      className={`group flex flex-col overflow-hidden rounded-2xl bg-claro transition-opacity ${
        vazia ? 'opacity-60 hover:opacity-100' : ''
      }`}
    >
      {/* O mesmo componente de foto dos cartões do site, com o mesmo
          placeholder — o prato sem foto se declara vazio em vez de fingir. */}
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
            {casa.total === 1 ? 'observação' : 'observações'}
          </span>
        </span>

        <span className="mt-1.5 flex flex-wrap gap-1.5">
          {casa.repetidas > 0 ? (
            <Selo tom="alerta" titulo="Texto idêntico repetido dentro desta casa">
              texto repetido
            </Selo>
          ) : null}
          {!casa.ativa ? <Selo titulo="Casa inativa no site">inativa</Selo> : null}
        </span>
      </span>
    </Link>
  )
}

/** Segunda camada: a lista de uma casa só. */
function UmaCasa({ casa, limiar }: { casa: ObservacoesDaCasa; limiar: number }) {
  // `dia` é `AAAA-MM-DD`. Formatar na mão, e não com `new Date`, evita o
  // deslocamento de fuso que jogaria a data para o dia anterior.
  const diaCurto = (dia: string) => {
    const [, mes, d] = dia.split('-')
    return d && mes ? `${d}/${mes}` : dia
  }

  const quantas = casa.total === 1 ? '1 observação' : `${casa.total} observações`

  return (
    <div className="wrap">
      <p className="pt-2">
        <Link
          href="/painel/observacoes"
          className="inline-block py-1.5 text-[14px] font-bold text-marinho underline underline-offset-2"
        >
          ← Todas as casas
        </Link>
      </p>

      <TopoDaTela
        titulo={casa.prato}
        sub={`${casa.nome} — ${quantas}. Sem CPF, sem IP e sem horário: nada disso é guardado junto do texto. A ordem abaixo é embaralhada de propósito.`}
      />

      {/* Uma exportação por casa, porque é para a casa que ela vai. Só o texto,
          embaralhado: sem data, sem hora e sem ordem de chegada, o dono não
          tem como cruzar com a comanda. */}
      <div className="mt-6 mb-6 flex flex-col gap-1 rounded-2xl bg-claro p-4">
        <a
          href={`/api/painel/observacoes?casa=${encodeURIComponent(casa.slug)}`}
          className="btn btn-pequeno self-start"
        >
          CSV desta casa
        </a>
        <span className="max-w-[52ch] text-[12px] text-tinta-3">
          só o texto, embaralhado — sem data, sem hora e sem ordem de chegada
        </span>
      </div>

      <Bloco>
        {casa.total === 0 ? (
          <Vazio
            titulo="Esta casa ainda não recebeu observação"
            texto="O campo é opcional na tela de voto. As observações aparecem aqui conforme forem escritas."
          />
        ) : (
          <ul className="divide-y divide-risco">
            {casa.itens.map((item) => (
              <li key={item.id} className="p-5">
                <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                  <span className="text-tinta-3">{diaCurto(item.dia)}</span>
                  {item.repetida ? (
                    <Selo tom="alerta" titulo="Texto idêntico em outras observações desta casa">
                      repetido {item.iguais}×
                    </Selo>
                  ) : null}
                </div>
                <p className="text-[15px] whitespace-pre-wrap">{item.texto}</p>
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      <p className="mt-6 max-w-[78ch] text-[12.5px] text-tinta-3">
        <b className="text-tinta">Texto repetido é pista, não prova.</b> Duas pessoas escrevem
        &ldquo;muito bom&rdquo; no mesmo dia sem combinar nada — por isso o limiar é {limiar} e
        não dois, e a comparação ignora acento, maiúscula e espaço sobrando. O sinal é por casa: o
        mesmo texto em casas diferentes não acende. Ajustável por{' '}
        <code className="font-mono">PAINEL_LIMIAR_COMENTARIO_IGUAL</code>, sem novo deploy.
      </p>
    </div>
  )
}
