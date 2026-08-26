import { NextResponse, type NextRequest } from 'next/server'
import { recusarSemSessao } from '@/lib/painel-auth'
import { alterarVisibilidade } from '@/lib/resultado'

export const dynamic = 'force-dynamic'

/**
 * Liga e desliga o pódio no site. **Não recalcula nada.**
 *
 * Existe separado de `publicar` porque mostrar e congelar são decisões
 * diferentes: republicar só para ocultar refaria a apuração e regravaria o
 * retrato, que é exatamente o que a tabela `resultado` existe para impedir.
 *
 * Sem data nenhuma no caminho. Quem opera isto é a Comissão, atrás de senha, e
 * é dela a decisão de quando o resultado aparece — nos dois sentidos.
 */
export async function POST(pedido: NextRequest) {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const { visivel } = (await pedido.json().catch(() => ({}))) as { visivel?: boolean }

  if (typeof visivel !== 'boolean') {
    return NextResponse.json(
      { erro: 'Informe visivel: true para mostrar, false para ocultar.' },
      { status: 400 },
    )
  }

  try {
    const linhas = await alterarVisibilidade(visivel)
    if (linhas === 0) {
      return NextResponse.json(
        { erro: 'Não há resultado publicado nesta edição para mostrar ou ocultar.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ ok: true, visivel, linhas })
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : 'Falha ao mudar a visibilidade.' },
      { status: 500 },
    )
  }
}
