import { mostrarVencedores } from '@/lib/fase'

export type ItemMenu = { href: string; rotulo: string }

/* "As casas" e "Monte seu rolê" são seções da home, não rotas: a lista completa
   mora na própria home, e uma página só para repeti-la dividiria o endereço. */
const BASE: ItemMenu[] = [
  { href: '/', rotulo: 'Início' },
  { href: '/#casas', rotulo: 'As casas' },
  { href: '/#role', rotulo: 'Monte seu rolê' },
  { href: '/como-se-vota', rotulo: 'Como se vota' },
  { href: '/acia', rotulo: 'A ACIA' },
]

/** "Vencedores" entra como último item só a partir de 14 de outubro. */
export function menu(): ItemMenu[] {
  return mostrarVencedores()
    ? [...BASE, { href: '/vencedores', rotulo: 'Vencedores' }]
    : BASE
}

export function ehAtual(href: string, caminho: string): boolean {
  // Âncora aponta para um trecho da página, não para outra: nunca é "atual".
  if (href.includes('#')) return false
  if (href === '/') return caminho === '/'
  return caminho === href || caminho.startsWith(`${href}/`)
}
