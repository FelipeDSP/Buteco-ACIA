import Link from 'next/link'

/**
 * Filtro em links, não em estado de cliente: a combinação escolhida vira URL,
 * funciona sem JavaScript e pode ser compartilhada.
 */

type Props = {
  legenda: string
  /** Nome do parâmetro na query string. */
  parametro: string
  opcoes: readonly string[]
  /** Valor ativo, ou undefined para "todos". */
  ativo?: string
  /** Demais parâmetros que devem sobreviver à troca deste filtro. */
  outros: Record<string, string | undefined>
  rotuloTodos: string
  /** Rota que recebe os parâmetros. */
  base?: string
  /** Âncora acrescentada ao fim, para o clique cair na lista. */
  ancora?: string
}

function montarHref(
  parametro: string,
  valor: string | undefined,
  outros: Record<string, string | undefined>,
  base: string,
  ancora: string,
) {
  const busca = new URLSearchParams()
  for (const [chave, v] of Object.entries(outros)) {
    if (v) busca.set(chave, v)
  }
  if (valor) busca.set(parametro, valor)
  const query = busca.toString()
  return `${base}${query ? `?${query}` : ''}${ancora}`
}

export default function FiltroPilulas({
  legenda,
  parametro,
  opcoes,
  ativo,
  outros,
  rotuloTodos,
  base = '/',
  ancora = '',
}: Props) {
  const itens: { valor: string | undefined; rotulo: string }[] = [
    { valor: undefined, rotulo: rotuloTodos },
    ...opcoes.map((o) => ({ valor: o, rotulo: o })),
  ]

  return (
    <div>
      <h3 className="mb-2 text-[13px] font-bold text-ambar-e">{legenda}</h3>
      <ul className="flex flex-wrap gap-2">
        {itens.map((item) => {
          const selecionado = item.valor === ativo
          return (
            <li key={item.rotulo}>
              <Link
                href={montarHref(parametro, item.valor, outros, base, ancora)}
                scroll={false}
                aria-current={selecionado ? 'true' : undefined}
                className={`inline-block rounded-full px-4 py-1.5 text-[14px] font-semibold transition-colors ${
                  selecionado
                    ? 'bg-marinho text-branco'
                    : 'bg-claro text-tinta-3 hover:bg-creme hover:text-tinta'
                }`}
              >
                {item.rotulo}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
