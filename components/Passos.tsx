/**
 * Passos numerados. O numeral grande é ornamento — o texto do passo já diz a
 * ordem, então ele fica fora da árvore de acessibilidade.
 */

export type Passo = { titulo: string; texto: string }

export default function Passos({
  passos,
  fundo = 'bg-claro',
}: {
  passos: readonly Passo[]
  fundo?: string
}) {
  return (
    <ol className="grid gap-3.5 duas:grid-cols-2 larga:grid-cols-3">
      {passos.map((passo, i) => (
        <li
          key={passo.titulo}
          className={`revela relative overflow-hidden rounded-2xl p-6 ${fundo}`}
        >
          <span
            aria-hidden="true"
            className="absolute top-1 right-3.5 font-display text-[64px] leading-none font-extrabold text-risco"
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 className="relative font-display text-[19px] leading-tight font-extrabold">
            {passo.titulo}
          </h3>
          <p className="relative mt-1.5 text-[14.5px] text-tinta-3">{passo.texto}</p>
        </li>
      ))}
    </ol>
  )
}
