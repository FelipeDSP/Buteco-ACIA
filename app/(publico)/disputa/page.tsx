import { permanentRedirect } from 'next/navigation'

/**
 * A lista completa passou a viver na home. Esta rota vira redirecionamento
 * permanente para não quebrar link já compartilhado nem dividir o endereço da
 * mesma lista em dois.
 *
 * O filtro antigo sobrevive à mudança: `bairro` continua sendo bairro e `tipo`
 * vira termo de busca, que também casa com o tipo da casa.
 */

type Props = {
  searchParams: Promise<{ bairro?: string; tipo?: string; busca?: string }>
}

export default async function DisputaMudouDeEndereco({ searchParams }: Props) {
  const { bairro, tipo, busca } = await searchParams

  const params = new URLSearchParams()
  if (bairro) params.set('bairro', bairro)
  const termo = busca ?? tipo
  if (termo) params.set('busca', termo)

  const query = params.toString()
  permanentRedirect(query ? `/?${query}#casas` : '/#casas')
}
