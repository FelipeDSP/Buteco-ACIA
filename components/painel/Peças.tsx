import Link from 'next/link'

/**
 * Peças visuais do painel.
 *
 * O painel usa a mesma paleta do site, mas com densidade de ferramenta: quem
 * abre isto quer ler o estado em dois segundos e agir. Nada aqui é enfeite —
 * cada peça responde a uma pergunta que a ACIA faz olhando a tela.
 */

/** Número grande com rótulo. Responde "como estamos" sem precisar somar nada. */
export function Numero({
  valor,
  rotulo,
  detalhe,
  tom = 'neutro',
}: {
  valor: string | number
  rotulo: string
  detalhe?: string
  tom?: 'neutro' | 'destaque' | 'alerta'
}) {
  const fundo =
    tom === 'destaque'
      ? 'bg-marinho text-branco'
      : tom === 'alerta'
        ? 'bg-ambar/25'
        : 'bg-claro'
  const corDoRotulo =
    tom === 'destaque' ? 'text-selo' : tom === 'alerta' ? 'text-ambar-e' : 'text-tinta-3'

  return (
    <div className={`rounded-2xl px-5 py-4 ${fundo}`}>
      <b className="block font-display text-[clamp(24px,3vw,32px)] leading-none font-extrabold">
        {valor}
      </b>
      <span className={`mt-1.5 block text-[12.5px] font-bold tracking-[0.03em] uppercase ${corDoRotulo}`}>
        {rotulo}
      </span>
      {detalhe ? (
        <span className={`mt-1 block text-[12.5px] ${corDoRotulo}`}>{detalhe}</span>
      ) : null}
    </div>
  )
}

/** Faixa de números no topo de cada tela. */
export function Numeros({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 duas:grid-cols-2 larga:grid-cols-4">{children}</div>
}

/** Cabeçalho de tela, com espaço para uma ação à direita. */
export function TopoDaTela({
  titulo,
  sub,
  acao,
}: {
  titulo: string
  sub?: React.ReactNode
  acao?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-[clamp(24px,3vw,34px)]">{titulo}</h1>
        {sub ? <p className="mt-1.5 max-w-[70ch] text-[14.5px] text-tinta-3">{sub}</p> : null}
      </div>
      {acao}
    </div>
  )
}

/** Bloco branco que agrupa uma tabela ou um formulário. */
export function Bloco({
  titulo,
  children,
  className = '',
}: {
  titulo?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`overflow-hidden rounded-2xl bg-claro ${className}`}>
      {titulo ? (
        <h2 className="border-b border-risco px-5 py-3.5 font-display text-[15px] font-extrabold">
          {titulo}
        </h2>
      ) : null}
      {children}
    </section>
  )
}

/** Estado vazio que diz o que fazer, não só que está vazio. */
export function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <b className="display block text-[19px]">{titulo}</b>
      <p className="mx-auto mt-2 max-w-[46ch] text-[14.5px] text-tinta-3">{texto}</p>
    </div>
  )
}

/** Pílula de estado. Âmbar só para o que pede ação. */
export function Selo({
  children,
  tom = 'neutro',
  titulo,
}: {
  children: React.ReactNode
  tom?: 'neutro' | 'alerta' | 'marinho'
  titulo?: string
}) {
  const cores =
    tom === 'alerta'
      ? 'bg-ambar/25 text-ambar-e'
      : tom === 'marinho'
        ? 'bg-marinho text-branco'
        : 'bg-creme text-tinta-3'
  return (
    <span
      title={titulo}
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-bold whitespace-nowrap ${cores} ${titulo ? 'cursor-help' : ''}`}
    >
      {children}
    </span>
  )
}

/** Filtro por parâmetro de URL — mesma escolha do site: funciona sem JS. */
export function Filtros({
  base,
  atual,
  opcoes,
}: {
  base: string
  atual: string
  opcoes: { valor: string; rotulo: string; quantos: number }[]
}) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {opcoes.map((opcao) => {
        const ligado = opcao.valor === atual
        return (
          <li key={opcao.valor}>
            <Link
              href={opcao.valor === 'todas' ? base : `${base}?ver=${opcao.valor}`}
              aria-current={ligado ? 'true' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13.5px] font-bold transition-colors ${
                ligado ? 'bg-marinho text-branco' : 'bg-claro text-tinta-3 hover:bg-creme'
              }`}
            >
              {opcao.rotulo}
              <span className={ligado ? 'text-selo' : 'text-tinta-3'}>{opcao.quantos}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
