import Link from 'next/link'
import { notFound } from 'next/navigation'
import EditorDeCasa from '@/components/painel/EditorDeCasa'
import { obterCasaDoPainel } from '@/lib/painel'

export const dynamic = 'force-dynamic'

export default async function EditarCasa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const casa = await obterCasaDoPainel(id)
  if (!casa) notFound()

  return (
    <div className="wrap max-w-[900px]">
      <p className="mb-2 text-[13.5px]">
        <Link href="/painel/casas" className="font-semibold text-marinho hover:underline">
          ← Casas
        </Link>
      </p>
      <h1 className="display mb-7 text-[clamp(22px,2.6vw,30px)]">{casa.nome}</h1>
      <EditorDeCasa casa={casa} />
    </div>
  )
}
