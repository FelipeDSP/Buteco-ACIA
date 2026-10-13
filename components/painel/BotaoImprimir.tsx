'use client'

/**
 * Chama a impressão do navegador, que é por onde sai o PDF.
 *
 * Componente de cliente por uma linha só: `window.print()` não existe no
 * servidor. O botão fica escondido na própria impressão (`.naoimprime`), senão
 * apareceria dentro do papel.
 */
export default function BotaoImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="btn">
      Imprimir ou salvar em PDF
    </button>
  )
}
