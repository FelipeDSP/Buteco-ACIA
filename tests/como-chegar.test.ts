import { describe, expect, it } from 'vitest'
import { linkComoChegar, type Casa } from '@/lib/tipos'

/**
 * `linkComoChegar` é o destino do botão "Como chegar", que aparece em todo
 * cartão da grade, no popup do mapa e duas vezes na página da casa. O valor
 * vai direto para um `href`.
 *
 * O painel passou a deixar a ACIA colar um link de mapa por casa (`maps_url`),
 * e é isso que os três degraus abaixo travam: o link colado ganha da
 * coordenada, a coordenada ganha do endereço, e nada que não seja `https://`
 * chega ao `href` — `javascript:` num href é execução de script na página
 * pública, e a validação da gravação não cobre linha antiga nem escrita feita
 * fora do painel.
 */

const CASA: Casa = {
  id: 'x',
  slug: 'bar-do-fuba',
  nome: 'Bar do Fubá',
  tipo: 'Bar',
  bairro: 'Setor 01',
  endereco: 'Av. Tancredo Neves, 1620',
  prato: { nome: 'Costelinha', confirmado: true, preco: 'R$ 45', descricao: '', foto: null },
  instagram: null,
  telefone: null,
  mapsUrl: null,
  lat: -9.9138212,
  lng: -63.0389,
  horarios: {},
}

describe('linkComoChegar', () => {
  it('sem maps_url, usa a coordenada conferida', () => {
    expect(linkComoChegar(CASA)).toBe(
      'https://www.google.com/maps/search/?api=1&query=-9.9138212%2C-63.0389',
    )
  })

  it('sem coordenada, cai na busca por nome e endereço', () => {
    const link = linkComoChegar({ ...CASA, lat: null, lng: null })
    expect(link).toContain('Bar%20do%20Fub%C3%A1')
    expect(link).toContain('Ariquemes')
  })

  it('com maps_url, o link da casa ganha da coordenada', () => {
    const link = linkComoChegar({ ...CASA, mapsUrl: 'https://maps.app.goo.gl/abc123' })
    expect(link).toBe('https://maps.app.goo.gl/abc123')
  })

  it('maps_url vazio não conta como preenchido', () => {
    expect(linkComoChegar({ ...CASA, mapsUrl: '' })).toContain('google.com/maps/search')
  })

  /**
   * O painel recusa isto na gravação. O teste existe porque a segunda tranca é
   * a que vale para linha antiga e para escrita feita direto no banco.
   */
  it.each([
    'javascript:alert(document.cookie)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://maps.google.com/x',
    'maps.app.goo.gl/abc',
    ' https://maps.app.goo.gl/abc',
  ])('não deixa %s chegar ao href', (bruto) => {
    const link = linkComoChegar({ ...CASA, mapsUrl: bruto })
    expect(link.startsWith('https://www.google.com/maps/search/')).toBe(true)
  })
})
