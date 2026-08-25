import Link from 'next/link'
import FaixaNumeros from '@/components/FaixaNumeros'
import LequePratos from '@/components/LequePratos'
import ListaCasas from '@/components/ListaCasas'
import Mapa from '@/components/Mapa'
import Passos, { type Passo } from '@/components/Passos'
import SecaoApoio from '@/components/SecaoApoio'
import { TituloSecao } from '@/components/Secao'
import { Espiga, Limao, TampinhaDeco } from '@/components/Ornamentos'
import {
  EDICAO,
  buscarCasas,
  contarCasas,
  diasDeFestival,
  listarBairros,
  listarCasas,
} from '@/lib/dados'
import { contagem, type Fase } from '@/lib/fase'

/* A home lê busca e filtro da URL, então é renderizada a cada visita — o que
   também mantém a contagem do calendário sempre certa, sem esperar deploy. */

type Props = {
  searchParams: Promise<{ bairro?: string; busca?: string }>
}

const ROTEIRO: readonly Passo[] = [
  {
    titulo: 'Escolha o bairro',
    texto:
      'Comece pelo que é perto de você. Duas ou três casas numa noite já é um bom rolê.',
  },
  {
    titulo: 'Peça o prato da disputa',
    texto: 'Cada casa inscreveu um só, marcado no cardápio. O garçom sabe qual é.',
  },
  {
    titulo: 'Vote e siga em frente',
    texto:
      'Aponte para o QR da mesa, dê as notas e marque a próxima casa da lista.',
  },
]

type Chamada = {
  antes: string
  destaque: string
  depois: string
  lede: React.ReactNode
  acao: { href: string; texto: string }
}

function chamadaDaFase(fase: Fase): Chamada {
  switch (fase) {
    case 'pre-festival':
      return {
        antes: 'As casas já escolheram o prato.',
        destaque: 'Falta você provar.',
        depois: '',
        lede: (
          <>
            Os bares e restaurantes de Ariquemes puseram um prato na disputa. A
            partir de <b className="font-semibold text-branco">19 de setembro</b>{' '}
            você prova, aponta o celular para o QR da mesa e dá a sua nota.
          </>
        ),
        acao: { href: '#casas', texto: 'Ver as casas' },
      }
    case 'festival':
      return {
        antes: 'Coma bem, vote e',
        destaque: 'eleja o melhor',
        depois: 'prato de boteco de Ariquemes.',
        lede: (
          <>
            As casas da cidade puseram um prato na disputa. Você prova, aponta o
            celular para o QR da mesa e{' '}
            <b className="font-semibold text-branco">dá a sua nota</b>. Quem
            decide é quem come.
          </>
        ),
        acao: { href: '#casas', texto: 'Ver as casas' },
      }
    case 'apuracao':
      return {
        antes: 'A votação acabou.',
        destaque: 'Agora é a contagem.',
        depois: '',
        lede: (
          <>
            As avaliações estão sendo apuradas de{' '}
            <b className="font-semibold text-branco">11 a 13 de outubro</b>. O
            resultado sai logo depois, e a premiação acontece na segunda
            quinzena do mês.
          </>
        ),
        acao: { href: '#casas', texto: 'Rever as casas' },
      }
    default:
      return {
        antes: 'O público decidiu.',
        destaque: 'Conheça os vencedores.',
        depois: '',
        lede: (
          <>
            A apuração terminou e o resultado da primeira edição do Boteco ACIA
            está no ar.
          </>
        ),
        acao: { href: '/vencedores', texto: 'Ver o resultado' },
      }
  }
}

