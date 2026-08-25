import Link from 'next/link'
import { Limao } from '@/components/Ornamentos'

export default function NaoEncontrado() {
  return (
    <section className="relative overflow-hidden py-20">
      <Limao
        style={{ right: -30, top: 40, width: 130, opacity: 0.5 }}
        className="text-ambar"
        miolo="var(--color-branco)"
      />
      <div className="wrap max-w-[52ch]">
        <p className="mb-3.5">
          <span className="rotulo">Página não encontrada</span>
        </p>
        <h1 className="display text-[clamp(28px,4vw,44px)]">
          Essa mesa não existe.
        </h1>
        <p className="mt-4 text-[16.5px] text-tinta-3">
          O endereço que você abriu não corresponde a nenhuma página do Boteco
          ACIA. Pode ser um link antigo, ou uma casa que não está nesta edição.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/#casas" className="btn">
            Ver as casas na disputa
          </Link>
          <Link href="/" className="btn btn-linha">
            Voltar ao início
          </Link>
        </div>
      </div>
    </section>
  )
}
