/**
 * Agrupamento dos nomes de quem atendeu.
 *
 * O nome é **digitado pelo cliente, no celular, depois de comer** — não vem de
 * cadastro. Então a mesma pessoa chega escrita de oito formas, e o dado que a
 * ACIA entrega ao dono do bar fica partido: no Bar do Fubá, `Thalisson` tinha
 * 23 avaliações e `Thalison`, `Talisson`, `Talison`, `Thalis`, `Talis`,
 * `Talisom`, `Talyson`, `Thayson` e `Taison` tinham outras 20 espalhadas.
 *
 * **O risco de juntar é maior que o de separar.** No mesmo bar trabalham um
 * `Tailan` e um `Thalisson`, e os dois nomes são parecidos. Juntar por
 * semelhança solta entregaria ao dono uma média que mistura dois funcionários
 * — pior que entregar duas linhas que ele sabe somar. Por isso o agrupamento
 * tem dois níveis:
 *
 * 1. **Junta sozinho** quando os nomes são a *mesma palavra escrita de outro
 *    jeito* — mesma chave fonética do português. `Luiz`/`Luis`, `Natalia`/
 *    `Nathalia`, `Jhonatan`/`Jonathan`, `Carina`/`Karina`, `Thalisson`/
 *    `Talison`, `Shelton`/`Chelton`. Aqui não há dúvida: é ortografia.
 *
 * 2. **Sugere, sem aplicar**, quando os nomes só são *parecidos* — uma letra
 *    de diferença na chave. `Hector`/`Heitor`, `Kauã`/`Kauan`, `Edivanio`/
 *    `Edvanio`. Podem ser a mesma pessoa ou dois funcionários; **quem sabe é a
 *    casa**, e a decisão fica com ela.
 */

/** Separa o que é nome do que é recado, elogio ou cargo. */
export type NomeClassificado =
  | { tipo: 'nome'; nome: string; /** O cliente digitou só o nome, sem frase. */ limpo: boolean }
  /** Mais de uma pessoa no mesmo campo: "Daniel e Tailan". */
  | { tipo: 'varios'; nomes: string[] }
  /** "Não sei", "Gerente", "Ótimo", um CPF. Não é pessoa. */
  | { tipo: 'sem-nome' }

/**
 * Palavras que ocupam o campo sem nomear ninguém.
 *
 * Cargo entra aqui de propósito: "Gerente" e "Dono" podem identificar alguém
 * para quem escreveu, mas não dão um nome que o dono do bar reconheça numa
 * lista — e ranqueá-los faria "Dono" aparecer entre os garçons.
 */
const NAO_SAO_NOMES = new Set([
  'nao', 'nao sei', 'nao sei o nome', 'nao sei o nome dele', 'nao sei o nome dela',
  'nao lembro', 'nao lembro o nome', 'nao tinha nome', 'nao observei', 'nao informado',
  'nao quero escolher', 'sem nome', 'anonimo', 'todos', 'todas', 'todos eles',
  'toda equipe', 'a equipe', 'equipe', 'geral', 'atendimento', 'bom atendimento',
  'otimo atendimento', 'otimo', 'otima', 'otimos', 'otimas', 'excelente', 'excelentes',
  'bom', 'boa', 'bons', 'boas', 'bem', 'top', 'nota 10', 'nota 1000', 'adorei',
  'perfeito', 'perfeita', 'maravilhoso', 'maravilhosa', 'campeao', 'profissionais',
  'profissional', 'garcom', 'garcon', 'garconete', 'atendente', 'atendentes',
  'funcionario', 'funcionaria', 'gerente', 'dono', 'dona', 'o dono', 'a dona',
  'proprietario', 'proprietaria', 'menina', 'menino', 'moca', 'moco', 'rapaz',
  'senhora', 'senhor', 'teste', 'teste garcom', 'uma delicia', 'excepcional',
  'excepcionais', 'espetacular', 'sensacional', 'impecavel',
])

