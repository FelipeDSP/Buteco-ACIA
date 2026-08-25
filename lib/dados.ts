/**
 * Porta de entrada única para o conteúdo do site.
 *
 * As casas vivem na tabela `casas` do Supabase. Nenhuma página fala com o
 * banco direto — quando a fonte mudar de novo, só este arquivo muda.
 *
 * As funções que tocam o banco são assíncronas, e não tem como não serem.
 * As puras (`nomeDoPrato`, `linkComoChegar`, `enderecoCompleto`) continuam
 * síncronas e moram em `lib/tipos.ts`, para os componentes de cliente poderem
 * usá-las sem arrastar o Supabase para o bundle.
 */

import { supabase } from '@/lib/supabase'
import {
  CIDADE,
  UF,
  enderecoCompleto,
  linkComoChegar,
  nomeDoPrato,
  type Casa,
  type Horarios,
  type TipoCasa,
} from '@/lib/tipos'
import { diasEntre } from '@/lib/fase'
import {
  CALENDARIO,
  CRITERIOS,
  DESEMPATE,
  EDICAO,
  NOTA_MAXIMA_POR_CRITERIO,
  NOTA_MAXIMA_TOTAL,
  PISO_MINIMO_PERCENTUAL,
  PREMIACAO,
  PREMIO_DE_PARTICIPACAO,
} from '@/data/edicao'

export type { Casa, TipoCasa, Horarios }
export { enderecoCompleto, linkComoChegar, nomeDoPrato, CIDADE, UF }
export {
  CALENDARIO,
  CRITERIOS,
  DESEMPATE,
  EDICAO,
  NOTA_MAXIMA_POR_CRITERIO,
  NOTA_MAXIMA_TOTAL,
  PISO_MINIMO_PERCENTUAL,
  PREMIACAO,
  PREMIO_DE_PARTICIPACAO,
}

/** Colunas pedidas ao PostgREST. Explícitas para não trazer lixo novo sozinho. */
const COLUNAS =
  'id, slug, nome, prato, prato_confirmado, preco, descricao, foto_url, categoria, bairro, endereco, instagram, telefone, lat, lng, horarios, ordem'

type Linha = {
  id: string
  slug: string
  nome: string
  prato: string | null
  prato_confirmado: boolean
  preco: string | null
  descricao: string | null
  foto_url: string | null
  categoria: string | null
  bairro: string | null
  endereco: string | null
  instagram: string | null
  telefone: string | null
  /** `numeric` do Postgres chega como string pelo PostgREST, não como número. */
  lat: string | number | null
  lng: string | number | null
  horarios: Horarios | null
  ordem: number | null
}

const numero = (v: string | number | null): number | null => {
  if (v === null) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function daLinha(l: Linha): Casa {
  return {
    id: l.id,
    slug: l.slug,
    nome: l.nome,
    tipo: l.categoria ?? '',
    bairro: l.bairro ?? '',
    endereco: l.endereco ?? '',
    prato: {
      nome: l.prato ?? '',
      confirmado: l.prato_confirmado,
      preco: l.preco,
      descricao: l.descricao ?? '',
      foto: l.foto_url,
    },
    instagram: l.instagram,
    telefone: l.telefone,
    lat: numero(l.lat),
    lng: numero(l.lng),
    horarios: l.horarios ?? {},
  }
}

/**
 * Uma leitura por render, no máximo. Sem isto a home bate no banco umas seis
 * vezes na mesma requisição — a lista, a faixa de números, o mapa, o leque.
 * O cache do React dura só o ciclo da requisição, então não serve dado velho.
 */
import { cache } from 'react'

export const listarCasas = cache(async (): Promise<Casa[]> => {
  const { data, error } = await supabase
    .from('casas')
    .select(COLUNAS)
    .eq('ativa', true)
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true })

  if (error) throw new Error(`Falha ao ler as casas: ${error.message}`)
  return (data as Linha[]).map(daLinha)
})

export async function contarCasas(): Promise<number> {
  return (await listarCasas()).length
}

export async function obterCasa(slug: string): Promise<Casa | undefined> {
  return (await listarCasas()).find((c) => c.slug === slug)
}

export async function listarBairros(): Promise<string[]> {
  const casas = await listarCasas()
  return [...new Set(casas.map((c) => c.bairro).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
}

export async function listarTipos(): Promise<TipoCasa[]> {
  const casas = await listarCasas()
  return [...new Set(casas.map((c) => c.tipo).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
}

/** Sugestões de outras casas — as mais próximas quando há coordenada. */
export async function outrasCasas(slug: string, quantas: number): Promise<Casa[]> {
  const todas = await listarCasas()
  const atual = todas.find((c) => c.slug === slug)
  const resto = todas.filter((c) => c.slug !== slug)
  if (!atual || atual.lat == null || atual.lng == null) return resto.slice(0, quantas)

  const distancia = (c: Casa) =>
    c.lat == null || c.lng == null
      ? Number.POSITIVE_INFINITY
      : (c.lat - atual.lat!) ** 2 + (c.lng - atual.lng!) ** 2

  return [...resto].sort((a, b) => distancia(a) - distancia(b)).slice(0, quantas)
}

/** Acento não pode atrapalhar quem digita com pressa no celular. */
const semAcento = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export type Consulta = { bairro?: string; busca?: string }

/** Busca da home: casa, prato ou tipo. Bairro é filtro, não busca. */
export async function buscarCasas({ bairro, busca }: Consulta): Promise<Casa[]> {
  const termo = semAcento((busca ?? '').trim())

  return (await listarCasas()).filter((casa) => {
    if (bairro && casa.bairro !== bairro) return false
    if (!termo) return true
    return (
      semAcento(casa.nome).includes(termo) ||
      semAcento(casa.prato.nome).includes(termo) ||
      semAcento(casa.tipo).includes(termo)
    )
  })
}

/** Dias de festival, contando o primeiro e o último. */
export function diasDeFestival(): number {
  return diasEntre(CALENDARIO.inicioFestival, CALENDARIO.fimFestival) + 1
}

/** Soma em dinheiro dos prêmios. Placa e certificado não entram na conta. */
export function premiacaoEmDinheiro(): number {
  return PREMIACAO.reduce((soma, p) => soma + (p.valor ?? 0), 0)
}
