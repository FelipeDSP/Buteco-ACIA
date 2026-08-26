import Link from 'next/link'
import Logo from '@/components/Logo'
import { menu } from '@/lib/navegacao'
import { resultadoNoAr } from '@/lib/resultado'
import { EDICAO } from '@/lib/dados'
import { listarApoiadores } from '@/lib/apoiadores'

export default async function Rodape() {
  // O item "Vencedores" aparece quando o resultado está no ar, não numa data.
  const itens = menu(await resultadoNoAr())

  const apoiadores = listarApoiadores()

  return (
    <footer className="bg-marinho-2 py-14 text-[14.5px] text-selo">
      <div className="wrap grid gap-10 media:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="mb-4 grid size-26 place-content-center rounded-full bg-claro">
            <Logo tamanho={84} decorativo />
          </span>
          <b className="block font-display text-[19px] leading-tight font-extrabold text-branco">
            Boteco ACIA
            <br />
            {EDICAO.cidade} {EDICAO.ano}
          </b>
          <p className="mt-4">
            <span className="inline-block rounded-full bg-ambar px-4 py-1.5 font-display text-[15px] font-extrabold text-marinho">
              {EDICAO.hashtag}
            </span>
          </p>
        </div>

        <nav aria-label="Rodapé">
          <h2 className="mb-3.5 text-[13px] font-bold text-ouro">Navegar</h2>
          <ul className="flex flex-col gap-2.5">
            {itens.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-ouro">
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-3.5 text-[13px] font-bold text-ouro">Realização e apoio</h2>
          <p className="text-branco">
            Associação Comercial e Industrial de Ariquemes
          </p>
          {/* Doze nomes em coluna viram uma tira estreita e comprida; em fluxo
              corrido cabem em três linhas e continuam legíveis. */}
          <p className="mt-2.5">{apoiadores.map((a) => a.nome).join(' · ')}</p>
        </div>
      </div>

      <div className="wrap mt-12 border-t border-white/10 pt-6 text-[13px] text-selo/70">
        <p>
          {EDICAO.nome} · {EDICAO.ordinal} · {EDICAO.cidade}/{EDICAO.uf}. Evento
          realizado pela ACIA.
        </p>
      </div>
    </footer>
  )
}
