/**
 * Fatos da 1ª edição do Boteco ACIA, conforme regulamento.
 * Nada aqui é estimativa: número, data ou valor que não estiver no
 * regulamento não entra neste arquivo.
 */

export const EDICAO = {
  ano: 2026,
  nome: 'Boteco ACIA 2026',
  ordinal: '1ª edição',
  cidade: 'Ariquemes',
  uf: 'RO',
  hashtag: '#BotecoACIA',
} as const

/**
 * Datas do festival, em fuso de Ariquemes (UTC-4).
 *
 * **Art. 30: a ACIA pode alterar datas com 15 dias de aviso.** Remarcacao e
 * previsao do regulamento, nao excecao — e nao pode depender de deploy, ainda
 * mais se o motivo for algo urgente. Cada data aceita sobrescrita por variavel
 * de ambiente; sem ela vale a data aprovada em assembleia.
 *
 * Valor mal formatado e ignorado com aviso no log, e o padrao prevalece:
 * data torta aqui desliga a votacao inteira, entao errar de leve nao pode
 * derrubar o festival.
 */
const DATA = /^\d{4}-\d{2}-\d{2}$/

function data(variavel: string, padrao: string): string {
  const bruto = process.env[variavel]?.trim()
  if (!bruto) return padrao
  if (!DATA.test(bruto) || Number.isNaN(Date.parse(`${bruto}T00:00:00Z`))) {
    console.warn(`[calendario] ${variavel}="${bruto}" nao e uma data AAAA-MM-DD. Usando ${padrao}.`)
    return padrao
  }
  return bruto
}

export const CALENDARIO = {
  inicioFestival: data('BOTECO_INICIO_FESTIVAL', '2026-09-19'),
  fimFestival: data('BOTECO_FIM_FESTIVAL', '2026-10-10'),
  inicioApuracao: data('BOTECO_INICIO_APURACAO', '2026-10-11'),
  fimApuracao: data('BOTECO_FIM_APURACAO', '2026-10-13'),
  /** Data em que a aba "Vencedores" passa a existir no menu. */
  divulgacao: data('BOTECO_DIVULGACAO', '2026-10-14'),
} as const

/**
 * Ordem cronologica quebrada nao lanca: avisa e segue. O objetivo e nao deixar
 * uma remarcacao pela metade passar despercebida no log de deploy.
 */
if (CALENDARIO.fimFestival < CALENDARIO.inicioFestival) {
  console.warn(
    `[calendario] fim do festival (${CALENDARIO.fimFestival}) e anterior ao inicio (${CALENDARIO.inicioFestival}). A votacao ficara sempre fechada.`,
  )
}

export type Criterio = {
  chave: string
  nome: string
  descricao: string
}

/** Quatro critérios, peso igual, nota de 0 a 5 cada. */
export const CRITERIOS: readonly Criterio[] = [
  {
    chave: 'apresentacao',
    nome: 'Apresentação visual',
    descricao: 'Capricho no empratamento e apelo visual do prato servido.',
  },
  {
    chave: 'sabor',
    nome: 'Sabor',
    descricao: 'Gosto, tempero, equilíbrio, textura e temperatura.',
  },
  {
    chave: 'criatividade',
    nome: 'Criatividade',
    descricao: 'Originalidade da receita e uso de ingredientes regionais.',
  },
  {
    chave: 'atendimento',
    nome: 'Atendimento',
    descricao: 'Simpatia, agilidade e conhecimento da equipe sobre o prato.',
  },
] as const

export const NOTA_MAXIMA_POR_CRITERIO = 5
export const NOTA_MAXIMA_TOTAL = CRITERIOS.length * NOTA_MAXIMA_POR_CRITERIO // 20

/** Ordem de desempate definida no regulamento. */
export const DESEMPATE: readonly string[] = [
  'Maior média em Sabor',
  'Maior média em Criatividade',
  'Maior número de avaliações válidas',
]

/** Piso mínimo de avaliações para a casa ser elegível à premiação. */
export const PISO_MINIMO_PERCENTUAL = 10

export type Premio = {
  posicao: string
  valor: number | null
  extra: string
}

/**
 * Art. 23º, na letra. O termo oficial é "prato personalizado de parede", que o
 * próprio regulamento glosa como "placa decorativa comemorativa" — o site usava
 * só "placa" e omitia a mesa, a lixeira e o destaque na mídia do 1º lugar.
 */
export const PREMIACAO: readonly Premio[] = [
  {
    posicao: '1º lugar',
    valor: 1000,
    extra:
      'Mesa personalizada (Rosalin Mesas), lixeira personalizada (Motopam), prato personalizado de parede, certificado de vencedor e destaque nas redes da ACIA.',
  },
  {
    posicao: '2º lugar',
    valor: 750,
    extra: 'Prato personalizado de parede e certificado.',
  },
  {
    posicao: '3º lugar',
    valor: 500,
    extra: 'Prato personalizado de parede e certificado.',
  },
]

/** Art. 23º: toda casa participante recebe, independentemente da colocação. */
export const PREMIO_DE_PARTICIPACAO =
  'Prato personalizado de parede (placa decorativa comemorativa) e certificado de participação.'

