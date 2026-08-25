/**
 * CPF: validação matemática e hash.
 *
 * A validação é só aritmética — dígitos verificadores por módulo 11. Nada de
 * consultar API externa: o objetivo é barrar dígito digitado errado e número
 * inventado, não confirmar que a pessoa existe.
 *
 * A parte da validação roda nos dois lados. No cliente, para dar retorno na
 * hora. No servidor, porque é lá que vale — qualquer um pode mandar um POST
 * direto sem passar pelo formulário.
 */

/** Só os dígitos. O que o usuário digitou com ponto e traço chega limpo aqui. */
export function limparCpf(bruto: string): string {
  return bruto.replace(/\D/g, '')
}

/** 000.000.000-00, para o campo enquanto a pessoa digita. */
export function formatarCpf(bruto: string): string {
  const d = limparCpf(bruto).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function digito(digitos: string, pesoInicial: number): number {
  let soma = 0
  for (let i = 0; i < digitos.length; i++) {
    soma += Number(digitos[i]) * (pesoInicial - i)
  }
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

export function cpfValido(bruto: string): boolean {
  const cpf = limparCpf(bruto)
  if (cpf.length !== 11) return false

  // 111.111.111-11 e afins passam no módulo 11 por acidente. São inválidos.
  if (/^(\d)\1{10}$/.test(cpf)) return false

  return digito(cpf.slice(0, 9), 10) === Number(cpf[9]) &&
    digito(cpf.slice(0, 10), 11) === Number(cpf[10])
}
