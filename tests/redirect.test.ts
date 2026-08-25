import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AVISO_FORA_DO_PERIODO, exigirBancoSemVotosReais, servidorAceitaVoto } from './guarda'

/**
 * O QR da mesa é lido por um celular na rede local, e o redirect precisa
 * apontar para o host que ESSE celular pediu.
 *
 * O bug que este teste tranca: `new URL(caminho, request.url)` deriva do
 * endereço em que o servidor escuta. Com `next dev -H 0.0.0.0`, o celular
 * escaneava 192.168.1.26:3311 e recebia um Location para 0.0.0.0:3311 —
 * ERR_CONNECTION_REFUSED, com o QR na mesa e o cliente esperando.
 */

const BASE = process.env.BOTECO_BASE_URL ?? 'http://localhost:3311'
const CASA = 'bar-do-fuba'

/** O endereço que o celular de verdade usou quando o bug apareceu. */
const HOST_DO_CELULAR = '192.168.1.26:3311'
const AGENTE = 'BotecoACIA-Teste-Redirect/1.0'

/** Endereços que só existem do lado de dentro da máquina. */
const NAO_ACESSIVEIS_DE_FORA = ['0.0.0.0', 'localhost', '127.0.0.1', '[::]', '::1']

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
/** Só para a trava saber o que é "linha deste teste". */
const cpfHash = createHmac('sha256', env.CPF_PEPPER).update('11144477735').digest('hex')

async function servidorNoAr() {
  try {
    return (await fetch(`${BASE}/`, { signal: AbortSignal.timeout(4000) })).ok
  } catch {
    return false
  }
}

/** Abrir o QR cria sessão; este teste não vota, então limpa só o que criou. */
const limpar = () => banco.from('sessoes').delete().eq('user_agent', AGENTE)

async function locationDe(caminho: string): Promise<string | null> {
  const resposta = await fetch(`${BASE}${caminho}`, {
    headers: { host: HOST_DO_CELULAR, 'user-agent': AGENTE },
    redirect: 'manual',
  })
  expect(resposta.status).toBe(307)
  return resposta.headers.get('location')
}

describe('o formulário de voto nunca manda o CPF pela URL', () => {
  let noAr = false
  let noPeriodo = false

  beforeAll(async () => {
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
    'o form é method="post", então um submit nativo não vira query string',
    async (ctx) => {
      if (!noAr) ctx.skip(`servidor fora do ar em ${BASE}`)
      if (!noPeriodo) ctx.skip(AVISO_FORA_DO_PERIODO)

      // Abre a sessão e busca o HTML da tela de voto do jeito que o navegador
      // buscaria, seguindo o redirect e levando o cookie.
      const abertura = await fetch(`${BASE}/votar/${CASA}`, {
        headers: { 'user-agent': AGENTE },
        redirect: 'manual',
      })
      const cookie = abertura.headers.get('set-cookie')?.split(';')[0]
      const html = await fetch(`${BASE}/votar/${CASA}/avaliar`, {
        headers: { 'user-agent': AGENTE, cookie: cookie! },
      }).then((r) => r.text())

      const form = /<form[^>]*>/i.exec(html)?.[0] ?? ''
      expect(form, 'a tela de voto precisa ter um <form>').toBeTruthy()

      // Sem method, o padrão do HTML é GET — e aí os campos, CPF inclusive,
      // vão para a barra de endereço, para o histórico e para o log de acesso.
      // Foi o que aconteceu no celular quando o JavaScript não carregou.
      expect(form.toLowerCase(), `<form> sem method="post": ${form}`).toContain('method="post"')
    },
    20_000,
  )
})

describe('redirect do QR respeita o host que o visitante pediu', () => {
  let noAr = false
  let noPeriodo = false

  beforeAll(async () => {
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
    'não devolve endereço de bind no Location',
    async (ctx) => {
      if (!noAr) ctx.skip(`servidor fora do ar em ${BASE} — suba com npm run dev`)
      if (!noPeriodo) ctx.skip(AVISO_FORA_DO_PERIODO)

      const location = await locationDe(`/votar/${CASA}`)
      expect(location, 'o redirect precisa trazer Location').toBeTruthy()

      for (const endereco of NAO_ACESSIVEIS_DE_FORA) {
        expect(
          location,
          `Location aponta para ${endereco}, que não existe fora da máquina`,
        ).not.toContain(endereco)
      }
    },
    20_000,
  )

  it(
    'usa caminho relativo, que o navegador resolve contra o host original',
    async (ctx) => {
      if (!noAr) ctx.skip('servidor fora do ar')
      if (!noPeriodo) ctx.skip(AVISO_FORA_DO_PERIODO)

      const location = await locationDe(`/votar/${CASA}`)
      expect(location?.startsWith('/'), `Location deveria ser relativo, veio "${location}"`).toBe(
        true,
      )
      expect(location).toBe(`/votar/${CASA}/avaliar`)
    },
    20_000,
  )

  it(
    'o mesmo vale para o redirect de erro, não só o do caminho feliz',
    async (ctx) => {
      if (!noAr) ctx.skip('servidor fora do ar')
      if (!noPeriodo) ctx.skip(AVISO_FORA_DO_PERIODO)

      // Slug inexistente cai no ramo de erro, que também redireciona.
      const location = await locationDe('/votar/casa-que-nao-existe')
      expect(location).toBe('/votar/casa-que-nao-existe/avaliar?erro=casa')
      for (const endereco of NAO_ACESSIVEIS_DE_FORA) {
        expect(location).not.toContain(endereco)
      }
    },
    20_000,
  )
})
