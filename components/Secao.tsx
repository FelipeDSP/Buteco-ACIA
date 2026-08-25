/** Cabeçalho padrão de seção: rótulo âmbar, título display, subtítulo. */
export function TituloSecao({
  rotulo,
  titulo,
  sub,
  nivel = 2,
  claro = false,
}: {
  rotulo?: string
  titulo: string
  sub?: React.ReactNode
  nivel?: 1 | 2
  claro?: boolean
}) {
  const H = nivel === 1 ? 'h1' : 'h2'
  return (
    <div className="revela">
      {rotulo ? <p className="mb-3.5"><span className="rotulo">{rotulo}</span></p> : null}
      <H
        className={`display text-[clamp(26px,3.4vw,42px)] ${claro ? 'text-branco' : ''}`}
      >
        {titulo}
      </H>
      {sub ? (
        <p
          className={`mt-2.5 max-w-[52ch] text-[16.5px] ${
            claro ? 'text-selo' : 'text-tinta-3'
          }`}
        >
          {sub}
        </p>
      ) : null}
    </div>
  )
}
