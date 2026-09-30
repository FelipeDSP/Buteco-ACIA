/**
 * Repertório visual do brasão, em SVG, vazando pelas bordas das seções.
 * Três formas e só: espiga de cevada, tampinha de garrafa, rodela de limão.
 * Estrela não entra em nenhuma variação — decisão da ACIA.
 *
 * `.deco` posiciona em absoluto e some abaixo de 980px.
 */

type DecoProps = {
  /** Posição e tamanho, aplicados via style para o SVG poder vazar da seção. */
  style: React.CSSProperties
  className?: string
}

export function Espiga({ style, className = '' }: DecoProps) {
  const graos = [110, 165, 220, 275]
  return (
    <svg
      className={`deco ${className}`}
      style={style}
      viewBox="0 0 200 340"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M100 340V60"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <g fill="currentColor">
        <ellipse cx="100" cy="60" rx="13" ry="30" />
        {graos.map((y) => (
          <g key={y}>
            <ellipse cx="70" cy={y} rx="26" ry="12" transform={`rotate(-38 70 ${y})`} />
            <ellipse cx="130" cy={y} rx="26" ry="12" transform={`rotate(38 130 ${y})`} />
          </g>
        ))}
      </g>
    </svg>
  )
}

type TampinhaProps = DecoProps & {
  /**
   * Sobre que fundo a tampinha vai cair. Marinho não pode ser o anel externo
   * num bloco marinho, e ouro só existe sobre marinho — daí as três variantes.
   */
  tom?: 'marinho' | 'ambar' | 'escuro'
}

const TONS = {
  // Fundo claro: anel marinho, miolo âmbar.
  marinho: {
    fora: 'var(--color-marinho)',
    serra: 'var(--color-branco)',
    miolo: 'var(--color-ambar)',
  },
  // Fundo creme ou branco, quando a seção pede calor.
  ambar: {
    fora: 'var(--color-ambar)',
    serra: 'var(--color-claro)',
    miolo: 'var(--color-marinho)',
  },
  // Dentro de bloco marinho: serrilha em ouro, que só existe sobre marinho.
  escuro: {
    fora: 'var(--color-marinho-2)',
    serra: 'var(--color-ouro)',
    miolo: 'var(--color-ambar)',
  },
} as const

export function TampinhaDeco({ style, className = '', tom = 'marinho' }: TampinhaProps) {
  const { fora, serra, miolo } = TONS[tom]
  return (
    <svg
      className={`deco ${className}`}
      style={style}
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="80" cy="80" r="60" fill={fora} />
      <circle
        cx="80"
        cy="80"
        r="44"
        fill="none"
        stroke={serra}
        strokeWidth="5"
        strokeDasharray="9 9"
      />
      <circle cx="80" cy="80" r="26" fill={miolo} />
    </svg>
  )
}

export function Limao({ style, className = '', miolo = 'var(--color-creme)' }: DecoProps & { miolo?: string }) {
  return (
    <svg
      className={`deco ${className}`}
      style={style}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="46" fill="currentColor" />
      <circle cx="60" cy="60" r="34" fill={miolo} />
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <path d="M60 28v64M28 60h64M37 37l46 46M83 37l-46 46" />
      </g>
    </svg>
  )
}

/**
 * Coroa de louros, feita com a espiga de cevada do brasão.
 *
 * É a metáfora clássica da vitória, e aqui ela sai do próprio repertório da
 * marca em vez de virar enfeite novo — a cevada já está no brasão do evento.
 * **Não é estrela**, que a ACIA proibiu em qualquer forma.
 *
 * Um ramo só é desenhado; o outro é o mesmo espelhado, para a simetria não
 * depender de dois conjuntos de coordenadas ficarem combinando na mão.
 *
 * Diferente das outras peças deste arquivo, não leva `.deco`: os louros
 * emolduram o campeão e precisam aparecer também no celular, que é onde a
 * maioria vai ver o resultado.
 */
export function Louros({ className = '' }: { className?: string }) {
  const ramo = (
    <>
      <path
        d="M120 194 C74 188, 34 142, 32 40"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <g fill="currentColor">
        <ellipse cx="93" cy="174" rx="21" ry="9" transform="rotate(-102 93 174)" />
        <ellipse cx="76" cy="158" rx="21" ry="9" transform="rotate(-84 76 158)" />
        <ellipse cx="61" cy="135" rx="21" ry="9" transform="rotate(-67 61 135)" />
        <ellipse cx="50" cy="102" rx="21" ry="9" transform="rotate(-54 50 102)" />
        <ellipse cx="44" cy="65" rx="21" ry="9" transform="rotate(-45 44 65)" />
      </g>
    </>
  )

  return (
    <svg viewBox="0 0 240 210" fill="none" aria-hidden="true" className={className}>
      {ramo}
      <g transform="translate(240,0) scale(-1,1)">{ramo}</g>
    </svg>
  )
}
