import { closeSync, openSync, readdirSync, readSync } from 'node:fs'
import path from 'node:path'
import { ARQUIVOS_DE_REALIZACAO } from '@/lib/realizacao'

/**
 * Quem apoia o festival, numa fonte só.
 *
 * A pasta `public/patrocinadores` é a única fonte: arte nova aparece só de ser
 * colocada lá, sem tocar em código.
 *
 * **Quem realiza não entra aqui.** A CDL Ariquemes tem arte e passou a
 * assinar o festival junto da ACIA. Se o PNG dela cair nesta pasta, ela
 * apareceria no meio de doze patrocinadoras — por isso o filtro é estrutural
 * e não depende de ninguém lembrar da regra na hora de copiar o arquivo.
 *
 * **Quem não tem arquivo não aparece.** Já houve cartão de texto com o nome de
 * quem faltava, e o efeito foi o contrário do pretendido: no meio de doze
 * marcas desenhadas, dois retângulos com texto pareciam imagem que não
 * carregou. Ausência limpa é melhor que presença que parece defeito.
 *
 * Lê o disco, então **só componente de servidor.** `lib/dados.ts` não serve
 * para isso: ele é importado por componentes de cliente e `node:fs` quebraria
 * o bundle.
 */

export type Apoiador = {
  nome: string
  /** Arquivo em `/public/patrocinadores`. Sem arquivo, não há apoiador na lista. */
  arquivo: string
  /** Largura dividida pela altura do arquivo. `null` quando não deu para ler. */
  proporcao: number | null
}

/**
 * Proporção do PNG lida direto do cabeçalho IHDR — largura e altura são dois
 * inteiros de 32 bits logo depois da assinatura. Evita carregar biblioteca de
 * imagem só para saber o formato de doze arquivos.
 */
function proporcaoDoPng(caminho: string): number | null {
  try {
    const cabecalho = Buffer.alloc(24)
    const fd = openSync(caminho, 'r')
    try {
      readSync(fd, cabecalho, 0, 24, 0)
    } finally {
      closeSync(fd)
    }
    if (cabecalho.subarray(12, 16).toString('ascii') !== 'IHDR') return null
    const largura = cabecalho.readUInt32BE(16)
    const altura = cabecalho.readUInt32BE(20)
    return altura > 0 ? largura / altura : null
  } catch {
    return null
  }
}

const PASTA = path.join(process.cwd(), 'public', 'patrocinadores')
const IMAGEM = /\.(png|jpe?g|webp|svg)$/i

/**
 * Só a grafia. Nome de arquivo não carrega acento nem caixa, e `crb-grafica`
 * viraria "Crb Grafica" no `alt`. Arquivo sem verbete aqui entra do mesmo
 * jeito, com o nome derivado.
 */
const NOMES: Record<string, string> = {
  'auto-posto-capitao': 'Auto Posto Capitão',
  chatyou: 'Chatyou',
  'crb-grafica': 'CRB Gráfica',
  credisis: 'Credisis',
  femar: 'Femar',
  'hercules-ai': 'Hercules AI',
  'lixeira-bonita': 'Lixeira Bonita',
  'mesas-rosalin': 'Rosalin Mesas',
  'mp-marplen': 'MP Marplen',
  protseg: 'Protseg',
  'prover-engenharia': 'Prover Engenharia',
  rondotintas: 'Rondotintas',
}

function nomeDaMarca(base: string): string {
  return (
    NOMES[base] ??
    base
      .split(/[-_]/)
      .filter(Boolean)
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ')
  )
}

export function listarApoiadores(): Apoiador[] {
  let arquivos: string[] = []
  try {
    arquivos = readdirSync(PASTA)
  } catch {
    // Pasta ausente não derruba a página: a seção inteira some.
  }

  return arquivos
    .filter((arquivo) => IMAGEM.test(arquivo))
    // Realizador não é apoiador, mesmo que a arte esteja na pasta errada.
    .filter((arquivo) => !ARQUIVOS_DE_REALIZACAO.includes(arquivo))
    .map((arquivo) => ({
      nome: nomeDaMarca(path.parse(arquivo).name),
      arquivo,
      proporcao: proporcaoDoPng(path.join(PASTA, arquivo)),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}