/** Vocabulário de elogio: se a sobra for isto, não é nome de ninguém. */
const PALAVRAS_DE_ELOGIO = new Set([
  'otimo', 'otima', 'otimos', 'otimas', 'excelente', 'excelentes', 'maravilhoso',
  'maravilhosa', 'educado', 'educada', 'educados', 'atencioso', 'atenciosa',
  'atenciosos', 'simpatico', 'simpatica', 'simpaticos', 'rapido', 'rapida', 'melhor',
  'melhores', 'bom', 'boa', 'bons', 'boas', 'bem', 'top', 'nota', 'perfeito',
  'perfeita', 'gentil', 'querido', 'querida', 'queridao', 'queridos', 'sensacional',
  'espetacular', 'impecavel', 'show', 'lindo', 'linda', 'gostoso', 'gostosa',
  'bonitao', 'arrasa', 'sorriso', 'atendimento', 'atende', 'atendeu', 'atendido',
  'atendida', 'atendente', 'excepcional', 'excepcionais', 'solicito', 'disposta',
  'amigo', 'amiga', 'demais', 'muito', 'sempre', 'delicia',
])

/**
 * Palavras de ligação no fim da frase. Entram no podador junto com o elogio:
 * sem elas "Martini: um excelente atendimento" parava em "martini um" e o
 * grupo chegava ao painel chamado "Martini Un".
 */
const FERRAMENTA = ['o', 'a', 'e', 'é', 'um', 'uma', 'os', 'as', 'me', 'nos', 'foi', 'que', 'pelo', 'pela', 'no', 'na']

/** Cargo escrito antes do nome: "Garçom kaike", "Funcionário Marcos". */
const CARGOS_NA_FRENTE =
  /^(?:o |a |sr\.? |sra\.? )?(?:garcom|garcon|garconete|atendente|funcionario|funcionaria|nome do garcom e|nome do garcom|nome)\s+/

/** Separadores de "mais de uma pessoa". `é` entra porque é como se digita "e". */
const SEPARADORES = /\s*(?:,|;|\/|\||&|\+|\be\b|\bé\b|\bcom\b)\s*/

/** Ligações de sobrenome, que não precisam parecer nome por si. */
const LIGACOES = ['de', 'da', 'do', 'das', 'dos', 'e']

/**
 * Acima de quantas palavras o campo é frase, não nome.
 *
 * Nome completo com dois sobrenomes cabe em quatro; passando disso, o cliente
 * escreveu um recado — e aí o nome (se houver) é procurado de outro jeito, na
 * segunda passada.
 */
const PALAVRAS_DE_UM_NOME = 4

/**
 * Dobra o texto para comparação: sem acento, sem caixa, espaço único.
 *
 * Usa **NFKD**, não NFD, porque o campo recebeu `𝕁𝕠𝕒𝕠`, `Än̈n̈a` e `Æɲɲª` —
 * teclado decorado de celular. NFKD devolve essas formas ao alfabeto latino;
 * NFD deixaria cada uma como um nome próprio diferente.
 */
export function dobrar(texto: string): string {
  return texto
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s'.,;/|&+-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const semPontuacao = (t: string) => t.replace(/^[.,;:!?'"\s-]+|[.,;:!?'"\s-]+$/g, '').trim()

/**
 * A grafia como ela vai aparecer para o dono do bar.
 *
 * Mantém acento e caixa — é o que ele reconhece — mas tira o que o cliente
 * pendurou na borda: `Jackson,`, `Martins.`, `Ketlen😍😍`, `Hector 🫣`. Sem
 * isto a mesma pessoa aparecia duas vezes na linha "também escrito", separada
 * por um emoji.
 */
