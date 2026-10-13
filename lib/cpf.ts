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

/** Quando o número não foi guardado — avaliações anteriores a 27/08/2026. */
export const CPF_NAO_REGISTRADO = 'não registrado'

/**
 * CPF mascarado para o relatório que vai ao estabelecimento: `787.***.***-63`.
 *
 * Formato pedido pela ACIA (Romildo, 13/10/2026): mostrar os três primeiros e
 * os dois últimos dígitos, para a casa ver que **cada voto tem um CPF
 * distinto por trás** sem receber o número inteiro.
 *
 * **O que a máscara protege, e o que ela não protege.** Contra quem não tem
 * nada em mãos, ela segura: sobram seis dígitos escondidos e os dois últimos
 * são verificadores calculados dos outros nove, então restam ~10 mil CPFs
 * possíveis para cada linha.
 *
 * Contra **quem já tem uma lista de CPF de cliente**, ela não segura nada. A
 * chance de um CPF errado da lista casar com os três primeiros e os dois
 * últimos é de 1 em 100 mil: com algumas centenas de clientes cadastrados, o
 * dono filtra a própria lista e chega a uma pessoa só. E quem tem lista de CPF
 * de cliente — fidelidade, nota fiscal, delivery — é justamente o dono da
 * casa, que é quem recebe este arquivo.
 *
 * Está implementado porque é decisão da ACIA sobre dado que a ACIA já
 * resolveu guardar. O registro aqui é para que, se alguém reabrir o assunto,
 * saiba que o risco foi dito e não esquecido.
 */
export function mascararCpf(bruto: string | null | undefined): string {
  if (!bruto) return CPF_NAO_REGISTRADO
  const d = limparCpf(bruto)
  if (d.length !== 11) return CPF_NAO_REGISTRADO
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`
}
