import Link from 'next/link'

/** Migalha de navegação das internas. Sempre começa em Início. */

export type EloMigalha = { href: string; rotulo: string }

export default function Migalha({
  trilha = [],
  atual,
}: {
  trilha?: readonly EloMigalha[]
  atual: string
}) {
  const elos: EloMigalha[] = [{ href: '/', rotulo: 'Início' }, ...trilha]

  return (
    <nav aria-label="Você está aqui" className="text-[13.5px] font-semibold">
      <ol className="flex flex-wrap items-center gap-2 text-selo">
        {elos.map((elo) => (
          <li key={elo.href} className="flex items-center gap-2">
            <Link
              href={elo.href}
              className="inline-block py-1 underline-offset-4 hover:text-ouro hover:underline"
            >
              {elo.rotulo}
            </Link>
            <span aria-hidden="true">›</span>
          </li>
        ))}
        <li aria-current="page" className="text-branco">
          {atual}
        </li>
      </ol>
    </nav>
  )
}
