import { NextResponse, type NextRequest } from 'next/server'
import { recusarSemSessao } from '@/lib/painel-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'casas'
/** Mesmos limites que o bucket já impõe; conferir aqui dá erro legível. */
const TIPOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANHO_MAXIMO = 5 * 1024 * 1024

export async function POST(pedido: NextRequest) {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const formulario = await pedido.formData().catch(() => null)
  const arquivo = formulario?.get('arquivo')
  const slug = String(formulario?.get('slug') ?? '')

  if (!(arquivo instanceof File)) {
    return NextResponse.json({ erro: 'Nenhum arquivo recebido.' }, { status: 400 })
  }
  if (!TIPOS.includes(arquivo.type)) {
    return NextResponse.json(
      { erro: `Formato não aceito (${arquivo.type || 'desconhecido'}). Use JPG, PNG ou WebP.` },
      { status: 400 },
    )
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return NextResponse.json(
      { erro: `Imagem de ${(arquivo.size / 1024 / 1024).toFixed(1)} MB. O limite é 5 MB.` },
      { status: 400 },
    )
  }

  const extensao = arquivo.type.split('/')[1].replace('jpeg', 'jpg')
  // Nome novo a cada envio: sobrescrever o mesmo caminho deixaria a foto velha
  // presa no cache do navegador e da CDN.
  const caminho = `${slug || 'casa'}/${Date.now()}.${extensao}`

  const banco = supabaseAdmin()
  const { error } = await banco.storage
    .from(BUCKET)
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false })

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  const { data } = banco.storage.from(BUCKET).getPublicUrl(caminho)
  return NextResponse.json({ ok: true, url: data.publicUrl })
}
