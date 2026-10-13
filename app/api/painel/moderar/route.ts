import { NextResponse, type NextRequest } from 'next/server'
import { recusarSemSessao } from '@/lib/painel-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { GARCOM_NOME_MAXIMO } from '@/lib/voto'

/**
 * Ocultar e corrigir o que um cliente escreveu.
 *
 * **Ocultar não apaga.** A linha fica no banco com `oculta_em` e o motivo —
 * a mesma regra de anular avaliação, e pelo mesmo motivo: a decisão pode ser
 * questionada, e suprimir o que um cliente escreveu é das coisas que mais
 * precisam de lastro. O motivo é obrigatório aqui e no banco.
 *
 * **Corrigir é outra coisa, e confundir as duas custa nota.** "Junior rosca
 * doce" era o Junior com apelido de zoação, e as duas notas 5 eram dele:
 * ocultar tiraria do Junior duas avaliações que ele recebeu. Corrigir troca
 * só o rótulo.
 *
 * A correção vale para **todas as linhas da casa com aquela grafia**, não
 * para uma: o cliente seguinte escreveu o mesmo apelido, e corrigir de uma em
 * uma deixaria metade do problema no relatório.
 */

export const dynamic = 'force-dynamic'

const recusa = (erro: string, status = 400) => NextResponse.json({ erro }, { status })

const MOTIVO_MINIMO = 3
const MOTIVO_MAXIMO = 300

/**
 * Zero linhas alteradas **não** é sucesso.
 *
 * O Supabase devolve `error: null` quando o filtro não casa com nada, e sem
 * esta checagem a tela dizia "pronto" tendo mudado nada — foi o que
 * aconteceu na primeira tentativa de ocultar "Teste garçom", onde o acento
 * chegou com codificação errada e o `.in()` não encontrou a linha. É o mesmo
 * defeito que já custou caro na apuração: resposta bem-sucedida e vazia.
 */
function confirmar(linhas: { id: string }[] | null, oque: string) {
  const quantas = linhas?.length ?? 0
  if (quantas === 0) {
    return recusa(`Nenhuma ${oque} encontrada com esse valor — nada foi alterado.`, 404)
  }
  return NextResponse.json({ ok: true, linhas: quantas })
}

export async function POST(pedido: NextRequest) {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  let corpo: unknown
  try {
    corpo = await pedido.json()
  } catch {
    return recusa('Pedido malformado.')
  }

  const { alvo, id, casaId, grafias, acao, motivo, nome } = (corpo ?? {}) as {
    alvo?: unknown
    id?: unknown
    casaId?: unknown
    grafias?: unknown
    acao?: unknown
    motivo?: unknown
    nome?: unknown
  }

  if (alvo !== 'observacao' && alvo !== 'garcom') return recusa('Alvo inválido.')
  if (acao !== 'ocultar' && acao !== 'mostrar' && acao !== 'corrigir') {
    return recusa('Ação inválida.')
  }

  const banco = supabaseAdmin()

  // ---- Observação: só esconde e desesconde, uma linha por vez.
  if (alvo === 'observacao') {
    if (typeof id !== 'string' || !id) return recusa('Observação não informada.')

    if (acao === 'mostrar') {
      const { data, error } = await banco
        .from('observacoes')
        .update({ oculta_em: null, oculta_motivo: null })
        .eq('id', id)
        .select('id')
      if (error) return recusa('Não foi possível reexibir a observação.', 500)
      return confirmar(data, 'observação')
    }

    if (acao !== 'ocultar') return recusa('Observação não aceita correção de texto.')

    const razao = typeof motivo === 'string' ? motivo.trim() : ''
    if (razao.length < MOTIVO_MINIMO || razao.length > MOTIVO_MAXIMO) {
      return recusa(`O motivo é obrigatório, de ${MOTIVO_MINIMO} a ${MOTIVO_MAXIMO} caracteres.`)
    }

    const { data, error } = await banco
      .from('observacoes')
      .update({ oculta_em: new Date().toISOString(), oculta_motivo: razao })
      .eq('id', id)
      .select('id')
    if (error) return recusa('Não foi possível ocultar a observação.', 500)
    return confirmar(data, 'observação')
  }

  // ---- Atendimento: age sobre a grafia inteira, dentro de uma casa.
  if (typeof casaId !== 'string' || !casaId) return recusa('Casa não informada.')
  /**
   * As grafias vêm **cruas**, do jeito que estão no banco. A que o painel
   * exibe passou por `paraExibir`, que tira pontuação e emoji da borda:
   * casar por ela deixaria `Jackson,` e `Ketlen😍😍` para trás, e a lista
   * voltaria a mostrar o nome consertado ao lado do mesmo nome torto.
   */
  if (!Array.isArray(grafias) || grafias.length === 0 || !grafias.every((g) => typeof g === 'string' && g.length > 0)) {
    return recusa('Grafias não informadas.')
  }

  if (acao === 'mostrar') {
    const { data, error } = await banco
      .from('avaliacoes_garcom')
      .update({ oculta_em: null, oculta_motivo: null })
      .eq('casa_id', casaId)
      .in('nome', grafias as string[])
      .select('id')
    if (error) return recusa('Não foi possível reexibir.', 500)
    return confirmar(data, 'grafia')
  }

  if (acao === 'corrigir') {
    const corrigido = typeof nome === 'string' ? nome.trim().replace(/\s+/g, ' ') : ''
    if (corrigido.length < 2 || corrigido.length > GARCOM_NOME_MAXIMO) {
      return recusa(`O nome corrigido precisa ter de 2 a ${GARCOM_NOME_MAXIMO} caracteres.`)
    }
    const { data, error } = await banco
      .from('avaliacoes_garcom')
      // Corrigir cancela a ocultação: são decisões excludentes, e deixar as
      // duas gravadas esconderia a linha que a casa acabou de consertar.
      .update({ nome_corrigido: corrigido, oculta_em: null, oculta_motivo: null })
      .eq('casa_id', casaId)
      .in('nome', grafias as string[])
      .select('id')
    if (error) return recusa('Não foi possível corrigir o nome.', 500)
    return confirmar(data, 'grafia')
  }

  const razao = typeof motivo === 'string' ? motivo.trim() : ''
  if (razao.length < MOTIVO_MINIMO || razao.length > MOTIVO_MAXIMO) {
    return recusa(`O motivo é obrigatório, de ${MOTIVO_MINIMO} a ${MOTIVO_MAXIMO} caracteres.`)
  }

  const { data, error } = await banco
    .from('avaliacoes_garcom')
    .update({ oculta_em: new Date().toISOString(), oculta_motivo: razao })
    .eq('casa_id', casaId)
    .in('nome', grafias as string[])
    .select('id')
  if (error) return recusa('Não foi possível ocultar.', 500)
  return confirmar(data, 'grafia')
}
