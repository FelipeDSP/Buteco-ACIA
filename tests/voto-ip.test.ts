import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AVISO_FORA_DO_PERIODO, exigirBancoSemVotosReais, servidorAceitaVoto } from './guarda'

/**
 * Teste de ponta a ponta do que importa para a auditoria: o IP que chega no
 * cabeçalho do pedido tem que ser o IP gravado na coluna `ip`.
 *
 * Sem isto, em produção na Vercel todos os votos gravariam o endereço da edge
 * e o log perderia a função — parece que está funcionando, e não está.
 *
 * O teste fala com o servidor de desenvolvimento e com o banco de verdade.
 * Escreve duas linhas e apaga as duas no fim. Se o servidor não estiver no ar,
 * ele avisa e passa em branco em vez de falhar.
 */

// Nome próprio de propósito: `BASE_URL` colide com a variavel que o Vite
// define sozinha como '/', e o teste se pulava achando o servidor fora do ar.
const BASE = process.env.BOTECO_BASE_URL ?? 'http://localhost:3311'
const CASA = 'bar-do-fuba'

/** TEST-NET-3 (RFC 5737): reservado para documentação, nunca é IP de alguém. */
const IP_DO_VISITANTE = '203.0.113.45'
const IP_DO_PROXY = '70.41.3.18'
const CABECALHO = `${IP_DO_VISITANTE}, ${IP_DO_PROXY}`
const AGENTE = 'BotecoACIA-Teste/1.0 (verificacao de auditoria)'

/** CPF matematicamente válido, reservado para este teste. */
const CPF = '11144477735'

function lerEnvLocal(): Record<string, string> {
  const bruto = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8')
  const env: Record<string, string> = {}
  for (const linha of bruto.split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(linha.trim())
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

const env = lerEnvLocal()
const banco = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const cpfHash = createHmac('sha256', env.CPF_PEPPER).update(CPF).digest('hex')

async function servidorNoAr() {
  try {
    const r = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(4000) })
    return r.ok
  } catch {
    return false
  }
}

const limpar = async () => {
  await banco.from('avaliacoes').delete().eq('cpf_hash', cpfHash)
  await banco.from('sessoes').delete().eq('user_agent', AGENTE)
}

describe('x-forwarded-for chega gravado na coluna ip', () => {
  // A checagem vive no beforeAll, e não no corpo do describe: I/O na hora da
  // coleta é frágil e faz o teste se pular sozinho sem dizer por que.
  let noAr = false
  let noPeriodo = false

  beforeAll(async () => {
    // A trava vem antes de qualquer coisa: se houver voto real na tabela, nem
    // chega a checar o servidor. Lança aqui e a suíte inteira para.
    await exigirBancoSemVotosReais(banco, cpfHash)

    noAr = await servidorNoAr()
    if (noAr) {
      noPeriodo = await servidorAceitaVoto(BASE)
      await limpar()
    }
  })
  afterAll(async () => {
    if (noAr) await limpar()
  })

  it(
    'o IP do visitante, e não o do proxy, vai para o banco',
    async (ctx) => {
      if (!noAr) ctx.skip(`servidor fora do ar em ${BASE} — suba com npm run dev`)
      if (!noPeriodo) ctx.skip(AVISO_FORA_DO_PERIODO)

      const cabecalhos = { 'x-forwarded-for': CABECALHO, 'user-agent': AGENTE }

      // 1. Abre a sessão como se fosse a leitura do QR.
      const abertura = await fetch(`${BASE}/votar/${CASA}`, {
        headers: cabecalhos,
        redirect: 'manual',
      })
      const cookie = abertura.headers.get('set-cookie')?.split(';')[0]
      expect(cookie, 'a rota do QR precisa devolver o cookie da sessão').toBeTruthy()

      // 2. Vota, mandando o mesmo cabeçalho que um visitante real mandaria.
      const voto = await fetch(`${BASE}/api/voto`, {
        method: 'POST',
        headers: { ...cabecalhos, 'content-type': 'application/json', cookie: cookie! },
        body: JSON.stringify({
          slug: CASA,
          cpf: CPF,
          aceite: true,
          notas: { apresentacao: 4, sabor: 5, criatividade: 3, atendimento: 4 },
        }),
      })
      expect(await voto.json()).toEqual({ ok: true })

      // 3. O que interessa: a coluna guardou o IP do visitante.
      const { data } = await banco
        .from('avaliacoes')
        .select('ip, user_agent, sessao_id')
        .eq('cpf_hash', cpfHash)
        .single()

      expect(data).toBeTruthy()
      // `inet` devolve o IPv4 com a máscara implícita.
      expect(String(data!.ip).replace('/32', '')).toBe(IP_DO_VISITANTE)
      expect(String(data!.ip)).not.toContain(IP_DO_PROXY)
      expect(data!.user_agent).toBe(AGENTE)

      // 4. A sessão criada na leitura do QR guardou o mesmo IP.
      const { data: sessao } = await banco
        .from('sessoes')
        .select('ip')
        .eq('id', data!.sessao_id)
        .single()
      expect(String(sessao!.ip).replace('/32', '')).toBe(IP_DO_VISITANTE)
    },
    20_000,
  )

})
