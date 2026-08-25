import Migalha from '@/components/Migalha'
import { TampinhaDeco } from '@/components/Ornamentos'

/**
 * Capa única das páginas internas: faixa marinho, migalha, selo âmbar, título
 * e subtítulo. É o que dá coesão entre elas — cada página escolhe o texto,
 * nunca a forma.
 */

type Props = {
  /** Texto do selo âmbar. */
  selo: string
  titulo: string
  sub?: React.ReactNode
  /** Linha discreta ao pé — validade, período, escopo. */
  nota?: React.ReactNode
  /** Nome desta página na migalha. */
  atual: string
  /** Menos respiro, para quando o bloco seguinte também é escuro. */
  compacta?: boolean
}

export default function CapaInterna({
  selo,
  titulo,
  sub,
  nota,
  atual,
  compacta = false,
}: Props) {
  return (
    <header
      className={`relative overflow-hidden bg-marinho text-branco ${
        compacta ? 'py-9' : 'py-13'
      }`}
    >
      <TampinhaDeco
        style={{ right: -74, bottom: -78, width: 190, opacity: 0.8 }}
        tom="escuro"
      />

      <div className="wrap">
        <div className="mb-5">
          <Migalha atual={atual} />
        </div>

        <p className="mb-3.5">
          <span className="rotulo">{selo}</span>
        </p>

        <h1 className="display text-[clamp(30px,4.4vw,52px)] tracking-[-0.025em]">
          {titulo}
        </h1>

        {sub ? (
          <p className="mt-4 max-w-[54ch] text-[17.5px] text-selo">{sub}</p>
        ) : null}

        {nota ? (
          <p className="mt-4 text-[13.5px] font-semibold text-ouro">{nota}</p>
        ) : null}
      </div>
    </header>
  )
}
