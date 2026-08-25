import { NextResponse } from 'next/server'

/**
 * Sinal de vida do container, para o healthcheck do Docker.
 *
 * **Não toca no banco de propósito.** O Traefik se recusa a rotear para um
 * container marcado como `unhealthy`; se a checagem dependesse do Supabase,
 * uma instabilidade de trinta segundos no banco tiraria o site inteiro do ar
 * — inclusive as páginas que nem precisam dele. A pergunta aqui é só "o
 * processo do Node está de pé e respondendo?".
 *
 * Falha de banco deve aparecer como erro na página que precisa do banco, não
 * como site fora do ar.
 */

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({ ok: true }, { status: 200 })
}
