const REAL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export function reais(valor: number): string {
  return REAL.format(valor)
}

const DATA_LONGA = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/** '2026-09-19' -> '19 de setembro' */
export function dataLonga(iso: string): string {
  return DATA_LONGA.format(new Date(`${iso}T00:00:00Z`))
}

/** '2026-09-19' -> '19/09' */
export function dataCurta(iso: string): string {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}
