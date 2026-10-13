import { describe, expect, it } from 'vitest'
import { CPF_NAO_REGISTRADO, mascararCpf } from '@/lib/cpf'

/**
 * A máscara do relatório que vai ao estabelecimento.
 *
 * O que estes testes seguram é o tamanho do que vaza: **três dígitos na
 * frente e dois atrás, nunca mais que isso**. Um deslize aqui — uma fatia de
 * quatro em vez de três — não quebra nada, não gera erro, e manda dígito de
 * CPF de cliente de bar para dentro de um PDF que já saiu por WhatsApp e não
 * volta mais.
 */

describe('máscara do CPF', () => {
  it('mostra três na frente e dois atrás', () => {
    expect(mascararCpf('78712345663')).toBe('787.***.***-63')
    expect(mascararCpf('52998224725')).toBe('529.***.***-25')
  })

  it('aceita o número já pontuado', () => {
    expect(mascararCpf('529.982.247-25')).toBe('529.***.***-25')
  })

  it('nunca deixa passar mais que cinco dígitos', () => {
    const saida = mascararCpf('12345678909')
    const digitos = saida.replace(/\D/g, '')
    expect(digitos).toBe('12309')
    expect(digitos).toHaveLength(5)
    // E os seis do meio não aparecem em lugar nenhum da string.
    for (const escondido of ['4', '5', '6', '7', '8']) {
      expect(saida.includes(`${escondido}`)).toBe(false)
    }
  })

  it('sem número guardado diz que não foi registrado', () => {
    // As avaliações anteriores a 27/08/2026 não guardaram o CPF. Célula vazia
    // pareceria falha de carregamento.
    expect(mascararCpf(null)).toBe(CPF_NAO_REGISTRADO)
    expect(mascararCpf(undefined)).toBe(CPF_NAO_REGISTRADO)
    expect(mascararCpf('')).toBe(CPF_NAO_REGISTRADO)
  })

  it('número torto não vira máscara pela metade', () => {
    // Melhor dizer "não registrado" que imprimir uma máscara que parece CPF e
    // não é — a casa leria como voto válido de alguém.
    expect(mascararCpf('123')).toBe(CPF_NAO_REGISTRADO)
    expect(mascararCpf('1234567890')).toBe(CPF_NAO_REGISTRADO)
    expect(mascararCpf('123456789012')).toBe(CPF_NAO_REGISTRADO)
    expect(mascararCpf('abcdefghijk')).toBe(CPF_NAO_REGISTRADO)
  })

  it('CPFs diferentes com mesmo começo e fim ficam iguais na máscara', () => {
    /**
     * É isto que torna a máscara defensável sozinha — e é também o seu
     * limite: ela só não identifica ninguém para quem não tem uma lista de
     * CPF para cruzar.
     */
    expect(mascararCpf('78711111163')).toBe(mascararCpf('78799999963'))
  })
})
