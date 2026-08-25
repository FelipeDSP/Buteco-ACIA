import type { Metadata } from 'next'
import Link from 'next/link'
import CapaInterna from '@/components/CapaInterna'
import { TituloSecao } from '@/components/Secao'
import { Espiga, Limao } from '@/components/Ornamentos'
import {
  CALENDARIO,
  EDICAO,
  CRITERIOS,
  DESEMPATE,
  NOTA_MAXIMA_POR_CRITERIO,
  NOTA_MAXIMA_TOTAL,
  PISO_MINIMO_PERCENTUAL,
  PREMIACAO,
} from '@/lib/dados'
import { dataLonga, reais } from '@/lib/formato'

export const metadata: Metadata = {
  title: 'Como se vota',
  description:
    'Quatro critérios, nota de 0 a 5 em cada, 20 pontos no total. Passo a passo da avaliação, apuração, desempate e premiação do Boteco ACIA.',
}

const PASSOS = [
  {
    titulo: 'Peça o prato da disputa',
    texto:
      'Cada casa inscreveu um prato só. É esse prato que entra na avaliação — o resto do cardápio não conta.',
  },
  {
    titulo: 'Aponte a câmera para o QR da mesa',
    texto:
      'O QR code abre a página de avaliação daquela casa no seu navegador. Não há aplicativo para baixar nem cadastro para criar.',
  },
  {
    titulo: 'Dê nota de 0 a 5 em quatro critérios',
    texto:
      'Apresentação visual, sabor, criatividade e atendimento. Os quatro têm o mesmo peso.',
  },
  {
    titulo: 'Confirme e siga o roteiro',
    texto:
      'Uma avaliação por pessoa em cada casa. Você pode avaliar todas as casas que visitar.',
  },
]

const CALENDARIO_ITENS = [
  {
    quando: `${dataLonga(CALENDARIO.inicioFestival)} a ${dataLonga(CALENDARIO.fimFestival)}`,
    o_que: 'Festival ativo',
    detalhe: 'As casas servem o prato da disputa e o público avalia.',
  },
  {
    quando: `${dataLonga(CALENDARIO.inicioApuracao)} a ${dataLonga(CALENDARIO.fimApuracao)}`,
    o_que: 'Apuração',
    detalhe: 'As avaliações válidas são contadas e as médias, calculadas.',
  },
  {
    quando: '2ª quinzena de outubro',
    o_que: 'Premiação',
    detalhe: 'Entrega dos prêmios, placas e certificados.',
  },
]

