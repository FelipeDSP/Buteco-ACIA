import { CRITERIOS } from '@/data/edicao'

/**
 * Versão do texto de aceite. Fica gravada em cada avaliação para que, se o
 * texto mudar, ainda se saiba exatamente o que cada pessoa aceitou.
 */
export const ACEITE_VERSAO = '2026-09-01'

export const NOTA_MINIMA = 0
export const NOTA_MAXIMA = 5

/** Coluna do banco correspondente a cada critério do regulamento. */
export const COLUNA_DA_NOTA: Record<string, string> = {
  apresentacao: 'nota_apresentacao',
  sabor: 'nota_sabor',
  criatividade: 'nota_criatividade',
  atendimento: 'nota_atendimento',
}

export type Notas = Record<string, number>

/**
 * As quatro notas, cada uma inteira de 0 a 5. O cliente já valida, mas quem
 * decide é aqui: um POST pode chegar sem passar pelo formulário.
 */
export function validarNotas(bruto: unknown): { ok: true; notas: Notas } | { ok: false } {
  if (!bruto || typeof bruto !== 'object') return { ok: false }
  const entrada = bruto as Record<string, unknown>
  const notas: Notas = {}

  for (const criterio of CRITERIOS) {
    const valor = entrada[criterio.chave]
    if (typeof valor !== 'number' || !Number.isInteger(valor)) return { ok: false }
    if (valor < NOTA_MINIMA || valor > NOTA_MAXIMA) return { ok: false }
    notas[criterio.chave] = valor
  }

  return { ok: true, notas }
}

/** Mapeia as notas validadas para as colunas separadas — nunca a soma. */
export function colunasDasNotas(notas: Notas): Record<string, number> {
  const linha: Record<string, number> = {}
  for (const [chave, nota] of Object.entries(notas)) {
    const coluna = COLUNA_DA_NOTA[chave]
    if (coluna) linha[coluna] = nota
  }
  return linha
}
