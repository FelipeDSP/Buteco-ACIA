import { describe, expect, it } from 'vitest'
import {
  agruparNomes,
  chaveFonetica,
  classificarNome,
  distancia,
  PARECIDO_JUNTA_ATE,
} from '@/lib/nomes'

/**
 * O nome de quem atendeu é digitado pelo cliente, no celular, depois de comer.
 * Não vem de cadastro — então a mesma pessoa chega escrita de oito formas, e o
 * dado que a ACIA entrega ao dono do bar fica partido.
 *
 * **O que estes testes seguram é o lado perigoso: não juntar quem não é a
 * mesma pessoa.** No Bar do Fubá trabalham um `Tailan` e um `Thalisson`; se o
 * agrupamento os misturar, o dono recebe uma média que não é de ninguém — e
 * nada no site acusa, porque o número continua parecendo um número.
 */

const nome = (bruto: string) => {
  const r = classificarNome(bruto)
  return r.tipo === 'nome' ? r.nome : r.tipo
}

describe('o que é nome e o que é recado', () => {
  it('nome sozinho passa', () => {
    expect(nome('Daniel')).toBe('daniel')
    expect(nome('  Maria   Vitória ')).toBe('maria vitoria')
    expect(nome('Jhonatan Vieira de Souza')).toBe('jhonatan vieira de souza')
  })

  it('cargo na frente do nome sai, o nome fica', () => {
    expect(nome('Garçom kaike')).toBe('kaike')
    expect(nome('Atendente Ana')).toBe('ana')
  })

  it('elogio pendurado no nome sai', () => {
    expect(nome('Daniel o melhor')).toBe('daniel')
    expect(nome('Arthur, muito educado')).toBe('arthur')
    expect(nome('Luiz, atendimento excepcional!')).toBe('luiz')
  })

  it('"não sei", cargo e elogio não são pessoa', () => {
    for (const t of [
      'Não sei',
      'Nao sei o nome',
      'Sem nome',
      'Gerente',
      'O dono',
      'Proprietário',
      'Todos',
      'Ótimo',
      'Top',
      'Uma delícia',
      'Teste garçom',
    ]) {
      expect(nome(t)).toBe('sem-nome')
    }
  })

  it('número não é nome — o campo recebeu um CPF', () => {
    expect(nome('01099350204')).toBe('sem-nome')
  })

  it('palavra sem vogal não é nome falado', () => {
    expect(nome('.gh')).toBe('sem-nome')
    expect(nome('Fnm')).toBe('sem-nome')
  })

  it('mais de uma pessoa no mesmo campo é "varios", não um nome inventado', () => {
    expect(nome('Daniel e Tailan')).toBe('varios')
    expect(nome('Tailan,Daniel,Thalisson')).toBe('varios')
    expect(nome('Luiz / Larissa')).toBe('varios')
    // "é" digitado no lugar de "e" é o caso mais comum.
    expect(nome('Pablo é Taylor')).toBe('varios')
  })

  it('vírgula sozinha não quer dizer duas pessoas', () => {
    // O que separa os casos é quantos pedaços parecem nome, não a pontuação.
    expect(nome('Arthur, muito educado')).toBe('arthur')
    expect(nome('Daniel, Thailan e Thales')).toBe('varios')
  })

  it('teclado decorado volta ao alfabeto — NFKD, não NFD', () => {
    expect(nome('𝕁𝕠𝕒𝕠')).toBe('joao')
    expect(chaveFonetica('Än̈n̈a')).toBe(chaveFonetica('Ana'))
  })
})

describe('chave fonética: mesma palavra, outra grafia', () => {
  it.each([
    ['Thalisson', 'Talison'],
    ['Thalison', 'Talisson'],
    ['Luiz', 'Luis'],
    ['Luíz', 'Luís'],
    ['Natalia', 'Nathalia'],
    ['Jhonatan', 'Jonathan'],
    ['Jonatan', 'Jhonatan'],
    ['Carina', 'Karina'],
    ['Shelton', 'Chelton'],
    ['Arthur', 'Artur'],
    ['Matheus', 'Mateus'],
    ['Marcos', 'Marcos'],
    ['Anna', 'Ana'],
    ['Gabriell', 'Gabriel'],
    ['Ketlem', 'Ketlen'],
    ['Kaike', 'Kaique'],
    ['Kayke', 'Caíque'],
    ['Helen', 'Hellen'],
    ['Juliana', 'Julyana'],
    ['Jaqueline', 'Jakeline'],
    ['Jefferson', 'Jeferson'],
  ])('%s e %s têm a mesma chave', (a, b) => {
    expect(chaveFonetica(a)).toBe(chaveFonetica(b))
  })

  it.each([
    ['Tailan', 'Thalisson'],
    ['Tailan', 'Darlan'],
    ['Daniel', 'Dailan'],
    ['Hector', 'Gabriel'],
    ['Juliana', 'Ana julia'],
    ['Pablo', 'Taylor'],
  ])('%s e %s continuam separados', (a, b) => {
    expect(chaveFonetica(a)).not.toBe(chaveFonetica(b))
  })
})

