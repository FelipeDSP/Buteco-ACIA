import Link from 'next/link'

/**
 * Busca por formulário GET: sem JavaScript, o navegador monta a URL sozinho.
 * O bairro em curso viaja num campo oculto para a busca não derrubar o filtro.
 *
 * A âncora no `action` faz o resultado cair na lista em vez do topo da página.
 */

type Props = {
  valor?: string
  bairro?: string
}

export default function BuscaCasas({ valor, bairro }: Props) {
  const limpar = bairro ? `/?bairro=${encodeURIComponent(bairro)}#casas` : '/#casas'

  return (
    <form action="/#casas" method="get" role="search" className="flex flex-1 flex-wrap gap-2">
      {bairro ? <input type="hidden" name="bairro" value={bairro} /> : null}

      <label htmlFor="busca" className="sr-only">
        Buscar por casa ou prato
      </label>
      <input
        id="busca"
        name="busca"
        type="search"
        defaultValue={valor ?? ''}
        placeholder="Buscar por casa ou prato"
        className="min-w-[190px] flex-1 rounded-full bg-claro px-5 py-3 text-[15px] text-tinta placeholder:text-tinta-3"
      />

      <button type="submit" className="btn btn-pequeno">
        Buscar
      </button>

      {valor ? (
        <Link href={limpar} className="btn btn-linha btn-pequeno">
          Limpar
        </Link>
      ) : null}
    </form>
  )
}
