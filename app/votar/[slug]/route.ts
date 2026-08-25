import { NextResponse, type NextRequest } from 'next/server'
import { obterCasa } from '@/lib/dados'
import { situacaoDaCasa } from '@/lib/horarios'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NOME_DO_COOKIE, agenteDoPedido, ipDoPedido } from '@/lib/pedido'

/**
 * Destino do QR code da mesa.
 *
 * É route handler, e não página, por um motivo do Next: cookie só pode ser
 * gravado em route handler ou server action — durante o render de uma página,
 * `cookies().set()` lança. Então aqui a sessão nasce, o cookie é gravado, e a
 * pessoa segue para o formulário.
 *
 * A sessão é o que amarra o voto à casa. Ela vem da rota, nunca de campo do
 * formulário: se o estabelecimento pudesse ser escolhido pelo cliente, alguém
 * votaria no bar errado de propósito.
 */

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

/**
 * Redirect com `Location` relativo.
 *
 * `NextResponse.redirect()` exige URL absoluta, e a forma comum de montá-la —
 * `new URL(caminho, pedido.url)` — deriva do endereço em que o servidor
 * escuta, não do `Host` que o visitante pediu. Com `next dev -H 0.0.0.0`, o
 * celular escaneia o QR de 192.168.1.26:3311, conecta, e recebe um `Location`
 * para 0.0.0.0:3311 — endereço que não existe fora da máquina. Resultado:
 * ERR_CONNECTION_REFUSED com o QR na mesa e o cliente esperando.
 *
 * Caminho relativo é válido pela RFC 7231 §7.1.2 e o navegador resolve contra
 * o host que ele mesmo pediu. Funciona igual em rede local, em preview e no
 * domínio final, sem depender de configuração.
 *
 * Se algum dia precisar de URL absoluta aqui — a geração dos QR codes vai
 * precisar —, derive de `Host` ou `x-forwarded-host`. Nunca de `request.url`.
 */
function redirecionarPara(caminho: string) {
  return new NextResponse(null, { status: 307, headers: { location: caminho } })
}

export async function GET(pedido: NextRequest, { params }: Props) {
  const { slug } = await params
  const paraOFormulario = (erro?: string) =>
    redirecionarPara(`/votar/${slug}/avaliar${erro ? `?erro=${erro}` : ''}`)

  // `obterCasa` usa a chave anônima, e o RLS já esconde casa inativa.
  const casa = await obterCasa(slug)
  if (!casa) return paraOFormulario('casa')

  const situacao = situacaoDaCasa(casa.horarios)
  if (!situacao.aberta) return paraOFormulario('fechada')

  // Chave ausente ou banco fora do ar viram a mesma tela de recado: quem está
  // no bar com o celular na mão não tem o que fazer com um erro 500.
  let data: { id: string; expira_em: string } | null = null
  try {
    const resultado = await supabaseAdmin()
      .from('sessoes')
      .insert({
        casa_id: casa.id,
        ip: ipDoPedido(pedido.headers),
        user_agent: agenteDoPedido(pedido.headers),
      })
      .select('id, expira_em')
      .single()
    if (resultado.error) throw resultado.error
    data = resultado.data
  } catch {
    return paraOFormulario('sessao')
  }

  if (!data) return paraOFormulario('sessao')

  const resposta = paraOFormulario()
  const segundos = Math.max(
    0,
    Math.floor((new Date(data.expira_em).getTime() - Date.now()) / 1000),
  )

  // httpOnly: o id da sessão não interessa a nenhum script da página, e fora do
  // alcance do JavaScript ele não vaza por XSS.
  resposta.cookies.set(NOME_DO_COOKIE, data.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: segundos,
  })

  return resposta
}
