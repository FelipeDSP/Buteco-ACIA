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

export const TAMPINHA_DECO_TONS = {
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
  const { fora, serra, miolo } = TAMPINHA_DECO_TONS[tom]
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
 * Coroa de louros, feita com o grão de cevada do brasão.
 *
 * É a metáfora clássica da vitória, e sai do próprio repertório da marca em
 * vez de virar enfeite novo — a cevada já está no brasão do evento. **Não é
 * estrela**, que a ACIA proibiu em qualquer forma.
 *
 * A folha é um losango de pontas curvas com nervura, não uma elipse: elipse
 * lia como bolha e a coroa inteira parecia rascunho. Oito por ramo, girando
 * com a tangente do caule e afunilando 42% da base para a ponta — é o afunilar
 * que faz parecer crescida em vez de carimbada.
 *
 * Um ramo só é desenhado; o outro é o mesmo espelhado, para a simetria não
 * depender de dois conjuntos de coordenadas combinarem na mão. O laço na base
 * fecha a coroa, que sem ele fica com cara de dois galhos soltos.
 *
 * Diferente das outras peças deste arquivo, não leva `.deco`: os louros
 * emolduram o campeão e precisam aparecer também no celular, que é onde a
 * maioria vai ver o resultado.
 */
const FOLHA =
  'M0 0 C7 -6.5, 20 -9, 33 0 C20 9, 7 6.5, 0 0 Z'

export function Louros({ className = '' }: { className?: string }) {
  const ramo = (
    <>
      <path
        d="M120 200 C66 196, 26 146, 30 34"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <g fill="currentColor">
        <path d={FOLHA} transform="translate(104.3 197.4) rotate(-119.3)" />
        <path d={FOLHA} transform="translate(86.7 190.5) rotate(-105.7) scale(0.94)" />
        <path d={FOLHA} transform="translate(71 179.3) rotate(-91.8) scale(0.88)" />
        <path d={FOLHA} transform="translate(57.3 163.7) rotate(-79) scale(0.82)" />
        <path d={FOLHA} transform="translate(46 143.5) rotate(-67.8) scale(0.76)" />
        <path d={FOLHA} transform="translate(37.5 118.5) rotate(-58.5) scale(0.7)" />
        <path d={FOLHA} transform="translate(31.9 88.5) rotate(-50.9) scale(0.64)" />
        <path d={FOLHA} transform="translate(29.9 59.7) rotate(-45.6) scale(0.58)" />
      </g>
      {/* Nervura: uma linha fina por folha, no tom do fundo, dá volume sem
          precisar de segunda cor. */}
      <g stroke="var(--color-marinho)" strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
        <path d="M0 0h26" transform="translate(104.3 197.4) rotate(-119.3)" />
        <path d="M0 0h26" transform="translate(86.7 190.5) rotate(-105.7) scale(0.94)" />
        <path d="M0 0h26" transform="translate(71 179.3) rotate(-91.8) scale(0.88)" />
        <path d="M0 0h26" transform="translate(57.3 163.7) rotate(-79) scale(0.82)" />
        <path d="M0 0h26" transform="translate(46 143.5) rotate(-67.8) scale(0.76)" />
        <path d="M0 0h26" transform="translate(37.5 118.5) rotate(-58.5) scale(0.7)" />
        <path d="M0 0h26" transform="translate(31.9 88.5) rotate(-50.9) scale(0.64)" />
        <path d="M0 0h26" transform="translate(29.9 59.7) rotate(-45.6) scale(0.58)" />
      </g>
    </>
  )

  return (
    <svg viewBox="0 0 240 216" fill="none" aria-hidden="true" className={className}>
      {ramo}
      <g transform="translate(240,0) scale(-1,1)">{ramo}</g>
      {/* O laço que amarra os dois ramos. */}
      <g fill="currentColor">
        <ellipse cx="120" cy="201" rx="9" ry="7" />
        <path d="M120 203 C112 208, 106 214, 105 214 C104 210, 110 205, 118 203 Z" />
        <path d="M120 203 C128 208, 134 214, 135 214 C136 210, 130 205, 122 203 Z" />
      </g>
    </svg>
  )
}
