import { describe, expect, it } from 'vitest'
import { agenteDoPedido, ipDoPedido, normalizarIp } from '@/lib/pedido'

const pedido = (cabecalhos: Record<string, string>) => new Headers(cabecalhos)

describe('ipDoPedido', () => {
  it('pega o primeiro endereço de x-forwarded-for, que é o do visitante', () => {
    // "cliente, proxy1, proxy2" — em produção o socket é o da edge, então este
    // primeiro item é a única pista de quem realmente votou.
    expect(
      ipDoPedido(pedido({ 'x-forwarded-for': '203.0.113.45, 70.41.3.18, 150.172.238.178' })),
    ).toBe('203.0.113.45')
  })

  it('não confunde o endereço do proxy com o do visitante', () => {
    const ip = ipDoPedido(pedido({ 'x-forwarded-for': '203.0.113.45, 70.41.3.18' }))
    expect(ip).not.toBe('70.41.3.18')
  })

  it('prefere o cabeçalho da Vercel, que o cliente não consegue forjar', () => {
    expect(
      ipDoPedido(
        pedido({
          'x-forwarded-for': '198.51.100.1', // forjável por curl -H
          'x-vercel-forwarded-for': '203.0.113.45', // escrito pela plataforma
        }),
      ),
    ).toBe('203.0.113.45')
  })

  it('cabeçalho presente mas vazio não cala as fontes seguintes', () => {
    // Era o bug: `''.split(',')[0]` devolve `''`, que não é null, então o
    // encadeamento com `??` parava ali e engolia o x-real-ip válido.
    expect(
      ipDoPedido(pedido({ 'x-forwarded-for': '', 'x-real-ip': '198.51.100.9' })),
    ).toBe('198.51.100.9')
  })

  it('devolve null quando nenhum cabeçalho traz IP', () => {
    expect(ipDoPedido(pedido({ 'user-agent': 'algo' }))).toBeNull()
  })
})

describe('normalizarIp', () => {
  it.each([
    ['203.0.113.45', '203.0.113.45'],
    ['  203.0.113.45  ', '203.0.113.45'],
    ['203.0.113.45:52413', '203.0.113.45'], // proxy anexou a porta
    ['[2001:db8::1]:443', '2001:db8::1'], // IPv6 entre colchetes com porta
    ['2001:db8::1', '2001:db8::1'],
    ['::1', '::1'],
    ['::ffff:203.0.113.5', '203.0.113.5'], // IPv4 mapeado em IPv6
  ])('normaliza %s -> %s', (bruto, esperado) => {
    expect(normalizarIp(bruto)).toBe(esperado)
  })

  it.each([
    ['999.1.1.1'], // octeto acima de 255
    ['nao-e-um-ip'],
    ['<script>'],
    [''],
    [null],
  ])('recusa %s, porque valor sujo derruba o insert na coluna inet', (bruto) => {
    expect(normalizarIp(bruto as string | null)).toBeNull()
  })
})

describe('agenteDoPedido', () => {
  it('lê o cabeçalho user-agent', () => {
    expect(agenteDoPedido(pedido({ 'user-agent': 'Mozilla/5.0 (iPhone)' }))).toBe(
      'Mozilla/5.0 (iPhone)',
    )
  })

  it('corta em 400 para um agente absurdo não engordar a linha', () => {
    const enorme = 'x'.repeat(900)
    expect(agenteDoPedido(pedido({ 'user-agent': enorme }))?.length).toBe(400)
  })

  it('devolve null quando não vem agente', () => {
    expect(agenteDoPedido(pedido({}))).toBeNull()
  })
})
