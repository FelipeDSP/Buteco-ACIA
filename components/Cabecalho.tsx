import Image from 'next/image'
import Link from 'next/link'
import Logo from '@/components/Logo'
import MenuNavegacao from '@/components/MenuNavegacao'
import { menu } from '@/lib/navegacao'
import { resultadoNoAr } from '@/lib/resultado'
import { contagem } from '@/lib/fase'
import { EDICAO } from '@/lib/dados'
import { REALIZADORES } from '@/lib/realizacao'

export default async function Cabecalho() {
  // O item "Vencedores" aparece quando o resultado está no ar, não numa data.
  const itens = menu(await resultadoNoAr())

  const { detalhe } = contagem()

  return (
    <header>
      {/* Faixa de estado do festival — muda sozinha conforme a data */}
      <div className="bg-marinho-2 py-2.5 text-[13px] font-semibold text-ouro">
        <div className="wrap flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center">
          <span>{detalhe}</span>
          <span aria-hidden="true" className="text-selo">·</span>
          <span className="text-selo">
            {EDICAO.cidade}, {EDICAO.uf}
          </span>
        </div>
      </div>

      <nav
        aria-label="Principal"
        className="sticky top-0 z-50 bg-branco shadow-[0_1px_0_var(--color-risco)]"
      >
        <div className="wrap flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
          <span className="flex items-center gap-3.5">
            <Link href="/" className="flex items-center gap-3">
              <Logo tamanho={52} prioridade decorativo />
              <span>
                <b className="block font-display text-[19px] leading-tight font-extrabold tracking-[-0.01em]">
                  Boteco ACIA
                </b>
                <small className="mt-0.5 block text-[11.5px] font-medium text-tinta-3">
                  {EDICAO.cidade} · {EDICAO.ordinal}
                </small>
              </span>
            </Link>

            {/* Quem realiza, ao lado de quem é realizado. Some abaixo de 900px:
                nessa largura as três marcas juntas viram uma fileira ilegível,
                e a do evento é a que tem de sobreviver. O rodapé e a seção de
                apoio continuam nomeando as duas por extenso. */}
            <span
              aria-hidden="true"
              className="hidden h-[34px] w-px shrink-0 bg-risco larga:block"
            />
            <Link
              href="/acia"
              className="hidden items-center gap-[18px] larga:flex"
              title="Realização do Boteco ACIA"
            >
              {REALIZADORES.map((entidade) => (
                <Image
                  key={entidade.arquivo}
                  src={`/realizacao/${entidade.arquivo}`}
                  alt={entidade.nome}
                  width={entidade.largura}
                  height={entidade.altura}
                  className={entidade.noCabecalho}
                />
              ))}
            </Link>
          </span>

          <MenuNavegacao itens={itens} />
        </div>
      </nav>
    </header>
  )
}
