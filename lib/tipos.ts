/**
 * Forma de uma casa e as funções puras que operam sobre ela.
 *
 * Vive separado de `lib/dados.ts` de propósito: os componentes de cliente
 * (`LequePratos`, `MapaCasas`) precisam destas funções, e importar de
 * `lib/dados` arrastaria o cliente do Supabase para o bundle do navegador.
 * Aqui não há import de rede nem de disco.
 */

export type TipoCasa = string

export type Casa = {
  /** Chave no banco. Usada para amarrar sessão e avaliação. */
  id: string
  /** Estável para sempre — vai impresso no QR code. */
  slug: string
  nome: string
  tipo: TipoCasa
  /** Vazio quando a ficha não trouxe. A interface trata; não é erro. */
  bairro: string
  endereco: string
  prato: {
    nome: string
    /** Falso enquanto a casa não fechou o prato com a ACIA. */
    confirmado: boolean
    preco: string | null
    descricao: string
    foto: string | null
  }
  instagram: string | null
  telefone: string | null
  /** Link de mapa que a própria casa indicou. Vazio na maioria; ver `linkComoChegar`. */
  mapsUrl: string | null
  lat: number | null
  lng: number | null
  /** Funcionamento por dia: `{"seg":[["18:00","23:30"]]}`. `{}` = não coletado. */
  horarios: Horarios
}

export type Faixa = [string, string]
export type Horarios = Partial<Record<DiaDaSemana, Faixa[]>>

export const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const
export type DiaDaSemana = (typeof DIAS)[number]

export const CIDADE = 'Ariquemes'
export const UF = 'RO'

/**
 * O que mostrar no lugar do nome do prato enquanto a casa não confirmou.
 * Anunciar prato não confirmado é prometer pelo estabelecimento.
 */
export function nomeDoPrato(casa: Casa): string {
  return casa.prato.confirmado ? casa.prato.nome : 'Prato a confirmar'
}

export function enderecoCompleto(casa: Casa): string {
  const local = casa.bairro ? `${casa.endereco}, ${casa.bairro}` : casa.endereco
  return `${local} — ${CIDADE}/${UF}`
}

/**
 * Link de rota, em três degraus: o link que a casa indicou, a coordenada
 * conferida, e por último uma busca pelo nome e endereço.
 *
 * O `https://` é conferido aqui de novo, e não por desconfiança do painel: o
 * valor vai direto para um `href`, e `javascript:` num `href` é execução de
 * script. A validação na gravação é a primeira tranca; esta é a segunda, e
 * cobre linha antiga ou escrita fora do painel.
 */
export function linkComoChegar(casa: Casa): string {
  if (casa.mapsUrl && casa.mapsUrl.startsWith('https://')) return casa.mapsUrl

  const alvo =
    casa.lat != null && casa.lng != null
      ? `${casa.lat},${casa.lng}`
      : `${casa.nome}, ${casa.endereco}, ${CIDADE} ${UF}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alvo)}`
}
