import { createHmac } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Todo CPF que a suíte usa, num lugar só.
 *
 * A trava conta as linhas que **não** são de teste, e para isso precisa saber
 * quais são. Enquanto os arquivos compartilhavam o mesmo CPF isso não
 * aparecia; no instante em que um teste novo trouxe o seu, os arquivos
 * passaram a se abortar em paralelo — cada um enxergando a linha do outro como
 * voto real.
 *
 * CPF de teste novo entra aqui. Ele também precisa ser **exclusivo** do seu
 * arquivo: dois testes com o mesmo CPF apagam a linha um do outro na limpeza.
 */
export const CPFS_DE_TESTE = [
  '11144477735', // voto-ip.test.ts e redirect.test.ts
  '52998224725', // comentario.test.ts
  '39000000009', // oraculo-cpf.test.ts — o que vota
  '39000000181', // oraculo-cpf.test.ts — o sondado
] as const

/** Os hashes correspondentes, que é o que o banco guarda. */
export function hashesDeTeste(pepper: string): string[] {
  return CPFS_DE_TESTE.map((cpf) => createHmac('sha256', pepper).update(cpf).digest('hex'))
}

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
 *
 * **`observacoes` não é coberta por esta trava, e não tem como ser.** A tabela
 * não guarda `cpf_hash` — é justamente o ponto dela — então não há chave para
 * separar linha de teste de linha real. Teste que envie `comentario` no corpo
 * do voto cria uma observação que esta função não enxerga: ele precisa
 * limpá-la pelo próprio `texto`, usando um marcador exclusivo do arquivo, do
 * mesmo jeito que os CPFs desta lista são exclusivos. Nenhum teste faz isso
 * hoje; o primeiro que fizer tem que trazer a limpeza junto.
 */

export async function exigirBancoSemVotosReais(
  banco: SupabaseClient,
  cpfHashDoTeste: string | string[],
  /** Pepper, para ignorar também os CPFs dos outros arquivos de teste. */
  pepper?: string,
): Promise<void> {
  const proprios = Array.isArray(cpfHashDoTeste) ? cpfHashDoTeste : [cpfHashDoTeste]
  // Ignora o CPF deste teste e o de todos os outros: em paralelo, um arquivo
  // veria a linha do outro e abortaria a suíte inteira sem haver voto real.
  const ignorar = [...new Set([...proprios, ...(pepper ? hashesDeTeste(pepper) : [])])]

  const { count, error } = await banco
    .from('avaliacoes')
    .select('*', { count: 'exact', head: true })
    .not('cpf_hash', 'in', `(${ignorar.join(',')})`)

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
