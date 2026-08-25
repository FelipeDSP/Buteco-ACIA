import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_DO_PAINEL, crachaNovo, senhaConfere } from '@/lib/painel-auth'

export const dynamic = 'force-dynamic'

export async function POST(pedido: NextRequest) {
  const { senha } = (await pedido.json().catch(() => ({}))) as { senha?: unknown }

  if (!senhaConfere(senha)) {
    // Atraso pequeno para tornar tentativa em série cara sem incomodar quem
    // digitou errado uma vez.
    await new Promise((r) => setTimeout(r, 600))
    return NextResponse.json({ erro: 'Senha incorreta.' }, { status: 401 })
  }

  const cracha = crachaNovo()
  const resposta = NextResponse.json({ ok: true })
  resposta.cookies.set(COOKIE_DO_PAINEL, cracha.valor, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: cracha.expiraEm,
  })
  return resposta
}
