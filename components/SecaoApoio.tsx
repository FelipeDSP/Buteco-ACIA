import Image from 'next/image'
import { TituloSecao } from '@/components/Secao'
import { listarApoiadores } from '@/lib/apoiadores'

/**
 * Seção de apoio, idêntica na home e na /acia — é um componente só justamente
 * para as duas não divergirem quando a lista mudar.
 *
 * Todos os cartões têm a mesma altura e o mesmo peso: não há cota nem destaque
 * nesta edição. Só entra quem tem arquivo na pasta — apoiador sem arte fica de
 * fora em vez de virar um retângulo de texto que parece imagem quebrada.
 *
 * Sobre o respiro lateral: com altura fixa e `contain`, marca muito deitada
 * para de ser limitada pela altura e passa a ser limitada pela largura — aí
 * encolhe e parece menor que as vizinhas, mesmo cabendo. Quem passa da
 * proporção de corte ganha margem lateral menor, para voltar a ocupar altura
 * parecida. Caber não é o mesmo que parecer do mesmo tamanho.
 */

/** Acima disto a largura vira o limite, com a grade e o cartão de hoje. */
const DEITADA = 4

export default function SecaoApoio({
  sub,
  className = '',
  decoracao,
  children,
}: {
  sub?: string
  className?: string
  /** Ornamento posicionado em absoluto; vai direto na seção, não no fluxo. */
  decoracao?: React.ReactNode
  /** Ação opcional abaixo da grade, como o link para a página da ACIA. */
  children?: React.ReactNode
}) {
  const apoiadores = listarApoiadores()
  if (apoiadores.length === 0) return null

  return (
    <section className={`py-16 ${className}`}>
      {decoracao}
      <div className="wrap">
        <TituloSecao
          rotulo="Quem apoia"
          titulo="Quem faz o Boteco ACIA acontecer"
          sub={sub}
        />

        {/* Quatro colunas, não cinco: cartão mais largo é o que devolve
            altura às marcas deitadas. Altura de cartão não resolve isso. */}
        <ul className="mt-8 grid grid-cols-2 gap-3 duas:grid-cols-3 larga:grid-cols-4">
          {apoiadores.map((apoiador) => (
            <li
              key={apoiador.nome}
              className="relative h-[110px] rounded-2xl bg-claro"
            >
              <Image
                src={`/patrocinadores/${apoiador.arquivo}`}
                alt={apoiador.nome}
                fill
                sizes="(max-width: 640px) 46vw, (max-width: 900px) 30vw, 280px"
                className={`object-contain py-6 ${
                  (apoiador.proporcao ?? 0) > DEITADA ? 'px-3' : 'px-6'
                }`}
              />
            </li>
          ))}
        </ul>

        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  )
}
