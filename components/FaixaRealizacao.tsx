import Image from 'next/image'
import { REALIZADORES } from '@/lib/realizacao'

/**
 * Faixa de realização — ACIA e CDL Ariquemes assinando o festival.
 *
 * Deliberadamente discreta: dois filetes finos, sem cartão e sem cor de
 * fundo própria. Ela vem logo depois da faixa de números, que é azul e
 * cheia, e o contraste entre as duas é o que faz esta parecer assinatura em
 * vez de mais um bloco disputando atenção.
 *
 * Os tamanhos vêm de `lib/realizacao.ts`, junto de cada marca — ver lá por
 * que a ACIA é limitada pela altura e a CDL pela largura.
 */
export default function FaixaRealizacao() {
  return (
    <section className="border-y border-marinho/[0.13] bg-creme py-9 media:py-11">
      <div className="wrap flex flex-col items-center">
        <h2 className="text-[11px] font-bold tracking-[0.18em] text-tinta-3 uppercase">
          Realização
        </h2>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-[44px] gap-y-7 media:mt-7 media:gap-x-[72px]">
          {REALIZADORES.map((entidade) => (
            <li key={entidade.arquivo}>
              <Image
                src={`/realizacao/${entidade.arquivo}`}
                alt={entidade.nome}
                width={entidade.largura}
                height={entidade.altura}
                className={entidade.naFaixa}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
