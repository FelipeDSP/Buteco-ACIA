import Link from 'next/link'
import EditorDeCasa from '@/components/painel/EditorDeCasa'

export const dynamic = 'force-dynamic'

export default function NovaCasa() {
  return (
    <div className="wrap max-w-[900px]">
      <p className="mb-2 text-[13.5px]">
        <Link href="/painel/casas" className="font-semibold text-marinho hover:underline">
          ← Casas
        </Link>
      </p>
      <h1 className="display mb-7 text-[clamp(22px,2.6vw,30px)]">Adicionar casa</h1>
      <EditorDeCasa />
    </div>
  )
}
