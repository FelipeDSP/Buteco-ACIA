import Cabecalho from '@/components/Cabecalho'
import Rodape from '@/components/Rodape'

/**
 * Moldura do site público: faixa de fase, menu e rodapé.
 *
 * Grupo de rota não entra na URL — `/acia` continua `/acia`. O que ele faz é
 * deixar de fora o que não é site: `/painel` tem a própria moldura, e
 * `/votar/[slug]` não tem nenhuma, de propósito.
 */
export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-full focus:bg-marinho focus:px-5 focus:py-3 focus:font-bold focus:text-branco"
      >
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo">{children}</main>
      <Rodape />
    </>
  )
}
