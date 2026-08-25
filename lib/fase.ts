/**
 * Em que ponto do calendário o festival está.
 *
 * Tudo é calculado no fuso de Ariquemes (UTC−4). O servidor da Vercel roda em
 * UTC — sem isso, entre 20h e 0h a página mostraria o dia seguinte.
 *
 * `BOTECO_FASE_HOJE=2026-09-25` força uma data para conferir o site em outra
 * fase sem mexer no relógio da máquina.
 */

import { CALENDARIO } from '@/data/edicao'

const FUSO = 'America/Porto_Velho'
const DIA_MS = 86_400_000

export type Fase = 'pre-festival' | 'festival' | 'apuracao' | 'divulgado'

/** Data de hoje em Ariquemes, no formato AAAA-MM-DD. */
export function hoje(): string {
  const forcada = process.env.BOTECO_FASE_HOJE
  if (forcada && /^\d{4}-\d{2}-\d{2}$/.test(forcada)) return forcada

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Diferença em dias entre duas datas AAAA-MM-DD. Positivo se `ate` é futuro. */
export function diasEntre(de: string, ate: string): number {
  return Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / DIA_MS)
}

export function faseAtual(dia = hoje()): Fase {
  if (dia < CALENDARIO.inicioFestival) return 'pre-festival'
  if (dia <= CALENDARIO.fimFestival) return 'festival'
  if (dia < CALENDARIO.divulgacao) return 'apuracao'
  return 'divulgado'
}

/** A aba "Vencedores" só existe a partir de 14 de outubro. */
export function mostrarVencedores(dia = hoje()): boolean {
  return dia >= CALENDARIO.divulgacao
}

export type Contagem = {
  fase: Fase
  /** Dias que faltam para o marco da fase. 0 quando o marco é hoje. */
  dias: number
  /** Frase curta pronta para a faixa do topo e para a vitrine. */
  chamada: string
  detalhe: string
}

const plural = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos)

export function contagem(dia = hoje()): Contagem {
  const fase = faseAtual(dia)

  if (fase === 'pre-festival') {
    const dias = diasEntre(dia, CALENDARIO.inicioFestival)
    return {
      fase,
      dias,
      chamada:
        dias === 0
          ? 'O festival começa hoje'
          : `Faltam ${dias} ${plural(dias, 'dia', 'dias')} para começar`,
      detalhe: 'De 19 de setembro a 10 de outubro',
    }
  }

  if (fase === 'festival') {
    const dias = diasEntre(dia, CALENDARIO.fimFestival)
    return {
      fase,
      dias,
      chamada:
        dias === 0
          ? 'Último dia para votar'
          : `Faltam ${dias} ${plural(dias, 'dia', 'dias')} para o fim`,
      detalhe: 'Festival rolando até 10 de outubro',
    }
  }

  if (fase === 'apuracao') {
    const dias = diasEntre(dia, CALENDARIO.divulgacao)
    return {
      fase,
      dias,
      chamada: 'Votação encerrada',
      detalhe: 'Apuração de 11 a 13 de outubro',
    }
  }

  return {
    fase,
    dias: 0,
    chamada: 'Resultado divulgado',
    detalhe: 'Premiação na 2ª quinzena de outubro',
  }
}

/**
 * A votação só existe dentro do festival (Art. 16º: 19/09 a 10/10/2026).
 *
 * Fora da janela o QR precisa recusar, e recusar dizendo qual é o caso — quem
 * lê o QR antes da abertura precisa saber que é cedo, não que está quebrado.
 *
 * Respeita `BOTECO_FASE_HOJE`, então dá para conferir as três situações sem
 * mexer no relógio da máquina.
 */
export type PeriodoFechado = {
  motivo: 'ainda-nao-comecou' | 'ja-encerrou'
  titulo: string
  texto: string
}

export function periodoDeVotacao(dia = hoje()): PeriodoFechado | null {
  const fase = faseAtual(dia)
  if (fase === 'festival') return null

  if (fase === 'pre-festival') {
    const dias = diasEntre(dia, CALENDARIO.inicioFestival)
    return {
      motivo: 'ainda-nao-comecou',
      titulo: 'A votação ainda não começou',
      texto:
        dias === 1
          ? 'O Boteco ACIA abre amanhã, 19 de setembro. Volte a partir de lá e leia o QR de novo.'
          : `O Boteco ACIA começa em 19 de setembro — faltam ${dias} dias. Volte a partir de lá e leia o QR de novo.`,
    }
  }

  return {
    motivo: 'ja-encerrou',
    titulo: 'A votação foi encerrada em 10 de outubro',
    texto:
      'O período de avaliação do Boteco ACIA terminou. As notas estão sendo apuradas e o resultado sai na premiação, na segunda quinzena de outubro.',
  }
}