const paraExibir = (t: string) =>
  t.trim().replace(/^[^\p{L}]+/gu, '').replace(/[^\p{L}'.]+$/gu, '').replace(/\s+/g, ' ').trim()

/** Um pedaço parece nome de pessoa? */
function pareceNome(pedaco: string): boolean {
  const limpo = semPontuacao(pedaco.replace(CARGOS_NA_FRENTE, ''))
  if (!limpo || NAO_SAO_NOMES.has(limpo)) return false

  const palavras = limpo.split(' ').filter(Boolean)
  if (palavras.length === 0 || palavras.length > PALAVRAS_DE_UM_NOME) return false

  for (const palavra of palavras) {
    if (LIGACOES.includes(palavra)) continue
    if (PALAVRAS_DE_ELOGIO.has(palavra)) return false
    // Dígito no meio é CPF, número de mesa ou "Matheus 00".
    if (!/^[a-z']+$/.test(palavra)) return false
    // Sem vogal não é nome falado: ".gh", "Fnm".
    if (!/[aeiou]/.test(palavra)) return false
    if (palavra.length < 2) return false
  }
  return true
}

/** Tira o elogio pendurado no fim: "Daniel o melhor" → "Daniel". */
function podarElogio(pedaco: string): string {
  const palavras = semPontuacao(pedaco).split(' ').filter(Boolean)
  while (palavras.length > 1) {
    const ultima = palavras[palavras.length - 1]
    if (PALAVRAS_DE_ELOGIO.has(ultima) || FERRAMENTA.includes(ultima)) {
      palavras.pop()
      continue
    }
    break
  }
  return palavras.join(' ')
}

/**
 * Chave fonética do português.
 *
 * Duas grafias com a **mesma** chave são a mesma palavra escrita de outro
 * jeito, e podem ser juntadas sem perguntar: `Thalisson`→`talison`,
 * `Luiz`→`luis`, `Jhonatan`→`jonatan`, `Nathalia`→`natalia`, `Shelton` e
 * `Chelton`→`Xelton`.
 *
 * O que ela **não** faz é aproximar nomes diferentes: `Tailan`→`tailan` e
 * `Thalisson`→`talison` seguem distintos, que é o ponto — são duas pessoas no
 * mesmo bar.
 */
export function chaveFonetica(nome: string): string {
  let t = dobrar(nome).replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()

  // Dígrafos primeiro: depois deles o `h` solto sai sem levar som junto.
  t = t
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/[cs]h/g, 'X')
    .replace(/lh/g, 'l')
    .replace(/nh/g, 'n')
    .replace(/qu/g, 'k')
    .replace(/h/g, '')

  t = t
    .replace(/[kq]/g, 'c')
    .replace(/w/g, 'u')
    .replace(/y/g, 'i')
    .replace(/z/g, 's')

  // Letra dobrada não muda o som: `Anna`→`ana`, `Gabriell`→`gabriel`.
  t = t.replace(/([a-zX])\1+/g, '$1')
  // `m` no fim soa como `n`: `Ketlem`/`Ketlen`, `Talisom`/`Talison`.
  t = t.replace(/m\b/g, 'n')

  return t.replace(/\s+/g, ' ').trim()
}

/** Levenshtein com desistência: só interessa saber se passa de `limite`. */
export function distancia(a: string, b: string, limite = 1): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > limite) return limite + 1

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const atual: number[] = [i]
    let menor = i
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      atual[j] = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + custo)
      if (atual[j] < menor) menor = atual[j]
    }
    if (menor > limite) return limite + 1
    anterior = atual
  }
  return anterior[b.length]
}

/**
 * Até quantas avaliações uma grafia só-parecida entra sem perguntar.
 *
 * Abaixo disto o erro é barato: juntar `Sheldon` (2) em `Shelton` (35) não move
 * a média de ninguém de forma perceptível, e **deixar** separado é que
 * entregaria ao dono duas linhas para a mesma pessoa. Acima disto a conta muda
 * de dono: `Hector` (88) e `Heitor` (27) viram sugestão, porque se forem dois
 * funcionários a média de cada um estaria errada — e quem sabe é a casa.
 */
export const PARECIDO_JUNTA_ATE = 3

export type GrupoDeNome = {
  /** Grafia mais usada, como o cliente escreveu. */
  nome: string
  /** Outras grafias juntadas, da mais usada para a menos. */
  grafias: string[]
  /**
   * Os valores **exatamente como estão no banco**, sem aparar nada.
   *
   * `nome` e `grafias` passaram por `paraExibir`, que tira pontuação e emoji
   * da borda: `Jackson,` vira `Jackson`. Quem for corrigir ou ocultar no
   * banco precisa casar pelo valor original, senão deixa metade das linhas
   * para trás — e a lista do painel mostraria o nome consertado ao lado do
   * mesmo nome torto.
   */
  brutos: string[]
  notas: number[]
}

