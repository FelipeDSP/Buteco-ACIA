import type { Metadata } from 'next'
import Link from 'next/link'
import CapaInterna from '@/components/CapaInterna'
import FaixaDeNumeros from '@/components/FaixaDeNumeros'
import FaixaRealizacao from '@/components/FaixaRealizacao'
import LogoAcia from '@/components/LogoAcia'
import SecaoApoio from '@/components/SecaoApoio'
import { TituloSecao } from '@/components/Secao'
import { TampinhaDeco } from '@/components/Ornamentos'
import { EDICAO, contarCasas } from '@/lib/dados'

export const metadata: Metadata = {
  title: 'A ACIA',
  description:
    'A Associação Comercial e Industrial de Ariquemes realiza a primeira edição do Boteco ACIA, festival gastronômico competitivo decidido pelo voto do público.',
}

const OBJETIVOS = [
  {
    titulo: 'Movimentar o comércio local',
    texto:
      'O festival acontece dentro dos estabelecimentos, no horário normal de funcionamento. Cada prato provado é uma mesa ocupada e uma equipe trabalhando.',
  },
  {
    titulo: 'Dar palco à cozinha da cidade',
    texto:
      'Cada casa escolhe um prato para representá-la. É a chance de mostrar receita autoral, ingrediente regional e o que a equipe sabe fazer de melhor.',
  },
  {
    titulo: 'Colocar o público no comando',
    texto:
      'Quem decide o vencedor é quem senta à mesa, prova e dá a nota. O roteiro é do público, e o resultado também.',
  },
  {
    titulo: 'Criar um roteiro pela cidade',
    texto:
      'As casas participantes estão espalhadas por vários bairros. O festival vira um convite a conhecer lugares que ainda não estavam no seu caminho.',
  },
]

/** Números da associação, não do festival. Fornecidos pela ACIA. */
const NUMEROS_DA_ACIA = [
  { valor: '550+', rotulo: 'Associados' },
  { valor: '10', rotulo: 'Núcleos de negócios' },
  { valor: '100%', rotulo: 'Nos conselhos municipais' },
]

const CONTATO = {
  endereco: 'Avenida Juscelino Kubitschek, 1769 — Setor Institucional',
  telefone: '(69) 3535-2018',
  telefoneUrl: 'tel:+556935352018',
  email: 'comercial@aciaariquemes.com.br',
  site: 'https://aciaariquemes.com.br',
  atendimento: 'Segunda a sexta, 8h às 18h · Sábado, 8h às 11h',
}

export default async function PaginaAcia() {
  const total = await contarCasas()

  return (
    <>
      <CapaInterna
        compacta
        atual="A ACIA"
        selo="Quem realiza"
        titulo="A ACIA e quem faz o Boteco acontecer"
        sub="A associação que representa o comércio de Ariquemes e assina o festival."
      />

      {/* ---------- Cartão institucional da ACIA ----------
          Único bloco da página no azul da associação. O resto segue a paleta
          do Boteco: aqui quem fala é a entidade, não o festival. */}
      <section className="py-14">
        <div className="wrap">
          <article className="revela overflow-hidden rounded-2xl border-t-4 border-acia-marca bg-acia text-branco">
            <div className="grid gap-8 p-8 larga:grid-cols-[auto_minmax(0,1fr)] larga:items-center larga:p-10">
              <LogoAcia tamanho={132} />

              <div>
                <h2 className="display text-[clamp(22px,2.6vw,32px)]">
                  Associação Comercial e Industrial de Ariquemes
                </h2>
                <p className="mt-3 max-w-[56ch] text-[16px] text-selo">
                  Representa o comércio, os serviços e a indústria de Ariquemes,
                  organiza os empresários por segmento e leva a voz do setor
                  produtivo às decisões do município.
                </p>
                <p className="mt-6">
                  <a
                    href={CONTATO.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ambar"
                  >
                    Conheça a ACIA
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </p>
              </div>
            </div>

            <FaixaDeNumeros
              numeros={NUMEROS_DA_ACIA}
              colunas="grid-cols-1 sm:grid-cols-3"
              className="border-t border-white/20"
            />

            <div className="grid gap-7 border-t border-white/20 p-8 sm:grid-cols-2 larga:p-10">
              <div>
                <h3 className="mb-2.5 text-[13px] font-bold text-ouro">Onde fica</h3>
                <address className="text-[15.5px] not-italic">
                  {CONTATO.endereco}
                  <br />
                  {EDICAO.cidade}/{EDICAO.uf}
                </address>
              </div>

              <div>
                <h3 className="mb-2.5 text-[13px] font-bold text-ouro">Contato</h3>
                <ul className="flex flex-col gap-1.5 text-[15.5px]">
                  <li>
                    <a
                      href={CONTATO.telefoneUrl}
                      className="underline-offset-4 hover:text-ouro hover:underline"
                    >
                      {CONTATO.telefone}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${CONTATO.email}`}
                      className="break-all underline-offset-4 hover:text-ouro hover:underline"
                    >
                      {CONTATO.email}
                    </a>
                  </li>
                </ul>
              </div>

              <div className="sm:col-span-2">
                <h3 className="mb-2.5 text-[13px] font-bold text-ouro">
                  Atendimento
                </h3>
                <p className="text-[15.5px]">{CONTATO.atendimento}</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="pb-14">
        <div className="wrap">
          <div className="revela max-w-[68ch]">
            <p className="display text-[clamp(20px,2.4vw,28px)] leading-tight">
              Cada prato provado é comércio local girando.
            </p>
            <div className="mt-4 flex flex-col gap-4 text-[16.5px] text-tinta-3">
              <p>
                O Boteco ACIA é um festival gastronômico competitivo e
                descentralizado: não há praça de alimentação nem tenda de
                evento. Cada estabelecimento serve o prato inscrito no próprio
                espaço, onde já atende todo dia, e o público faz o roteiro pela
                cidade.
              </p>
              <p>
                A avaliação é inteiramente popular: quem prova aponta o celular
                para o QR code da mesa e dá a sua nota.
              </p>
              <p>
                Esta é a {EDICAO.ordinal.toLowerCase()} do festival, realizada em{' '}
                {EDICAO.cidade}/{EDICAO.uf} em {EDICAO.ano}.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/#casas" className="btn">
                {total > 0 ? `Ver as ${total} casas` : 'Ver as casas'}
              </Link>
              <Link href="/como-se-vota" className="btn btn-linha">
                Como se vota
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-creme py-14">
        <div className="wrap">
          <TituloSecao rotulo="Por que existe" titulo="Objetivos do festival" />
          <ul className="mt-8 grid gap-3.5 sm:grid-cols-2">
            {OBJETIVOS.map((o) => (
              <li key={o.titulo} className="revela rounded-2xl bg-claro p-6">
                <h3 className="font-display text-[20px] leading-tight font-bold">
                  {o.titulo}
                </h3>
                <p className="mt-2 text-[15px] text-tinta-3">{o.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaixaRealizacao />

      <SecaoApoio
        className="relative overflow-hidden"
        sub="O festival só acontece porque tem quem banque a estrutura junto."
        decoracao={
          <TampinhaDeco
            style={{ left: -50, bottom: -50, width: 175, opacity: 0.5 }}
            tom="ambar"
          />
        }
      />
    </>
  )
}
