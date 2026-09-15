import { CRITERIOS } from '@/data/edicao'

/**
 * Versão do texto de aceite. Fica gravada em cada avaliação para que, se o
 * texto mudar, ainda se saiba exatamente o que cada pessoa aceitou.
 *
 * Subiu para 27/08/2026 quando a ACIA decidiu gravar o CPF em claro, e para
 * 15/09/2026 quando o texto passou a citar a avaliação do garçom. **Não
 * baixar nem reaproveitar uma versão anterior:** quem votou sob `2026-09-01`
 * aceitou um texto que dizia que o CPF não era guardado, e essa diferença
 * precisa continuar legível na tabela depois do festival.
 */
export const ACEITE_VERSAO = '2026-09-15'

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

/** Limite da observação. Vale no cliente, no servidor e no banco. */
export const COMENTARIO_MAXIMO = 400

/**
 * A observação não participa de cálculo nenhum — nem da média, nem do
 * desempate, nem do piso. É devolutiva para a casa, e só.
 *
 * Vazio vira `null` em vez de string vazia: no banco, "não escreveu nada" e
 * "escreveu espaços" precisam ser a mesma coisa.
 */
export function limparComentario(bruto: unknown): { ok: true; texto: string | null } | { ok: false } {
  if (bruto === undefined || bruto === null) return { ok: true, texto: null }
  if (typeof bruto !== 'string') return { ok: false }

  const texto = bruto.trim()
  if (texto === '') return { ok: true, texto: null }
  if (texto.length > COMENTARIO_MAXIMO) return { ok: false }
  return { ok: true, texto }
}

/** Limite do nome de quem atendeu. Vale no cliente, no servidor e no banco. */
export const GARCOM_NOME_MAXIMO = 60

export type Garcom = { nome: string; nota: number }

/**
 * Avaliação de quem atendeu — opcional, e **fora do regulamento**: não é
 * critério, não entra em média, desempate nem piso. É devolutiva para a casa,
 * como a observação, e vai para tabela própria sem ligação com o voto.
 *
 * Ou vem inteira (nome e nota) ou não vem. Nota sem nome não serve à casa —
 * ela não sabe de quem é — e nome sem nota não diz nada. O cliente já
 * bloqueia a metade solta; aqui é recusada de novo porque um POST pode chegar
 * sem passar pelo formulário.
 */
export function limparGarcom(
  bruto: unknown,
): { ok: true; garcom: Garcom | null } | { ok: false; erro: string } {
  if (bruto === undefined || bruto === null) return { ok: true, garcom: null }
  if (typeof bruto !== 'object') return { ok: false, erro: 'Avaliação do atendimento malformada.' }

  const { nome: nomeBruto, nota } = bruto as { nome?: unknown; nota?: unknown }
  const nome = typeof nomeBruto === 'string' ? nomeBruto.replace(/\s+/g, ' ').trim() : ''
  const temNota = nota !== undefined && nota !== null

  if (nome === '' && !temNota) return { ok: true, garcom: null }
  if (nome === '') return { ok: false, erro: 'Escreva o nome de quem te atendeu, ou tire a nota.' }
  if (!temNota) return { ok: false, erro: 'Dê uma nota de 0 a 5 para quem te atendeu, ou apague o nome.' }

  if (nome.length < 2 || nome.length > GARCOM_NOME_MAXIMO) {
    return { ok: false, erro: `O nome de quem te atendeu precisa ter de 2 a ${GARCOM_NOME_MAXIMO} letras.` }
  }
  if (typeof nota !== 'number' || !Number.isInteger(nota) || nota < NOTA_MINIMA || nota > NOTA_MAXIMA) {
    return { ok: false, erro: 'A nota para quem te atendeu vai de 0 a 5.' }
  }

  return { ok: true, garcom: { nome, nota } }
}