describe('distância com desistência', () => {
  it('conta substituição, inserção e remoção', () => {
    expect(distancia('talison', 'talisom')).toBe(1)
    expect(distancia('edivanio', 'edvanio')).toBe(1)
    expect(distancia('ana', 'ana')).toBe(0)
  })

  it('passando do limite devolve limite+1, sem terminar a conta', () => {
    expect(distancia('tailan', 'talison')).toBe(2)
    expect(distancia('pablo', 'shelton')).toBe(2)
  })
})

const muitas = (nome: string, quantas: number, nota = 5) =>
  Array.from({ length: quantas }, () => ({ nome, nota }))

describe('agrupamento: junta grafia, pergunta o resto', () => {
  it('junta sozinho as grafias da mesma palavra', () => {
    const { grupos } = agruparNomes([
      ...muitas('Thalisson', 22),
      ...muitas('Thalison', 6),
      ...muitas('Talisson', 5),
      ...muitas('Talison', 3),
    ])
    expect(grupos).toHaveLength(1)
    expect(grupos[0].nome).toBe('Thalisson')
    expect(grupos[0].notas).toHaveLength(36)
    expect(grupos[0].grafias).toEqual(['Thalison', 'Talisson', 'Talison'])
  })

  it('NÃO junta dois funcionários de nome parecido', () => {
    // O caso real do Bar do Fubá. Juntar aqui entrega ao dono uma média que
    // não é de nenhum dos dois.
    const { grupos } = agruparNomes([...muitas('Tailan', 32), ...muitas('Thalisson', 23)])
    expect(grupos).toHaveLength(2)
    expect(grupos.map((g) => g.nome).sort()).toEqual(['Tailan', 'Thalisson'])
  })

  it('não junta em cadeia: um passo curto duas vezes não vira um passo longo', () => {
    /**
     * `Tailan`→`Dailan` é uma letra e `Dailan`→`Darlan` é uma letra, mas
     * `Tailan`→`Darlan` são duas. Com união transitiva o Darlan caía dentro do
     * Tailan. A junção é em estrela: grafia rara encosta em núcleo grande, e
     * núcleo grande não encosta em ninguém.
     */
    const { grupos } = agruparNomes([
      ...muitas('Tailan', 40),
      { nome: 'Dailan', nota: 5 },
      { nome: 'Darlan', nota: 5 },
    ])
    const tailan = grupos.find((g) => g.nome === 'Tailan')!
    expect(tailan.grafias).toContain('Dailan')
    expect(tailan.grafias).not.toContain('Darlan')
    expect(grupos.map((g) => g.nome)).toContain('Darlan')
  })

  it('parecido com volume dos dois lados vira sugestão, não união', () => {
    const { grupos, sugestoes } = agruparNomes([...muitas('Hector', 85), ...muitas('Heitor', 27)])
    expect(grupos).toHaveLength(2)
    expect(sugestoes).toHaveLength(1)
    expect(sugestoes[0].motivo).toBe('parecido')
    expect(sugestoes[0].nomes).toEqual(['Hector', 'Heitor'])
    expect(sugestoes[0].avaliacoes).toEqual([85, 27])
  })

  it(`parecido com até ${PARECIDO_JUNTA_ATE} avaliações entra junto`, () => {
    const { grupos, sugestoes } = agruparNomes([
      ...muitas('Shelton', 35),
      ...muitas('Sheldon', PARECIDO_JUNTA_ATE),
    ])
    expect(grupos).toHaveLength(1)
    expect(grupos[0].grafias).toContain('Sheldon')
    expect(sugestoes).toHaveLength(0)
  })

  it('uma avaliação a mais e a mesma grafia passa a ser pergunta', () => {
    const { grupos } = agruparNomes([
      ...muitas('Shelton', 35),
      ...muitas('Sheldon', PARECIDO_JUNTA_ATE + 1),
    ])
    expect(grupos).toHaveLength(2)
  })

  it('sobrenome solto é sugerido', () => {
    const { sugestoes } = agruparNomes([
      ...muitas('Vieira', 67),
      ...muitas('Jhonatan Vieira de Souza', 5),
    ])
    const sobrenome = sugestoes.filter((s) => s.motivo === 'sobrenome')
    expect(sobrenome).toHaveLength(1)
    expect(sobrenome[0].nomes).toEqual(['Jhonatan Vieira de Souza', 'Vieira'])
  })

  it('o nome composto liga dois nomes grandes — 127 avaliações de uma pessoa', () => {
    /**
     * O caso real da Cia Petiscaria. `Jhonatan Vieira de Souza` apareceu
     * **uma** vez, e é só por ela que se sabe que `Vieira` (67) e `Jhonatan`
     * (60) são a mesma pessoa. A sugestão tem de apontar os dois grandes,
     * citando a grafia que revelou — senão vira "1 + 67" e esconde o que
     * importa.
     */
    const { sugestoes } = agruparNomes([
      ...muitas('Vieira', 67),
      ...muitas('Jhonatan', 60),
      { nome: 'Jhonatan Vieira de Souza', nota: 5 },
    ])
    const ligacao = sugestoes.find((s) => s.via)
    expect(ligacao).toBeDefined()
    expect(ligacao!.nomes).toEqual(['Vieira', 'Jhonatan'])
    expect(ligacao!.avaliacoes).toEqual([67, 60])
    expect(ligacao!.via).toBe('Jhonatan Vieira de Souza')
  })

  it('composto de uma ou duas avaliações não gera linha para decidir', () => {
    // "Gabriel malher" (1) + "Gabriel" (83) é uma linha para resolver o
    // destino de uma avaliação. A lista existe para o que mexe na média.
    const { sugestoes } = agruparNomes([
      ...muitas('Gabriel', 83),
      { nome: 'Gabriel malher', nota: 5 },
    ])
    expect(sugestoes).toHaveLength(0)
  })

  it('o mesmo par não é perguntado duas vezes', () => {
    const { sugestoes } = agruparNomes([
      ...muitas('Vieira', 67),
      ...muitas('Jhonatan', 60),
      ...muitas('Jhonatan Vieira', 4),
    ])
    const pares = sugestoes.map((s) => [...s.nomes].sort().join('|'))
    expect(new Set(pares).size).toBe(pares.length)
  })

  it('a sugestão que mexe em mais avaliações vem primeiro', () => {
    const { sugestoes } = agruparNomes([
      ...muitas('Hector', 85),
      ...muitas('Heitor', 27),
      ...muitas('Martini', 15),
      ...muitas('Martine', 6),
    ])
    expect(Math.min(...sugestoes[0].avaliacoes)).toBeGreaterThan(
      Math.min(...sugestoes[sugestoes.length - 1].avaliacoes),
    )
  })

  it('"não sei" e elogio saem da lista, mas a avaliação é contada à parte', () => {
    const { grupos, semNome } = agruparNomes([
      ...muitas('Marcos', 10),
      { nome: 'Não sei', nota: 4 },
      { nome: 'Ótimo', nota: 5 },
      { nome: 'Gerente', nota: 5 },
    ])
    expect(grupos).toHaveLength(1)
    expect(semNome).toBe(3)
  })

  it('frase longa só nomeia alguém que a casa já tem', () => {
    const { grupos, semNome } = agruparNomes([
      ...muitas('Marcelo', 11),
      { nome: 'O garcom marcelo fez um atendimento espetacular!!', nota: 5 },
      { nome: 'Super bem atendido, excepcionais.', nota: 5 },
    ])
    // A primeira frase nomeia o Marcelo; a segunda não nomeia ninguém — e já
    // apareceu como "funcionário" do Buck Burger antes desta regra existir.
    expect(grupos).toHaveLength(1)
    expect(grupos[0].notas).toHaveLength(12)
    expect(semNome).toBe(1)
  })

  it('frase não entra no "também escrito" — a lista vai para o dono do bar', () => {
    const { grupos } = agruparNomes([
      ...muitas('Daniel', 20),
      { nome: 'Daniel é nota 10!', nota: 5 },
      { nome: 'Daniel pq ele é meu amigo, e me atende super bem!', nota: 5 },
    ])
    expect(grupos[0].notas).toHaveLength(22)
    expect(grupos[0].grafias).toEqual([])
  })

  it('pontuação e emoji na borda não criam grafia nova', () => {
    const { grupos } = agruparNomes([
      ...muitas('Jackson', 14),
      { nome: 'Jackson,', nota: 5 },
      { nome: 'Jackson!', nota: 5 },
      { nome: 'Ketlen😍😍', nota: 5 },
    ])
    const jackson = grupos.find((g) => chaveFonetica(g.nome) === chaveFonetica('Jackson'))!
    expect(jackson.notas).toHaveLength(16)
    expect(jackson.grafias).toEqual([])
  })

  it('a grafia exibida é a mais usada, não a primeira que chegou', () => {
    const { grupos } = agruparNomes([
      { nome: 'nathalia', nota: 5 },
      ...muitas('Natália', 35),
      ...muitas('Natalia', 47),
    ])
    expect(grupos[0].nome).toBe('Natalia')
    expect(grupos[0].grafias).toEqual(['Natália', 'nathalia'])
  })

  it('o resultado não depende da ordem de chegada', () => {
    const entradas = [
      ...muitas('Luiz', 33),
      ...muitas('Luis', 7),
      ...muitas('Luís', 2),
      ...muitas('Pablo', 58),
      ...muitas('Hector', 20),
      ...muitas('Heitor', 20),
    ]
    const direto = agruparNomes(entradas)
    const invertido = agruparNomes([...entradas].reverse())
    expect(invertido.grupos.map((g) => g.nome)).toEqual(direto.grupos.map((g) => g.nome))
    expect(invertido.sugestoes).toEqual(direto.sugestoes)
  })

  it('nada disto mexe na nota: a média é das notas que entraram', () => {
    const { grupos } = agruparNomes([
      { nome: 'Ana', nota: 5 },
      { nome: 'Anna', nota: 4 },
      { nome: 'ana', nota: 3 },
    ])
    expect(grupos).toHaveLength(1)
    expect(grupos[0].notas.reduce((s, n) => s + n, 0) / grupos[0].notas.length).toBe(4)
  })
})
