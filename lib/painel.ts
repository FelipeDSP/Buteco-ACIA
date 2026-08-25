import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { situacaoDaCasa } from '@/lib/horarios'
import type { Horarios } from '@/lib/tipos'

/**
 * Leitura de dados do painel. Tudo com `service_role`, porque `avaliacoes` e
 * `sessoes` não têm policy de RLS — nenhuma outra chave enxerga uma linha.
 *
 * A agregação é feita em JavaScript, não em SQL. Com doze casas e alguns
 * milhares de votos isso é instantâneo, e evita criar função no banco — o
 * schema é do usuário. Se um dia passar de umas dezenas de milhares de
 * avaliações, vira uma view materializada.
 */

export const CRITERIOS_DA_APURACAO = [
  { chave: 'apresentacao', coluna: 'nota_apresentacao', nome: 'Apresentação' },
  { chave: 'sabor', coluna: 'nota_sabor', nome: 'Sabor' },
  { chave: 'criatividade', coluna: 'nota_criatividade', nome: 'Criatividade' },
  { chave: 'atendimento', coluna: 'nota_atendimento', nome: 'Atendimento' },
] as const

export type LinhaDaApuracao = {
  posicao: number
  slug: string
  nome: string
  ativa: boolean
  avaliacoes: number
  anuladas: number
  mediaGeral: number | null
  medias: Record<string, number | null>
}

type AvaliacaoBruta = {
  id: string
  casa_id: string
  criada_em: string
  ip: string | null
  user_agent: string | null
  nota_apresentacao: number
  nota_sabor: number
  nota_criatividade: number
  nota_atendimento: number
  anulada_em: string | null
  anulada_motivo: string | null
}

type CasaBruta = {
  id: string
  slug: string
  nome: string
  ativa: boolean
  horarios: Horarios | null
}

const media = (valores: number[]): number | null =>
  valores.length === 0 ? null : valores.reduce((s, v) => s + v, 0) / valores.length

async function lerTudo() {
  const banco = supabaseAdmin()
  const [casas, avaliacoes] = await Promise.all([
    banco.from('casas').select('id, slug, nome, ativa, horarios').order('nome'),
    banco
      .from('avaliacoes')
      .select(
        'id, casa_id, criada_em, ip, user_agent, nota_apresentacao, nota_sabor, nota_criatividade, nota_atendimento, anulada_em, anulada_motivo',
      )
      .order('criada_em', { ascending: false }),
  ])

  if (casas.error) throw new Error(`Falha ao ler casas: ${casas.error.message}`)
  if (avaliacoes.error) throw new Error(`Falha ao ler avaliações: ${avaliacoes.error.message}`)

  return {
    casas: (casas.data ?? []) as CasaBruta[],
    avaliacoes: (avaliacoes.data ?? []) as AvaliacaoBruta[],
  }
}

export async function apurar(): Promise<LinhaDaApuracao[]> {
  const { casas, avaliacoes } = await lerTudo()

  const linhas = casas.map((casa) => {
    const daCasa = avaliacoes.filter((a) => a.casa_id === casa.id)
    // Anulada continua no banco como lastro, mas não entra em conta nenhuma.
    const validas = daCasa.filter((a) => a.anulada_em === null)

    const medias: Record<string, number | null> = {}
    for (const criterio of CRITERIOS_DA_APURACAO) {
      medias[criterio.chave] = media(
        validas.map((a) => a[criterio.coluna as keyof AvaliacaoBruta] as number),
      )
    }

    // Média geral = média das quatro notas de cada avaliação, e não média das
    // médias: com quantidades iguais dá no mesmo, mas assim continua certo se
    // um dia um critério puder ficar em branco.
    const mediaGeral = media(
      validas.map(
        (a) =>
          (a.nota_apresentacao + a.nota_sabor + a.nota_criatividade + a.nota_atendimento) / 4,
      ),
    )

    return {
      posicao: 0,
      slug: casa.slug,
      nome: casa.nome,
      ativa: casa.ativa,
      avaliacoes: validas.length,
      anuladas: daCasa.length - validas.length,
      mediaGeral,
      medias,
    }
  })

  // Casa sem avaliação vai para o fim; entre elas, ordem alfabética.
  linhas.sort((a, b) => {
    if (a.mediaGeral === null && b.mediaGeral === null) return a.nome.localeCompare(b.nome, 'pt-BR')
    if (a.mediaGeral === null) return 1
    if (b.mediaGeral === null) return -1
    if (b.mediaGeral !== a.mediaGeral) return b.mediaGeral - a.mediaGeral
    // Desempate do regulamento: sabor, depois criatividade, depois volume.
    const sabor = (b.medias.sabor ?? 0) - (a.medias.sabor ?? 0)
    if (sabor !== 0) return sabor
    const criatividade = (b.medias.criatividade ?? 0) - (a.medias.criatividade ?? 0)
    if (criatividade !== 0) return criatividade
    return b.avaliacoes - a.avaliacoes
  })

  return linhas.map((linha, i) => ({ ...linha, posicao: i + 1 }))
}

