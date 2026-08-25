/**
 * Faixa de números — a forma, sem os dados. A home usa para o festival e o
 * cartão institucional usa para a ACIA, com o mesmo desenho: numeral grande em
 * display, rótulo pequeno em caixa alta, divisória fina entre as colunas.
 */

export type Numero = { valor: string; rotulo: string }

export default function FaixaDeNumeros({
  numeros,
  colunas,
  className = '',
}: {
  numeros: readonly Numero[]
  /** Classes de grade — quantas colunas em cada largura. */
  colunas: string
  className?: string
}) {
  return (
    <dl className={`grid ${colunas} ${className}`}>
      {numeros.map((n) => (
        <div
          key={n.rotulo}
          className="flex flex-col items-center border-white/20 px-4 py-7 text-center not-last:border-b sm:not-last:border-r sm:not-last:border-b-0"
        >
          <dd className="order-1 font-display text-[clamp(29px,3.6vw,44px)] leading-none font-extrabold">
            {n.valor}
          </dd>
          <dt className="order-2 mt-1.5 text-[12.5px] font-semibold tracking-[0.04em] text-selo uppercase">
            {n.rotulo}
          </dt>
        </div>
      ))}
    </dl>
  )
}
