import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { situacaoDaCasa } from '@/lib/horarios'
import { PISO_MINIMO_PERCENTUAL } from '@/data/edicao'
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
  /** Posição no ranking. `0` para quem não é elegível ou não tem voto. */
  posicao: number
  slug: string
  nome: string
  ativa: boolean
  avaliacoes: number
  anuladas: number
  /** Nota final na escala do regulamento: 0 a 20 pontos. */
  mediaGeral: number | null
  /** Média por critério, 0 a 5 cada — é assim que o regulamento os define. */
  medias: Record<string, number | null>
  /** Alcançou o piso mínimo de avaliações para concorrer. */
  elegivel: boolean
  /** Art. 22: desclassificada por fraude comprovada. Fora do ranking. */
  desclassificada: boolean
  desclassificadaMotivo: string | null
}

export type Apuracao = {
  linhas: LinhaDaApuracao[]
  /** Total de avaliações válidas do festival. */
  votos: number
  /** Média de avaliações por casa — base do piso mínimo. */
  mediaDeAvaliacoes: number
  /** Mínimo de avaliações para concorrer: 10% da média do festival. */
  piso: number
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
  desclassificada_em: string | null
  desclassificada_motivo: string | null
}

const media = (valores: number[]): number | null =>
  valores.length === 0 ? null : valores.reduce((s, v) => s + v, 0) / valores.length