export type Anomalia = 'ip-repetido' | 'fora-de-horario' | 'rajada'

export type LinhaDaAuditoria = {
  id: string
  quando: string
  casa: string
  casaSlug: string
  ip: string | null
  agente: string | null
  notas: Record<string, number>
  anulada: boolean
  motivo: string | null
  anomalias: Anomalia[]
}

/** Acima disto, o mesmo IP deixa de ser coincidência de wi-fi compartilhado. */
const LIMITE_POR_IP = 3
/** Avaliações na mesma casa dentro desta janela contam como rajada. */
const JANELA_DE_RAJADA_MS = 5 * 60 * 1000
const RAJADA_MINIMA = 4

export async function auditar(): Promise<LinhaDaAuditoria[]> {
  const { casas, avaliacoes } = await lerTudo()
  const porId = new Map(casas.map((c) => [c.id, c]))

  const contagemPorIp = new Map<string, number>()
  for (const a of avaliacoes) {
    if (!a.ip) continue
    contagemPorIp.set(a.ip, (contagemPorIp.get(a.ip) ?? 0) + 1)
  }

  // Rajada: para cada avaliação, quantas outras da mesma casa caíram na janela.
  const emRajada = new Set<string>()
  for (const casa of casas) {
    const daCasa = avaliacoes
      .filter((a) => a.casa_id === casa.id)
      .map((a) => ({ id: a.id, t: Date.parse(a.criada_em) }))
      .sort((x, y) => x.t - y.t)

    let inicio = 0
    for (let fim = 0; fim < daCasa.length; fim++) {
      while (daCasa[fim].t - daCasa[inicio].t > JANELA_DE_RAJADA_MS) inicio++
      if (fim - inicio + 1 >= RAJADA_MINIMA) {
        for (let k = inicio; k <= fim; k++) emRajada.add(daCasa[k].id)
      }
    }
  }

  return avaliacoes.map((a) => {
    const casa = porId.get(a.casa_id)
    const anomalias: Anomalia[] = []

    if (a.ip && (contagemPorIp.get(a.ip) ?? 0) > LIMITE_POR_IP) anomalias.push('ip-repetido')
    if (emRajada.has(a.id)) anomalias.push('rajada')

    // Só acusa horário quando a casa tem horário cadastrado: com `{}` todo
    // voto seria "fora de horário", e o alerta viraria ruído.
    const horarios = casa?.horarios ?? {}
    const situacao = situacaoDaCasa(horarios, new Date(a.criada_em))
    if (!situacao.semCadastro && !situacao.aberta) anomalias.push('fora-de-horario')

    return {
      id: a.id,
      quando: a.criada_em,
      casa: casa?.nome ?? '(casa removida)',
      casaSlug: casa?.slug ?? '',
      ip: a.ip,
      agente: a.user_agent,
      notas: {
        apresentacao: a.nota_apresentacao,
        sabor: a.nota_sabor,
        criatividade: a.nota_criatividade,
        atendimento: a.nota_atendimento,
      },
      anulada: a.anulada_em !== null,
      motivo: a.anulada_motivo,
      anomalias,
    }
  })
}

export type CasaDoPainel = {
  id: string
  slug: string
  nome: string
  prato: string | null
  prato_confirmado: boolean
  preco: string | null
  descricao: string | null
  categoria: string | null
  bairro: string | null
  endereco: string | null
  instagram: string | null
  telefone: string | null
  foto_url: string | null
  lat: string | number | null
  lng: string | number | null
  horarios: Horarios | null
  ativa: boolean
  ordem: number | null
  /** Quantas avaliações apontam para esta casa. Zero permite desativar sem susto. */
  avaliacoes: number
}

export async function listarCasasDoPainel(): Promise<CasaDoPainel[]> {
  const { avaliacoes } = await lerTudo()
  const banco = supabaseAdmin()
  const { data, error } = await banco.from('casas').select('*').order('ordem').order('nome')
  if (error) throw new Error(`Falha ao ler casas: ${error.message}`)

  const porCasa = new Map<string, number>()
  for (const a of avaliacoes) porCasa.set(a.casa_id, (porCasa.get(a.casa_id) ?? 0) + 1)

  return (data ?? []).map((c) => ({
    ...(c as Omit<CasaDoPainel, 'avaliacoes'>),
    avaliacoes: porCasa.get((c as { id: string }).id) ?? 0,
  }))
}

export async function obterCasaDoPainel(id: string): Promise<CasaDoPainel | undefined> {
  return (await listarCasasDoPainel()).find((c) => c.id === id)
}

/** Slug a partir do nome. Estável e sem acento, porque vai dentro do QR code. */
export function slugDoNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
