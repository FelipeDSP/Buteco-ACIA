import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Trava para os testes que escrevem no banco.
 *
 * Não existe banco de teste: estes testes falam com o mesmo Supabase que
 * atende o site. Hoje isso é inofensivo porque `avaliacoes` está vazia, mas a
 * partir do primeiro voto real do festival um `npm test` distraído passaria a
 * inserir voto de mentira no meio da apuração — e ninguém perceberia, porque
 * o teste passa.
 *
 * A regra é simples: **se houver qualquer linha em `avaliacoes` que não seja
 * deste teste, a suíte aborta.** Falha ruidosa, não pulo silencioso — durante
 * o festival você quer ser interrompido, não informado.
 *
 * A limpeza dos testes já é escopada (apaga só o próprio `cpf_hash`), então
 * ela nunca apagaria voto real. Esta trava é a segunda tranca: impede até de
 * começar.
 */

export async function exigirBancoSemVotosReais(
  banco: SupabaseClient,
  cpfHashDoTeste: string,
): Promise<void> {
  const { count, error } = await banco
    .from('avaliacoes')
    .select('*', { count: 'exact', head: true })
    .neq('cpf_hash', cpfHashDoTeste)

  if (error) {
    throw new Error(
      `Não deu para conferir se o banco está vazio antes de escrever nele: ${error.message}\n` +
        'Na dúvida o teste não roda — escrever às cegas no banco do festival não é opção.',
    )
  }

  const linhas = count ?? 0
  if (linhas > 0) {
    throw new Error(
      [
        '',
        `ABORTADO: a tabela "avaliacoes" tem ${linhas} linha(s) que não são deste teste.`,
        '',
        'Este teste escreve no banco de produção, que é o único que existe. Ele só',
        'roda com a tabela vazia, de propósito: depois do primeiro voto real, rodar',
        '`npm test` colocaria voto de mentira no meio da apuração.',
        '',
        'Se essas linhas são descartáveis, apague-as antes de rodar.',
        'Se são votos reais do festival, NÃO rode este teste — nem com a tabela limpa',
        'depois, porque o que já foi apurado não volta.',
        '',
      ].join('\n'),
    )
  }
}

/**
 * Os testes que votam só fazem sentido dentro do período do festival (Art. 16).
 * Fora dele o servidor recusa — corretamente — e o teste falharia por um motivo
 * que não é o dele.
 *
 * Sobe o servidor com uma data de dentro do festival para rodá-los:
 *   BOTECO_FASE_HOJE=2026-09-25 npm run dev
 */
export async function servidorAceitaVoto(base: string): Promise<boolean> {
  try {
    const r = await fetch(`${base}/votar/bar-do-fuba`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(4000),
    })
    const destino = r.headers.get('location') ?? ''
    return !destino.includes('ainda-nao-comecou') && !destino.includes('ja-encerrou')
  } catch {
    return false
  }
}

export const AVISO_FORA_DO_PERIODO =
  'servidor fora do período do festival — suba com BOTECO_FASE_HOJE=2026-09-25 npm run dev'
