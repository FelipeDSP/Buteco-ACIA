import { NextResponse, type NextRequest } from 'next/server'
import { obterCasa } from '@/lib/dados'
import { cpfValido } from '@/lib/cpf'
import { hashDoCpf } from '@/lib/cpf-hash'
import { lerSessao, RECUSA } from '@/lib/sessao'
import { periodoDeVotacao } from '@/lib/fase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NOME_DO_COOKIE, agenteDoPedido, ipDoPedido } from '@/lib/pedido'
import {
  ACEITE_VERSAO,
  COMENTARIO_MAXIMO,
  colunasDasNotas,
  limparComentario,
  validarNotas,
} from '@/lib/voto'

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

  const { slug, cpf, aceite, notas, comentario } = (corpo ?? {}) as {
    slug?: string
    cpf?: string
    aceite?: boolean
    notas?: unknown
    comentario?: unknown
  }

  /**
   * Art. 16 de novo, aqui e não só na rota do QR: a sessão dura 20 minutos e
   * pode atravessar a meia-noite do dia 10. Sem esta checagem, quem abrisse o
   * QR às 23h55 do último dia gravaria voto depois do encerramento.
   */
  const fechado = periodoDeVotacao()
  if (fechado) return recusa(fechado.texto, 409)

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

  // O limite vale aqui, não só no contador da tela: um POST pode chegar sem
  // passar pelo formulário.
  const observacao = limparComentario(comentario)
  if (!observacao.ok) {
    return recusa(`A observação passa de ${COMENTARIO_MAXIMO} caracteres.`)
  }

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
    comentario: observacao.texto,
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

      /**
       * **Queima a sessão aqui, e isto é segurança, não arrumação.**
       *
       * "Você já avaliou esta casa" responde uma pergunta que ninguém deveria
       * poder fazer: *fulano votou neste bar?* Enquanto a sessão sobrevivia à
       * recusa, uma única leitura do QR permitia testar CPF atrás de CPF até
       * achar um que ainda não tivesse votado — e cada 409 pelo caminho era a
       * confirmação de que aquela pessoa votou ali.
       *
       * Quem tem lista de CPF de cliente — fidelidade, nota fiscal — é
       * justamente o dono da casa, que é quem tem interesse em saber. O HMAC
       * protege o banco; sem isto, este endpoint contornava o HMAC pela porta
       * da frente.
       *
       * Com a sessão queimada, cada sondagem custa uma leitura física do QR
       * que está na mesa do bar. Quem já votou de verdade vê a mensagem uma
       * vez e não precisa de sessão — já votou.
       */
      await banco
        .from('sessoes')
        .update({ usada_em: new Date().toISOString() })
        .eq('id', verificacao.sessao.id)

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