export default function ComoSeVota() {
  return (
    <>
      <CapaInterna
        atual="Como se vota"
        selo="Regras oficiais"
        titulo="Como se vota"
        sub="Quem decide o vencedor é quem come. Abaixo, o passo a passo da avaliação e as regras de apuração desta edição."
        nota={`Válido para a ${EDICAO.ordinal} · ${dataLonga(CALENDARIO.inicioFestival)} a ${dataLonga(CALENDARIO.fimFestival)} de ${EDICAO.ano}`}
      />

      {/* ---------- Passo a passo ---------- */}
      <section className="relative overflow-hidden py-14">
        <Espiga
          style={{ left: -68, top: 40, width: 200, opacity: 0.5 }}
          className="text-ambar"
        />
        <div className="wrap">
          <h2 className="display text-[clamp(22px,2.8vw,32px)]">Passo a passo</h2>
          <ol className="mt-7 grid gap-3.5 sm:grid-cols-2">
            {PASSOS.map((passo, i) => (
              <li key={passo.titulo} className="revela rounded-2xl bg-claro p-6">
                <span className="grid size-9 place-content-center rounded-full bg-marinho font-display text-[16px] font-extrabold text-branco">
                  {i + 1}
                </span>
                <h3 className="mt-3.5 font-display text-[19px] leading-tight font-bold">
                  {passo.titulo}
                </h3>
                <p className="mt-1.5 text-[15px] text-tinta-3">{passo.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Critérios ---------- */}
      <section className="bg-creme py-14">
        <div className="wrap">
          <TituloSecao
            rotulo={`${CRITERIOS.length} critérios, peso igual`}
            titulo="O que se avalia"
            sub={`Cada critério recebe nota de 0 a ${NOTA_MAXIMA_POR_CRITERIO}. Somados, dão ${NOTA_MAXIMA_TOTAL} pontos por avaliação.`}
          />

          <ul className="mt-8 grid gap-3.5 sm:grid-cols-2">
            {CRITERIOS.map((c) => (
              <li key={c.chave} className="revela rounded-2xl bg-claro p-6">
                <span className="rotulo text-[12.5px]">
                  0 a {NOTA_MAXIMA_POR_CRITERIO}
                </span>
                <h3 className="mt-3 font-display text-[20px] leading-tight font-bold">
                  {c.nome}
                </h3>
                <p className="mt-1.5 text-[15px] text-tinta-3">{c.descricao}</p>
              </li>
            ))}
          </ul>

          <p className="revela mt-6 flex flex-wrap items-center gap-5 rounded-2xl bg-marinho px-7 py-6 text-[15px] text-selo">
            <b className="font-display text-[28px] leading-none font-extrabold text-ouro">
              {NOTA_MAXIMA_TOTAL} pontos
            </b>
            <span className="min-w-[220px] flex-1">
              Total máximo de uma avaliação. Nenhum critério vale mais que outro.
            </span>
          </p>
        </div>
      </section>

      {/* ---------- Apuração ---------- */}
      <section className="relative overflow-hidden py-14">
        <Limao
          style={{ left: -34, bottom: 30, width: 130, opacity: 0.55 }}
          className="text-ambar"
          miolo="var(--color-branco)"
        />
        <div className="wrap">
          <TituloSecao rotulo="Depois do festival" titulo="Como se apura" />

          <div className="mt-7 grid gap-3.5 larga:grid-cols-3">
            <div className="revela rounded-2xl bg-claro p-6">
              <h3 className="font-display text-[19px] font-bold">Nota final</h3>
              <p className="mt-2 text-[15px] text-tinta-3">
                Média aritmética simples de todas as avaliações válidas recebidas
                pela casa. Casa com mais avaliações não ganha vantagem por
                volume.
              </p>
            </div>

            <div className="revela rounded-2xl bg-claro p-6">
              <h3 className="font-display text-[19px] font-bold">Desempate</h3>
              <ol className="mt-2 flex flex-col gap-1.5 text-[15px] text-tinta-3">
                {DESEMPATE.map((regra, i) => (
                  <li key={regra} className="flex gap-2">
                    <span className="font-bold text-ambar-e">{i + 1}.</span>
                    {regra}
                  </li>
                ))}
              </ol>
            </div>

            <div className="revela rounded-2xl bg-claro p-6">
              <h3 className="font-display text-[19px] font-bold">
                Piso mínimo
              </h3>
              <p className="mt-2 text-[15px] text-tinta-3">
                Para concorrer à premiação, a casa precisa de pelo menos{' '}
                <b className="font-semibold text-tinta">
                  {PISO_MINIMO_PERCENTUAL}% da média
                </b>{' '}
                de avaliações por estabelecimento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Premiação ---------- */}
      <section className="bg-marinho py-14 text-branco">
        <div className="wrap">
          <TituloSecao
            claro
            rotulo="No fim da conta"
            titulo="Premiação"
            sub="Todas as casas participantes recebem placa e certificado. As três primeiras colocadas recebem também prêmio em dinheiro."
          />

          <ul className="mt-8 grid gap-3.5 media:grid-cols-3">
            {PREMIACAO.map((premio) => (
              <li
                key={premio.posicao}
                className="revela rounded-2xl bg-marinho-2 p-6 ring-1 ring-ouro/25"
              >
                <span className="rotulo text-[12.5px]">{premio.posicao}</span>
                <b className="mt-3.5 block font-display text-[34px] leading-none font-extrabold text-ouro">
                  {premio.valor === null ? '—' : reais(premio.valor)}
                </b>
                <p className="mt-2 text-[15px] text-selo">{premio.extra}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Calendário ---------- */}
      <section className="py-14">
        <div className="wrap">
          <TituloSecao rotulo="Datas" titulo="Calendário" />

          <ul className="mt-7 flex flex-col gap-2.5">
            {CALENDARIO_ITENS.map((item) => (
              <li
                key={item.o_que}
                className="revela grid gap-1 rounded-2xl bg-claro p-6 media:grid-cols-[260px_minmax(0,1fr)] media:items-baseline media:gap-6"
              >
                <b className="font-display text-[17px] font-extrabold text-ambar-e">
                  {item.quando}
                </b>
                <span>
                  <b className="font-display text-[18px] font-bold">{item.o_que}</b>
                  <span className="mt-1 block text-[15px] text-tinta-3">
                    {item.detalhe}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-9">
            <Link href="/disputa" className="btn">
              Ver as casas na disputa
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
