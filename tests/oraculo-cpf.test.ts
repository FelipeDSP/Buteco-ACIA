import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AVISO_FORA_DO_PERIODO, exigirBancoSemVotosReais, servidorAceitaVoto } from './guarda'

/**
 * A tela de voto não pode virar consulta de "fulano votou aqui?".
 *
 * O sistema inteiro é construído para não saber quem votou: o CPF vira HMAC e
 * some. Mas a recusa por voto repetido responde a pergunta em texto claro —
 * "Você já avaliou esta casa." —, e enquanto a sessão sobrevivia a essa recusa
 * bastava **uma** leitura do QR para testar CPF atrás de CPF, cada 409 sendo a
 * confirmação de que aquela pessoa votou naquele bar.
 *
 * Quem tem lista de CPF de cliente é justamente o dono da casa. O HMAC protege
 * o banco; sem queimar a sessão, este endpoint contornava o HMAC pela porta da
 * frente.
 *
 * A regra travada aqui: **uma leitura do QR vale uma tentativa, dê ela em quê
 * der.** Sondar custa uma ida física à mesa do bar.
 *
 * Escreve no banco e apaga o que escreveu. Sabotagem que prova o teste: tirar
 * o `update` de `usada_em` do ramo do 23505 em `app/api/voto/route.ts` faz a
 * terceira asserção passar a receber 200.
 */

const BASE = process.env.BOTECO_BASE_URL ?? 'http://localhost:3311'
const CASA = 'imperio-petiscaria'
const AGENTE = 'BotecoACIA-Teste/1.0 (oraculo de cpf)'

/**
 * Dois CPFs matematicamente válidos, **exclusivos deste teste.**
 *
 * Não reaproveitar os de `voto-ip.test.ts`: os arquivos rodam em paralelo
 * contra o mesmo banco, e CPF repetido faz um teste apagar a linha do outro no
 * meio da execução. Foi o que aconteceu na primeira versão — os dois falharam
 * por interferência, não pelo que cada um cobre.
 */
const CPF_QUE_VOTOU = '39000000009'
const CPF_SONDADO = '39000000181'

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
const hash = (cpf: string) => createHmac('sha256', env.CPF_PEPPER).update(cpf).digest('hex')
const HASHES = [hash(CPF_QUE_VOTOU), hash(CPF_SONDADO)]

const limpar = async () => {
  await banco.from('avaliacoes').delete().in('cpf_hash', HASHES)
  await banco.from('sessoes').delete().eq('user_agent', AGENTE)
}

const cabecalhos = { 'user-agent': AGENTE }

/** Uma leitura de QR: devolve o cookie da sessão. */
async function lerOQr(): Promise<string> {
  const r = await fetch(`${BASE}/votar/${CASA}`, { headers: cabecalhos, redirect: 'manual' })
  const cookie = r.headers.get('set-cookie')?.split(';')[0]
  expect(cookie, 'a rota do QR precisa devolver o cookie da sessão').toBeTruthy()
  return cookie!
}

async function votar(cookie: string, cpf: string) {
  const r = await fetch(`${BASE}/api/voto`, {
    method: 'POST',
    headers: { ...cabecalhos, 'content-type': 'application/json', cookie },
    body: JSON.stringify({
      slug: CASA,
      cpf,
      aceite: true,
      notas: { apresentacao: 4, sabor: 4, criatividade: 4, atendimento: 4 },
    }),
  })
  return { status: r.status, corpo: await r.json().catch(() => ({})) }
}

describe('a recusa por CPF repetido não vira oráculo', () => {
  let noAr = false
  let noPeriodo = false

  beforeAll(async () => {
    await exigirBancoSemVotosReais(banco, HASHES, env.CPF_PEPPER)
    try {
      noAr = (await fetch(`${BASE}/`, { signal: AbortSignal.timeout(4000) })).ok
    } catch {
      noAr = false
    }
    if (noAr) {
      noPeriodo = await servidorAceitaVoto(BASE)
      await limpar()
    }
  })
  afterAll(async () => {
    if (noAr) await limpar()
  })

  it(
    'uma leitura do QR vale uma tentativa, mesmo quando ela é recusada',
    async (ctx) => {
      if (!noAr) ctx.skip(`servidor fora do ar em ${BASE} — suba com npm run dev`)
      if (!noPeriodo) ctx.skip(AVISO_FORA_DO_PERIODO)

      // 1. Alguém vota de verdade. A partir daqui, este CPF "já votou".
      expect((await votar(await lerOQr(), CPF_QUE_VOTOU)).status).toBe(200)

      // 2. O sondador lê o QR uma vez e testa o CPF da vítima.
      const sessaoDoSondador = await lerOQr()
      const sonda = await votar(sessaoDoSondador, CPF_QUE_VOTOU)
      expect(sonda.status, 'CPF repetido tem que ser recusado').toBe(409)

      // 3. O ponto do teste: a MESMA sessão não pode servir para uma segunda
      //    tentativa. Se servir, uma leitura do QR sonda a lista inteira.
      const segunda = await votar(sessaoDoSondador, CPF_SONDADO)
      expect(
        segunda.status,
        'a sessão sobreviveu à recusa — uma leitura do QR sonda CPFs sem limite',
      ).toBe(409)
      expect(segunda.corpo.erro).toContain('sessão já virou uma avaliação')

      // 4. E a sonda não pode ter gravado nada em nome do CPF sondado.
      const { count } = await banco
        .from('avaliacoes')
        .select('*', { count: 'exact', head: true })
        .eq('cpf_hash', hash(CPF_SONDADO))
      expect(count ?? 0, 'a sondagem não pode virar voto').toBe(0)
    },
    30_000,
  )
})
