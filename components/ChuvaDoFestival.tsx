import { TAMPINHA_DECO_TONS } from '@/components/Ornamentos'

/**
 * A "chuva de confete" do pódio — feita com o repertório do brasão, não com
 * papel picado.
 *
 * Confete genérico não cabia aqui, e o motivo é a paleta: ela é fechada, e as
 * cores clássicas de confete estão proibidas (vermelho, e verde com amarelo).
 * Sobrariam âmbar e ouro, e três tons caindo não lêem como confete — lêem como
 * retângulos. Caem, então, tampinha, rodela de limão e folha de louro: as
 * formas que o site já usa, em movimento.
 *
 * **Some abaixo de 980px, como toda decoração** (`.deco`). Não é só coerência:
 * no celular a seção do pódio fica muito mais alta que a tela, e as peças
 * cairiam só no primeiro terço, parando no meio do nada. E é o aparelho mais
 * fraco que carrega o site.
 *
 * **Toca uma vez** (`forwards`, sem repetição). Em laço vira enfeite de vitrine
 * e cansa na segunda olhada; o resultado sai uma vez por ano.
 *
 * Componente de servidor: as posições saem de um gerador com semente fixa, não
 * de `Math.random()`. Com aleatório de verdade o servidor e o navegador
 * sorteariam valores diferentes e o React acusaria divergência de hidratação.
 */

/** Gerador determinístico (mulberry32). Mesma semente, mesma chuva, sempre. */
function sorteio(semente: number) {
  return () => {
    semente |= 0
    semente = (semente + 0x6d2b79f5) | 0
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Poucas e lentas, como manda o bom gosto e o celular de quem lê. */
const QUANTAS = 26

type Peca = {
  forma: 'tampinha' | 'limao' | 'folha'
  esquerda: number
  tamanho: number
  atraso: number
  duracao: number
  giro: number
  deriva: number
  opacidade: number
}

const PECAS: Peca[] = (() => {
  const r = sorteio(20260919)
  const formas = ['tampinha', 'limao', 'folha'] as const
  return Array.from({ length: QUANTAS }, (_, i): Peca => ({
    forma: formas[i % 3],
    esquerda: Math.round(r() * 100),
    // Abaixo de ~22px a tampinha vira bolinha e o limão vira disco: o que
    // justifica esta chuva é as formas serem reconhecíveis.
    tamanho: Math.round(24 + r() * 26),
    // Escalonado: todas partindo juntas seria uma cortina, não uma chuva.
    atraso: Math.round(r() * 2600),
    duracao: Math.round(6000 + r() * 3800),
    giro: Math.round((r() * 2 - 1) * 520),
    deriva: Math.round((r() * 2 - 1) * 90),
    opacidade: Number((0.5 + r() * 0.4).toFixed(2)),
  }))
})()

const { fora, serra, miolo } = TAMPINHA_DECO_TONS.escuro

function Forma({ forma }: { forma: Peca['forma'] }) {
  if (forma === 'tampinha') {
    return (
      <svg viewBox="0 0 160 160" fill="none" className="h-full w-full">
        <circle cx="80" cy="80" r="60" fill={fora} />
        <circle
          cx="80"
          cy="80"
          r="44"
          fill="none"
          stroke={serra}
          strokeWidth="7"
          strokeDasharray="9 9"
        />
        <circle cx="80" cy="80" r="26" fill={miolo} />
      </svg>
    )
  }

  if (forma === 'limao') {
    return (
      <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
        <circle cx="60" cy="60" r="46" fill="var(--color-ambar)" />
        <circle cx="60" cy="60" r="34" fill="var(--color-marinho)" />
        <g stroke="var(--color-ambar)" strokeWidth="5" strokeLinecap="round">
          <path d="M60 28v64M28 60h64M37 37l46 46M83 37l-46 46" />
        </g>
      </svg>
    )
  }

  // A mesma folha da coroa de louros, solta.
  return (
    <svg viewBox="0 0 40 20" fill="none" className="h-full w-full">
      <path
        d="M2 10 C9 3.5, 22 1, 35 10 C22 19, 9 16.5, 2 10 Z"
        fill="var(--color-ouro)"
      />
      <path d="M5 10h26" stroke="var(--color-marinho)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function ChuvaDoFestival() {
  return (
    <div className="chuva" aria-hidden="true">
      {PECAS.map((p, i) => (
        <span
          key={i}
          className="chuva-peca"
          style={
            {
              left: `${p.esquerda}%`,
              width: p.tamanho,
              height: p.tamanho,
              opacity: p.opacidade,
              animationDelay: `${p.atraso}ms`,
              animationDuration: `${p.duracao}ms`,
              '--giro': `${p.giro}deg`,
              '--deriva': `${p.deriva}px`,
            } as React.CSSProperties
          }
        >
          <Forma forma={p.forma} />
        </span>
      ))}
    </div>
  )
}
