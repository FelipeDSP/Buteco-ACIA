import type { Metadata } from 'next'
import Link from 'next/link'
import CapaInterna from '@/components/CapaInterna'
import { CALENDARIO, PREMIACAO } from '@/lib/dados'
import { contagem, mostrarVencedores } from '@/lib/fase'
import { dataLonga, reais } from '@/lib/formato'

/* A página existe desde já para não quebrar link antigo, mas só entra no menu
   a partir de 14 de outubro. Antes disso, ela diz honestamente que não há
   resultado — em vez de mostrar um pódio vazio. */
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Vencedores',
  description:
    'Resultado da primeira edição do Boteco ACIA, apurado a partir das avaliações do público.',
}

export default function Vencedores() {
  const divulgado = mostrarVencedores()
  const estado = contagem()

  return (
    <>
      <CapaInterna
        atual="Vencedores"
        selo={divulgado ? 'Resultado oficial' : 'Ainda não'}
        titulo={divulgado ? 'Os vencedores' : 'O resultado ainda não saiu'}
        sub={
          divulgado
            ? 'Apurado a partir das avaliações válidas do público, pela média aritmética simples das notas.'
            : `${estado.detalhe}. A apuração acontece de ${dataLonga(
                CALENDARIO.inicioApuracao,
              )} a ${dataLonga(CALENDARIO.fimApuracao)}, e o resultado é divulgado a partir de ${dataLonga(
                CALENDARIO.divulgacao,
              )}.`
        }
      />

      <section className="py-14">
        <div className="wrap">
          {/* Espaço com dono futuro: o pódio entra quando a ACIA fechar a apuração. */}
          <div className="rounded-2xl border-2 border-dashed border-risco bg-claro p-9 text-center">
            <p className="font-display text-[20px] font-bold">
              {divulgado
                ? 'Pódio em publicação'
                : 'Pódio a divulgar'}
            </p>
            <p className="mx-auto mt-2 max-w-[46ch] text-[15.5px] text-tinta-3">
              As três primeiras colocadas aparecem aqui com nome da casa, prato e
              nota final assim que a ACIA encerrar a apuração.
            </p>
            <p className="mt-6">
              <Link href="/disputa" className="btn">
                Ver as casas na disputa
              </Link>
            </p>
          </div>

          <h2 className="display mt-12 text-[clamp(22px,2.6vw,30px)]">
            O que cada colocação recebe
          </h2>
          <ul className="mt-6 grid gap-3.5 media:grid-cols-3">
            {PREMIACAO.map((premio) => (
              <li key={premio.posicao} className="rounded-2xl bg-creme p-6">
                <span className="rotulo text-[12.5px]">{premio.posicao}</span>
                <b className="mt-3.5 block font-display text-[32px] leading-none font-extrabold text-ambar-e">
                  {premio.valor === null ? '—' : reais(premio.valor)}
                </b>
                <p className="mt-2 text-[15px] text-tinta-3">{premio.extra}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[15px] text-tinta-3">
            Todas as casas participantes recebem placa e certificado.
          </p>
        </div>
      </section>
    </>
  )
}
