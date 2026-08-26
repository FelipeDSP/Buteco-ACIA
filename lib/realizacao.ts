/**
 * Quem **realiza** o festival — ACIA e CDL Ariquemes.
 *
 * Realização não é apoio, e a diferença aparece na tela: apoiador entra na
 * grade de patrocinadores, realizador assina o evento. Manter os dois numa
 * lista só faria a CDL aparecer no meio de doze marcas patrocinadoras, que é
 * exatamente o contrário do que ela é aqui.
 *
 * Sem leitura de disco de propósito: são duas entidades fixas, não uma pasta
 * que cresce. Isso também deixa o arquivo utilizável em qualquer componente.
 */

export type Realizador = {
  /** Nome por extenso. É o que vai no `alt` — sigla não descreve imagem. */
  nome: string
  /** Como a entidade é citada em texto corrido. */
  curto: string
  arquivo: string
  /** Dimensões reais do PNG, para o `next/image` reservar o espaço certo. */
  largura: number
  altura: number
  /**
   * As classes de tamanho moram aqui, junto da marca, porque **o equilíbrio
   * óptico é propriedade da arte, não do lugar onde ela aparece.**
   *
   * A ACIA é quadrada (0,99:1) e a CDL é deitada (2,91:1). Alinhar as duas
   * pela mesma altura faria a CDL parecer três vezes maior — ela ganharia
   * três vezes mais área com o mesmo número. Por isso a ACIA é limitada pela
   * ALTURA e a CDL pela LARGURA. Nos números escolhidos a CDL fica com 64px
   * de altura contra 74px da ACIA: menor em altura, maior em largura, e as
   * duas com peso parecido no olho.
   */
  naFaixa: string
  noRodape: string
}

export const REALIZADORES: readonly Realizador[] = [
  {
    nome: 'Associação Comercial e Industrial de Ariquemes',
    curto: 'ACIA',
    arquivo: 'acia.png',
    largura: 397,
    altura: 400,
    naFaixa: 'h-[58px] w-auto media:h-[74px]',
    noRodape: 'h-[34px] w-auto',
  },
  {
    nome: 'Câmara de Dirigentes Lojistas de Ariquemes',
    curto: 'CDL Ariquemes',
    arquivo: 'cdl-ariquemes.png',
    largura: 1164,
    altura: 400,
    naFaixa: 'h-auto w-[150px] media:w-[186px]',
    noRodape: 'h-auto w-[86px]',
  },
]

/** Nomes dos arquivos, para a grade de apoio nunca repetir um realizador. */
export const ARQUIVOS_DE_REALIZACAO: readonly string[] = REALIZADORES.map(
  (r) => r.arquivo,
)

/**
 * "ACIA e CDL Ariquemes" — derivado, para a linha final do rodapé não
 * desmentir a faixa se a composição da realização mudar.
 */
export function realizadoPor(): string {
  const nomes = REALIZADORES.map((r) => r.curto)
  if (nomes.length < 2) return nomes.join('')
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}