export type SugestaoDeUniao = {
  /** As duas grafias que podem ser a mesma pessoa, a maior primeiro. */
  nomes: [string, string]
  avaliacoes: [number, number]
  /** `parecido` = uma letra de diferença. `sobrenome` = um é parte do outro. */
  motivo: 'parecido' | 'sobrenome'
  /**
   * A grafia que revelou a ligação, quando ela não está em nenhum dos dois
   * nomes sugeridos. É o caso que mais vale: `Jhonatan Vieira de Souza`
   * apareceu **uma** vez, e é só por ela que se sabe que `Vieira` (67) e
   * `Jhonatan` (60) são a mesma pessoa.
   */
  via?: string
}

type Nucleo = {
  chave: string
  /** Grafias que o cliente digitou sozinhas, sem frase em volta. */
  grafias: Map<string, number>
  /** Valores crus, do jeito que estão no banco. */
  brutos: Set<string>
  notas: number[]
}

/**
 * Lê um campo isolado. Frase longa não é resolvida aqui — ver `agruparNomes`.
 */
export function classificarNome(bruto: string): NomeClassificado {
  const dobrado = dobrar(bruto)
  if (!dobrado) return { tipo: 'sem-nome' }
  if (NAO_SAO_NOMES.has(semPontuacao(dobrado))) return { tipo: 'sem-nome' }

  const pedacos = dobrado.split(SEPARADORES).filter((p) => p.trim().length > 0)
  const candidatos = pedacos
    .filter(pareceNome)
    .map((p) => podarElogio(p.replace(CARGOS_NA_FRENTE, '')))
    .filter(Boolean)

  const unicos = [...new Set(candidatos)]
  if (unicos.length > 1) return { tipo: 'varios', nomes: unicos }

  if (unicos.length === 1) {
    // "Limpo" quer dizer: o cliente digitou o nome e nada mais. Só essas
    // grafias entram no "também escrito" — senão a lista que vai para o dono
    // viria cheia de frases como "Daniel é nota 10!".
    const limpo = pedacos.length === 1 && semPontuacao(dobrado) === unicos[0]
    return { tipo: 'nome', nome: unicos[0], limpo }
  }

  // Nenhum pedaço inteiro parece nome: tenta o texto todo podado, que pega
  // "Daniel o melhor" — sem separador e com elogio colado.
  const podado = podarElogio(dobrado.replace(CARGOS_NA_FRENTE, ''))
  if (podado && podado !== semPontuacao(dobrado) && pareceNome(podado)) {
    return { tipo: 'nome', nome: podado, limpo: false }
  }
  return { tipo: 'sem-nome' }
}

/**
 * Agrupa os nomes de uma casa e devolve, junto, o que **não** foi agrupado por
 * decisão — as sugestões que a casa precisa confirmar.
 *
 * Duas passadas, e a segunda existe porque a primeira não tem como acertar:
 * "Atendimento excelente. Funcionário Marcos" é uma frase, e só se sabe que
 * nomeia o Marcos **depois** de saber que existe um Marcos naquela casa. Sem a
 * segunda passada, ou a frase é descartada (perde a avaliação) ou qualquer
 * palavra dela vira garçom — foi assim que "Super bem atendido, excepcionais."
 * apareceu como funcionário do Buck Burger.
 */
