import { DIAS, type DiaDaSemana, type Faixa, type Horarios } from '@/lib/tipos'

/**
 * Janela de funcionamento, no fuso de Ariquemes.
 *
 * O servidor da Vercel roda em UTC. Sem forçar o fuso, entre 20h e 0h a conta
 * cairia no dia seguinte e uma casa aberta apareceria como fechada.
 *
 * **`horarios` vazio significa "sempre aberta".** O dado ainda não foi
 * coletado das casas, e travar a votação por falta de cadastro seria pior que
 * aceitar voto fora de hora — nesta fase, o QR já está na mesa da casa.
 */

const FUSO = 'America/Porto_Velho'

const RELOGIO = new Intl.DateTimeFormat('en-GB', {
  timeZone: FUSO,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export type Agora = { dia: DiaDaSemana; minutos: number }

/** Dia da semana e minutos desde a meia-noite, em Ariquemes. */
export function agoraEmAriquemes(quando = new Date()): Agora {
  const partes = RELOGIO.formatToParts(quando)
  const pega = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? ''

  // 'Mon', 'Tue'… na ordem que DIAS já usa, começando no domingo.
  const mapa: Record<string, DiaDaSemana> = {
    Sun: 'dom', Mon: 'seg', Tue: 'ter', Wed: 'qua', Thu: 'qui', Fri: 'sex', Sat: 'sab',
  }

  return {
    dia: mapa[pega('weekday')] ?? 'dom',
    minutos: Number(pega('hour')) * 60 + Number(pega('minute')),
  }
}

const emMinutos = (hhmm: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

const anterior = (dia: DiaDaSemana): DiaDaSemana =>
  DIAS[(DIAS.indexOf(dia) + DIAS.length - 1) % DIAS.length]

function dentroDaFaixa(faixa: Faixa, minutos: number, viradaDeDia: boolean): boolean {
  const inicio = emMinutos(faixa[0])
  const fim = emMinutos(faixa[1])
  if (inicio === null || fim === null) return false

  // Faixa que atravessa a meia-noite, tipo 18:00–02:00.
  if (fim <= inicio) {
    return viradaDeDia ? minutos < fim : minutos >= inicio
  }
  return !viradaDeDia && minutos >= inicio && minutos < fim
}

export type Situacao = {
  aberta: boolean
  /** Faixas de hoje, para dizer à pessoa quando voltar. `[]` se não abre hoje. */
  hoje: Faixa[]
  /** Verdadeiro quando não há cadastro de horário — tratado como sempre aberta. */
  semCadastro: boolean
}

export function situacaoDaCasa(horarios: Horarios, quando = new Date()): Situacao {
  const faixasCadastradas = Object.values(horarios ?? {}).some(
    (faixas) => Array.isArray(faixas) && faixas.length > 0,
  )
  if (!faixasCadastradas) {
    return { aberta: true, hoje: [], semCadastro: true }
  }

  const { dia, minutos } = agoraEmAriquemes(quando)
  const deHoje = horarios[dia] ?? []
  const deOntem = horarios[anterior(dia)] ?? []

  const aberta =
    deHoje.some((f) => dentroDaFaixa(f, minutos, false)) ||
    deOntem.some((f) => dentroDaFaixa(f, minutos, true))

  return { aberta, hoje: deHoje, semCadastro: false }
}

/** "18:00 às 23:30" — para dizer quando a casa abre. */
export function descreverFaixas(faixas: Faixa[]): string {
  if (faixas.length === 0) return 'não abre hoje'
  return faixas.map(([de, ate]) => `${de} às ${ate}`).join(' e ')
}