export default async function Home({ searchParams }: Props) {
  const { bairro, busca } = await searchParams

  const estado = contagem()
  const texto = chamadaDaFase(estado.fase)

  const bairros = await listarBairros()
  // Bairro inventado na URL não filtra nada: cai para "todos".
  const bairroAtivo = bairro && bairros.includes(bairro) ? bairro : undefined
  const termo = busca?.trim() || undefined

  const casas = await buscarCasas({ bairro: bairroAtivo, busca: termo })
  const todas = await listarCasas()
  const total = todas.length

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-marinho py-16 text-branco">
        <Espiga
          style={{ left: -104, top: 10, width: 205, opacity: 0.5 }}
          className="text-ouro"
        />
        <TampinhaDeco
          style={{ right: -84, bottom: -92, width: 200, opacity: 0.8 }}
          tom="escuro"
        />
        <Limao
          style={{ left: 150, bottom: -46, width: 108, opacity: 0.45 }}
          className="text-ouro"
          miolo="var(--color-marinho)"
        />

        <div className="wrap grid items-center gap-14 larga:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          <div>
            <p className="mb-4">
              <span className="rotulo">
                {EDICAO.ordinal} · {EDICAO.ano}
              </span>
            </p>

            <h1 className="display text-[clamp(33px,4.9vw,60px)] tracking-[-0.025em]">
              {texto.antes}{' '}
              <mark className="inline-block -rotate-[1.2deg] rounded-lg bg-ambar px-[0.14em] text-marinho">
                {texto.destaque}
              </mark>
              {texto.depois ? ` ${texto.depois}` : ''}
            </h1>

            <p className="mt-5 max-w-[42ch] text-[18px] text-selo">{texto.lede}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={texto.acao.href} className="btn btn-ambar">
                {texto.acao.texto}
              </Link>
              <Link href="#role" className="btn btn-ouro">
                Monte seu rolê
              </Link>
            </div>
          </div>

          <LequePratos casas={todas} />
        </div>
      </section>

      {/* ---------- Faixa de números ---------- */}
      <FaixaNumeros />

      {/* ---------- Mapa ---------- */}
      <section className="relative overflow-hidden py-16">
        <Limao
          style={{ right: -34, top: 54, width: 116, opacity: 0.5 }}
          className="text-ambar"
          miolo="var(--color-branco)"
        />
        <div className="wrap">
          <TituloSecao
            rotulo="Por onde começar"
            titulo="Onde ficam as casas"
            sub="Quatro casas ficam na Avenida Canaã, num trecho de pouco mais de um quilômetro — dá para emendar as quatro na mesma noite."
          />
          <div className="mt-8">
            <Mapa casas={casas} />
          </div>
        </div>
      </section>

      {/* ---------- A lista ---------- */}
      <ListaCasas
        casas={casas}
        total={total}
        bairros={bairros}
        bairroAtivo={bairroAtivo}
        busca={termo}
      />

      {/* ---------- Monte seu rolê ---------- */}
      <section id="role" className="relative scroll-mt-4 overflow-hidden bg-creme py-16">
        <TampinhaDeco
          style={{ left: -54, bottom: -48, width: 170, opacity: 0.75 }}
          tom="ambar"
        />
        <div className="wrap">
          <TituloSecao
            rotulo="Em três passos"
            titulo="Monte seu rolê"
            sub="Não precisa visitar tudo de uma vez. A graça é ir voltando."
          />
          <div className="mt-8">
            <Passos passos={ROTEIRO} />
          </div>
        </div>
      </section>

      {/* ---------- Como se vota, resumido ---------- */}
      <section className="relative overflow-hidden bg-marinho py-14">
        <Espiga
          style={{ right: -66, top: 40, width: 196, opacity: 0.4 }}
          className="text-ouro"
        />
        <div className="wrap flex flex-wrap items-center justify-between gap-7">
          <div>
            <p className="mb-3.5">
              <span className="rotulo">Menos de um minuto</span>
            </p>
            <h2 className="display max-w-[20ch] text-[clamp(24px,3.2vw,38px)] text-branco">
              Provou, gostou? Aponte o celular para o QR da mesa e dê a sua nota.
            </h2>
          </div>
          <Link href="/como-se-vota" className="btn btn-ambar">
            Como se vota
          </Link>
        </div>
      </section>

      {/* ---------- Apoiadores ---------- */}
      <SecaoApoio>
        <Link href="/acia" className="btn btn-linha">
          Sobre a ACIA
        </Link>
      </SecaoApoio>
    </>
  )
}
