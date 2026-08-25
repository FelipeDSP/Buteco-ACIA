import 'server-only'
import { createHmac } from 'node:crypto'
import { limparCpf } from '@/lib/cpf'

/**
 * HMAC-SHA256 do CPF com um segredo do servidor.
 *
 * SHA256 puro não serviria: CPF tem 11 dígitos e só ~1,1 bilhão de números
 * válidos. Uma tabela do espaço inteiro se monta em minutos num notebook, e aí
 * o hash equivale a guardar o CPF. O pepper é o que torna a tabela inútil para
 * quem não tem o segredo — inclusive para quem levar um dump do banco.
 *
 * Arquivo separado de `lib/cpf.ts` porque aquele roda também no navegador; o
 * segredo não pode chegar perto do bundle.
 */

export function hashDoCpf(bruto: string): string {
  const pepper = process.env.CPF_PEPPER
  if (!pepper) {
    throw new Error('Falta CPF_PEPPER no ambiente — sem ele o voto não pode ser gravado.')
  }

  return createHmac('sha256', pepper).update(limparCpf(bruto)).digest('hex')
}
