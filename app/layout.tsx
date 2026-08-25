import type { Metadata, Viewport } from 'next'
import { Montserrat, Archivo } from 'next/font/google'
import Cabecalho from '@/components/Cabecalho'
import Rodape from '@/components/Rodape'
import { EDICAO } from '@/lib/dados'
import './globals.css'

/* Montserrat é a família da própria logo. Archivo carrega o texto corrido.
   Sem terceira fonte, sem fonte de sistema. */
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--fonte-display',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fonte-corpo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${EDICAO.nome} — festival gastronômico de ${EDICAO.cidade}`,
    template: `%s · ${EDICAO.nome}`,
  },
  description:
    'Os bares e restaurantes de Ariquemes puseram um prato na disputa. Você prova, aponta o celular para o QR da mesa e dá a sua nota. De 19 de setembro a 10 de outubro de 2026.',
  applicationName: EDICAO.nome,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: EDICAO.nome,
  },
}

export const viewport: Viewport = {
  themeColor: '#072658',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${archivo.variable}`}>
      <body className="overflow-x-hidden">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-full focus:bg-marinho focus:px-5 focus:py-3 focus:font-bold focus:text-branco"
        >
          Pular para o conteúdo
        </a>
        <Cabecalho />
        <main id="conteudo">{children}</main>
        <Rodape />
      </body>
    </html>
  )
}