export function agruparNomes(entradas: { nome: string; nota: number }[]): {
  grupos: GrupoDeNome[]
  /** Avaliações cujo campo não nomeava ninguém. */
  semNome: number
  /** Avaliações que citaram mais de uma pessoa, com o texto original. */
  varios: { nome: string; nota: number }[]
  sugestoes: SugestaoDeUniao[]
} {
  const nucleos = new Map<string, Nucleo>()
  const varios: { nome: string; nota: number }[] = []
  let semNome = 0

  const guardar = (chave: string, original: string, nota: number, limpo: boolean) => {
    const nucleo = nucleos.get(chave) ?? {
      chave,
      grafias: new Map<string, number>(),
      brutos: new Set<string>(),
      notas: [],
    }
    if (limpo) {
      const comoVeio = paraExibir(original)
      if (comoVeio) nucleo.grafias.set(comoVeio, (nucleo.grafias.get(comoVeio) ?? 0) + 1)
    }
    nucleo.brutos.add(original)
    nucleo.notas.push(nota)
    nucleos.set(chave, nucleo)
  }

  // ---- 1ª passada: campos curtos, que falam por si.
  const frases: { nome: string; nota: number }[] = []
  for (const entrada of entradas) {
    const dobrado = dobrar(entrada.nome)
    if (dobrado.split(' ').filter(Boolean).length > PALAVRAS_DE_UM_NOME) {
      frases.push(entrada)
      continue
    }
    const lido = classificarNome(entrada.nome)
    if (lido.tipo === 'sem-nome') semNome++
    else if (lido.tipo === 'varios') varios.push(entrada)
    else {
      const chave = chaveFonetica(lido.nome)
      if (chave) guardar(chave, entrada.nome, entrada.nota, lido.limpo)
      else semNome++
    }
  }

  // ---- 2ª passada: frases, procurando nomes que a casa já tem.
  const conhecidas = new Map<string, string>()
  for (const nucleo of nucleos.values()) {
    for (const parte of nucleo.chave.split(' ')) {
      if (parte.length >= 3 && !conhecidas.has(parte)) conhecidas.set(parte, nucleo.chave)
    }
  }
  for (const entrada of frases) {
    const achadas = new Set<string>()
    for (const palavra of dobrar(entrada.nome).split(/[^a-z']+/).filter(Boolean)) {
      const chave = conhecidas.get(chaveFonetica(palavra))
      if (chave) achadas.add(chave)
    }
    if (achadas.size === 0) semNome++
    else if (achadas.size > 1) varios.push(entrada)
    // A frase conta a avaliação, nunca a grafia: `limpo` é falso.
    else guardar([...achadas][0], entrada.nome, entrada.nota, false)
  }

  // Do maior para o menor, com a chave como critério final: o resultado não
  // depende da ordem em que as avaliações chegaram.
  const ordenados = [...nucleos.values()].sort(
    (a, b) => b.notas.length - a.notas.length || a.chave.localeCompare(b.chave),
  )

  /**
   * Junção em estrela, **nunca em cadeia**.
   *
   * A grafia rara só encosta num núcleo *grande*, e núcleo grande nunca encosta
   * em ninguém. Com união transitiva o Bar do Fubá juntava `Darlan` em
   * `Tailan` — que estão a duas letras de distância — porque `Dailan` ficava
   * no meio e cada passo tinha só uma letra. Uma cadeia de passos curtos
   * atravessa qualquer distância.
   */
  const grandes = ordenados.filter((n) => n.notas.length > PARECIDO_JUNTA_ATE)
  const destino = new Map<string, string>()
  const sugestoes: SugestaoDeUniao[] = []

  for (const pequeno of ordenados) {
    if (pequeno.notas.length > PARECIDO_JUNTA_ATE) continue
    const perto = grandes.filter((g) => distancia(g.chave, pequeno.chave) <= 1)
    if (perto.length > 0) destino.set(pequeno.chave, perto[0].chave)
  }

  for (let i = 0; i < grandes.length; i++) {
    for (let j = i + 1; j < grandes.length; j++) {
      if (distancia(grandes[i].chave, grandes[j].chave) > 1) continue
      sugestoes.push({
        nomes: [principal(grandes[i]), principal(grandes[j])],
        avaliacoes: [grandes[i].notas.length, grandes[j].notas.length],
        motivo: 'parecido',
      })
    }
  }

  const finais = new Map<string, Nucleo>()
  for (const nucleo of ordenados) {
    const raiz = destino.get(nucleo.chave) ?? nucleo.chave
    const alvo = finais.get(raiz)
    if (!alvo) {
      finais.set(raiz, {
        chave: raiz,
        grafias: new Map(nucleo.grafias),
        brutos: new Set(nucleo.brutos),
        notas: [...nucleo.notas],
      })
      continue
    }
    for (const [grafia, n] of nucleo.grafias) {
      alvo.grafias.set(grafia, (alvo.grafias.get(grafia) ?? 0) + n)
    }
    for (const bruto of nucleo.brutos) alvo.brutos.add(bruto)
    alvo.notas.push(...nucleo.notas)
  }

  const grupos: GrupoDeNome[] = [...finais.values()].map((n) => {
    const ordenadas = [...n.grafias.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'),
    )
    return {
      nome: ordenadas.length > 0 ? ordenadas[0][0] : capitalizar(n.chave),
      grafias: ordenadas.slice(1).map(([g]) => g),
      brutos: [...n.brutos],
      notas: n.notas,
    }
  })

  /**
   * Nome composto, que liga nomes soltos.
   *
   * Vale 127 avaliações numa casa só: na Cia Petiscaria, `Vieira` (67) é o
   * sobrenome do `Jhonatan` (60) — e **só se sabe disso porque alguém
   * escreveu "Jhonatan Vieira de Souza" uma vez**. Nenhuma regra de grafia
   * acha isso, e a média da pessoa fica partida em duas linhas até a casa
   * confirmar.
   *
   * Por isso a ligação é sugerida entre os dois nomes **grandes**, citando a
   * grafia que a revelou. Sugerir "Jhonatan Vieira de Souza (1) + Vieira (67)"
   * seria tecnicamente o mesmo par e esconderia o que importa: que há 127
   * avaliações de uma pessoa só.
   */
  const porPartes = (g: GrupoDeNome) =>
    chaveFonetica(g.nome).split(' ').filter((parte) => parte.length >= 3)

  /**
   * O mesmo par pode ser apontado por dois caminhos — grafia parecida e nome
   * composto. A casa precisa decidir uma vez, não duas.
   */
  const vistas = new Set<string>()
  const unicas: SugestaoDeUniao[] = []
  const anotar = (su: SugestaoDeUniao) => {
    const chave = [su.nomes[0], su.nomes[1]].sort().join(' + ')
    if (vistas.has(chave)) return
    vistas.add(chave)
    unicas.push(su)
  }
  for (const su of sugestoes) anotar(su)

  for (const composto of grupos) {
    const partes = porPartes(composto)
    if (partes.length < 2) continue
    const casam = grupos.filter(
      (g) => g !== composto && !chaveFonetica(g.nome).includes(' ') && partes.includes(chaveFonetica(g.nome)),
    )
    for (let i = 0; i < casam.length; i++) {
      for (let j = i + 1; j < casam.length; j++) {
        const [a, b] = [casam[i], casam[j]].sort((x, y) => y.notas.length - x.notas.length)
        anotar({
          nomes: [a.nome, b.nome],
          avaliacoes: [a.notas.length, b.notas.length],
          motivo: 'sobrenome',
          via: composto.nome,
        })
      }
    }
  }

  for (const curto of grupos) {
    const chaveCurta = chaveFonetica(curto.nome)
    if (!chaveCurta || chaveCurta.includes(' ')) continue
    for (const longo of grupos) {
      if (longo === curto) continue
      if (!porPartes(longo).includes(chaveCurta)) continue
      /**
       * Composto com uma ou duas avaliações e nada mais a revelar é ruído:
       * "Gabriel malher (1) + Gabriel (83)" ocupa uma linha para decidir o
       * destino de uma avaliação. A lista existe para a casa resolver os
       * casos que mexem na média de alguém.
       */
      if (longo.notas.length <= 2) continue
      anotar({
        nomes: [longo.nome, curto.nome],
        avaliacoes: [longo.notas.length, curto.notas.length],
        motivo: 'sobrenome',
      })
    }
  }

  // A maior primeiro: é a ordem em que a casa quer decidir. O par que mexe em
  // 127 avaliações não pode ficar embaixo do que mexe em uma.
  unicas.sort(
    (a, b) =>
      Math.min(...b.avaliacoes) - Math.min(...a.avaliacoes) ||
      a.nomes[0].localeCompare(b.nomes[0], 'pt-BR'),
  )

  return { grupos, semNome, varios, sugestoes: unicas }
}

function principal(nucleo: Nucleo): string {
  const ordenadas = [...nucleo.grafias.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'),
  )
  return ordenadas.length > 0 ? ordenadas[0][0] : capitalizar(nucleo.chave)
}

const capitalizar = (t: string) => t.replace(/\b[a-z]/g, (c) => c.toUpperCase())