async function lerTudo() {
  const banco = supabaseAdmin()
  const [casas, avaliacoes] = await Promise.all([
    banco
      .from('casas')
      .select('id, slug, nome, ativa, horarios, desclassificada_em, desclassificada_motivo')
      .order('nome'),
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

export async function apurar(): Promise<Apuracao> {
  const { casas, avaliacoes } = await lerTudo()
  return calcularApuracao(casas, avaliacoes)
}

/**
 * A conta do regulamento, separada do banco de propósito: assim ela pode ser
 * testada com números escolhidos, inclusive o exemplo do Art. 18, sem escrever
 * uma linha no Supabase. Regra de apuração não pode depender de alguém lembrar
 * dela — ver `tests/apuracao.test.ts`.
 */
export function calcularApuracao(
  casas: Pick<
    CasaBruta,
    'id' | 'slug' | 'nome' | 'ativa' | 'desclassificada_em' | 'desclassificada_motivo'
  >[],
  avaliacoes: Pick<
    AvaliacaoBruta,
    | 'casa_id'
    | 'nota_apresentacao'
    | 'nota_sabor'
    | 'nota_criatividade'
    | 'nota_atendimento'
    | 'anulada_em'
  >[],
): Apuracao {
  const desclassificadas = new Set(
    casas.filter((c) => c.desclassificada_em !== null).map((c) => c.id),
  )

  /**
   * Avaliação de casa desclassificada sai da base do piso.
   *
   * Se ficasse, o volume que motivou a desclassificação — possivelmente
   * fraudulento — inflaria a média do festival e subiria o piso do Art. 18
   * para todo mundo, podendo derrubar casa pequena e honesta. A fraude puniria
   * quem não a cometeu.
   */
  const validasDoFestival = avaliacoes.filter(
    (a) => a.anulada_em === null && !desclassificadas.has(a.casa_id),
  )
  const casasDoFestival =
    casas.filter((c) => c.ativa && !desclassificadas.has(c.id)).length ||
    casas.filter((c) => !desclassificadas.has(c.id)).length ||
    casas.length

  /**
   * Piso mínimo de elegibilidade do regulamento: a casa precisa alcançar 10%
   * da média de avaliações do festival para concorrer.
   *
   * Existe para impedir que uma casa com três votos altos passe na frente de
   * quem recebeu duzentos. Sem ele, quanto MENOS avaliações a casa tiver, mais
   * fácil fica cravar média alta.
   */
  const mediaDeAvaliacoes = casasDoFestival === 0 ? 0 : validasDoFestival.length / casasDoFestival
  const piso = (mediaDeAvaliacoes * PISO_MINIMO_PERCENTUAL) / 100

  const linhas: LinhaDaApuracao[] = casas.map((casa) => {
    const daCasa = avaliacoes.filter((a) => a.casa_id === casa.id)
    // Anulada continua no banco como lastro, mas não entra em conta nenhuma.
    const validas = daCasa.filter((a) => a.anulada_em === null)

    const medias: Record<string, number | null> = {}
    for (const criterio of CRITERIOS_DA_APURACAO) {
      medias[criterio.chave] = media(
        validas.map((a) => a[criterio.coluna as keyof typeof a] as number),
      )
    }

    /**
     * Nota final na escala do regulamento: **0 a 20 pontos**, não 0 a 5.
     *
     * Cada avaliação vale a soma dos quatro critérios (4 × 5 = 20), e a nota
     * final é a média aritmética simples dessas somas. Dividir por quatro daria
     * o mesmo ranking, mas o número publicado seria outro — e é este número que
     * a ACIA lê, divulga e coloca no certificado.
     */
    const mediaGeral = media(
      validas.map(
        (a) => a.nota_apresentacao + a.nota_sabor + a.nota_criatividade + a.nota_atendimento,
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
      // Art. 22: desclassificada nunca concorre, tenha a nota que tiver.
      elegivel:
        casa.desclassificada_em === null && validas.length > 0 && validas.length >= piso,
      desclassificada: casa.desclassificada_em !== null,
      desclassificadaMotivo: casa.desclassificada_motivo,
    }
  })

  // Não elegível vai para o fim, junto de quem não tem voto nenhum.
  linhas.sort((a, b) => {
    if (a.elegivel !== b.elegivel) return a.elegivel ? -1 : 1
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

  // Só quem é elegível recebe posição — quem está abaixo do piso não entra
  // no ranking, e não pode ocupar o lugar de quem entrou.
  let posicao = 0
  return {
    linhas: linhas.map((linha) => ({
      ...linha,
      posicao: linha.elegivel ? ++posicao : 0,
    })),
    votos: validasDoFestival.length,
    mediaDeAvaliacoes,
    piso,
  }
}

export type Anomalia = 'ip-repetido' | 'ip-em-varias-casas' | 'fora-de-horario' | 'rajada'

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
  /** Quantas avaliações este IP fez nesta casa. */
  doIpNaCasa: number
  /** Em quantas casas diferentes este IP votou. */
  casasDoIp: number
}

export type Limiares = {
  ipPorCasa: number
  ipEmCasas: number
  rajadaMinima: number
  janelaDeRajadaMin: number
}

/**
 * Limiares de anomalia, ajustáveis por variável de ambiente.
 *
 * Ficam configuráveis porque o número certo só aparece com o festival rodando:
 * um sábado de casa cheia produz números que uma terça não produz, e trocar
 * limiar não pode exigir deploy no meio do evento.
 */
const numeroDoAmbiente = (nome: string, padrao: number): number => {
  const bruto = Number(process.env[nome])
  return Number.isFinite(bruto) && bruto > 0 ? bruto : padrao
}

export function limiares(): Limiares {
  return {
    /**
     * Avaliações do mesmo IP **na mesma casa**.
     *
     * 15 e não 3: o wi-fi do próprio bar faz dezenas de clientes honestos
     * saírem pelo mesmo endereço, e o 4G também — as operadoras usam CGNAT e
     * compartilham um IP entre milhares de assinantes. Numa sexta cheia, três
     * avaliações do mesmo IP é o normal, não a exceção.
     */
    ipPorCasa: numeroDoAmbiente('PAINEL_LIMIAR_IP_POR_CASA', 15),
    /**
     * Casas diferentes avaliadas pelo mesmo IP.
     *
     * Sinal mais específico que volume: quem está no wi-fi de um bar avalia
     * aquele bar. Um IP que aparece em muitas casas não esteve fisicamente em
     * todas — **mas veja a ressalva do CGNAT na tela de auditoria**, porque um
     * IP de operadora móvel cobre a cidade inteira.
     */
    ipEmCasas: numeroDoAmbiente('PAINEL_LIMIAR_IP_EM_CASAS', 5),
    rajadaMinima: numeroDoAmbiente('PAINEL_LIMIAR_RAJADA', 8),
    janelaDeRajadaMin: numeroDoAmbiente('PAINEL_JANELA_RAJADA_MIN', 5),
  }
}

type AvaliacaoDaAuditoria = Pick<
  AvaliacaoBruta,
  | 'id'
  | 'casa_id'
  | 'criada_em'
  | 'ip'
  | 'user_agent'
  | 'nota_apresentacao'
  | 'nota_sabor'
  | 'nota_criatividade'
  | 'nota_atendimento'
  | 'anulada_em'
  | 'anulada_motivo'
>

/**
 * A detecção, separada do banco para poder ser testada com cenários montados —
 * wi-fi de bar cheio, CGNAT de operadora, dono do bar votando sozinho.
 */
export function calcularAuditoria(
  casas: Pick<CasaBruta, 'id' | 'slug' | 'nome' | 'horarios'>[],
  avaliacoes: AvaliacaoDaAuditoria[],
  limites: Limiares = limiares(),
): LinhaDaAuditoria[] {
  const porId = new Map(casas.map((c) => [c.id, c]))

  // Quantas avaliações cada IP fez em cada casa, e em quantas casas apareceu.
  const porIpECasa = new Map<string, number>()
  const casasPorIp = new Map<string, Set<string>>()
  for (const a of avaliacoes) {
    if (!a.ip) continue
    const chave = `${a.ip}|${a.casa_id}`
    porIpECasa.set(chave, (porIpECasa.get(chave) ?? 0) + 1)
    if (!casasPorIp.has(a.ip)) casasPorIp.set(a.ip, new Set())
    casasPorIp.get(a.ip)!.add(a.casa_id)
  }

  // Rajada: para cada avaliação, quantas outras da mesma casa caíram na janela.
  const janela = limites.janelaDeRajadaMin * 60 * 1000
  const emRajada = new Set<string>()
  for (const casa of casas) {
    const daCasa = avaliacoes
      .filter((a) => a.casa_id === casa.id)
      .map((a) => ({ id: a.id, t: Date.parse(a.criada_em) }))
      .sort((x, y) => x.t - y.t)

    let inicio = 0
    for (let fim = 0; fim < daCasa.length; fim++) {
      while (daCasa[fim].t - daCasa[inicio].t > janela) inicio++
      if (fim - inicio + 1 >= limites.rajadaMinima) {
        for (let k = inicio; k <= fim; k++) emRajada.add(daCasa[k].id)
      }
    }
  }

  return avaliacoes.map((a) => {
    const casa = porId.get(a.casa_id)
    const anomalias: Anomalia[] = []

    const doIpNaCasa = a.ip ? (porIpECasa.get(`${a.ip}|${a.casa_id}`) ?? 0) : 0
    const casasDoIp = a.ip ? (casasPorIp.get(a.ip)?.size ?? 0) : 0

    if (doIpNaCasa >= limites.ipPorCasa) anomalias.push('ip-repetido')
    if (casasDoIp >= limites.ipEmCasas) anomalias.push('ip-em-varias-casas')
    if (emRajada.has(a.id)) anomalias.push('rajada')

    // Só acusa horário quando a casa tem horário cadastrado: com `{}` todo
    // voto seria "fora de horário", e o alerta viraria ruído.
    const situacao = situacaoDaCasa(casa?.horarios ?? {}, new Date(a.criada_em))
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
      doIpNaCasa,
      casasDoIp,
    }
  })
}

export async function auditar(): Promise<LinhaDaAuditoria[]> {
  const { casas, avaliacoes } = await lerTudo()
  return calcularAuditoria(casas, avaliacoes)
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
  desclassificada_em: string | null
  desclassificada_motivo: string | null
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
