import { NextResponse } from 'next/server'
import { COOKIE_DO_PAINEL } from '@/lib/painel-auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const resposta = NextResponse.json({ ok: true })
  resposta.cookies.set(COOKIE_DO_PAINEL, '', { path: '/', maxAge: 0 })
  return resposta
}
