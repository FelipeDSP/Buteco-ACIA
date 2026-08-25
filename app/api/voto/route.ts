import { NextResponse, type NextRequest } from 'next/server'
import { obterCasa } from '@/lib/dados'
import { cpfValido } from '@/lib/cpf'
import { hashDoCpf } from '@/lib/cpf-hash'
import { lerSessao, RECUSA } from '@/lib/sessao'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NOME_DO_COOKIE, agenteDoPedido, ipDoPedido } from '@/lib/pedido'
import { ACEITE_VERSAO, colunasDasNotas, validarNotas } from '@/lib/voto'

/**
 * Gravação do voto. Roda só no servidor, com a chave service_role — `sessoes`
 * e `avaliacoes` não têm policy de RLS, então nenhuma outra chave escreve nelas.
 *
 * O CPF em texto puro morre nesta função: entra pelo corpo do pedido, vira
 * HMAC e some. Não é gravado, não é logado e não volta na resposta.
 */

export const dynamic = 'force-dynamic'

const recusa = (erro: string, status = 400) => NextResponse.json({ erro }, { status })

export async function POST(pedido: NextRequest) {
  let corpo: unknown
  try {
    corpo = await pedido.json()
  } catch {
    return recusa('Pedido malformado.')
  }

  const { slug, cpf, aceite, notas } = (corpo ?? {}) as {
    slug?: string
    cpf?: string
    aceite?: boolean
    notas?: unknown
  }

  if (typeof slug !== 'string') return recusa('Casa não informada.')

  const casa = await obterCasa(slug)
  if (!casa) return recusa('Casa não encontrada.', 404)

  // 1. Sessão: sem ela, expirada ou já usada, o voto não existe.
  const verificacao = await lerSessao(casa.id)
  if (!verificacao.ok) return recusa(RECUSA[verificacao.motivo], 409)

  // 2. CPF: só aritmética de dígito verificador.
  if (typeof cpf !== 'string' || !cpfValido(cpf)) {
    return recusa('CPF inválido. Confira os números digitados.')
  }

  if (aceite !== true) return recusa('É preciso aceitar os termos para votar.')

  const validadas = validarNotas(notas)
  if (!validadas.ok) return recusa('Dê uma nota de 0 a 5 em cada critério.')

  // 3. O CPF vira HMAC aqui e não é usado em mais lugar nenhum.
  let cpfHash: string
  try {
    cpfHash = hashDoCpf(cpf)
  } catch {
    return recusa('Servidor sem segredo de hash configurado.', 500)
  }

  const banco = supabaseAdmin()

  // 4. Grava as quatro notas em colunas separadas — a soma se calcula depois,
  //    e guardar só o total impediria o desempate por sabor do regulamento.
  const { error } = await banco.from('avaliacoes').insert({
    casa_id: casa.id,
    sessao_id: verificacao.sessao.id,
    cpf_hash: cpfHash,
    ...colunasDasNotas(validadas.notas),
    aceite: true,
    aceite_versao: ACEITE_VERSAO,
    ip: ipDoPedido(pedido.headers),
    user_agent: agenteDoPedido(pedido.headers),
  })

  if (error) {
    // Voto repetido é barrado pelo índice único, não por SELECT antes: sob
    // concorrência, checar antes de inserir deixa passar as duas gravações.
    if (error.code === '23505') {
      // Nomes conferidos contra o banco: `uma_avaliacao_por_cpf_por_casa` e
      // `avaliacoes_sessao_id_key`. O do CPF não tem "cpf_hash" no nome, então
      // casar por substring genérica trocaria as duas mensagens.
      const alvo = `${error.message} ${error.details ?? ''}`
      if (alvo.includes('avaliacoes_sessao_id_key')) {
        return recusa('Esta sessão já virou uma avaliação.', 409)
      }
      return recusa('Você já avaliou esta casa.', 409)
    }
    return recusa('Não foi possível registrar o seu voto. Tente de novo.', 500)
  }

  // 5. Marca a sessão como usada. Se este passo falhar, uma segunda tentativa
  //    esbarra no índice único de `sessao_id` — o replay continua barrado.
  await banco
    .from('sessoes')
    .update({ usada_em: new Date().toISOString() })
    .eq('id', verificacao.sessao.id)

  const resposta = NextResponse.json({ ok: true })
  resposta.cookies.set(NOME_DO_COOKIE, '', { path: '/', maxAge: 0 })
  return resposta
}
