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

/** Datas em fuso de Ariquemes (UTC−4). Mês é 1-indexado aqui de propósito. */
export const CALENDARIO = {
  inicioFestival: '2026-09-19',
  fimFestival: '2026-10-10',
  inicioApuracao: '2026-10-11',
  fimApuracao: '2026-10-13',
  /** Data em que a aba "Vencedores" passa a existir no menu. */
  divulgacao: '2026-10-14',
} as const

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

