import type { Metadata, Viewport } from 'next'
import { Montserrat, Archivo } from 'next/font/google'
import { CALENDARIO, EDICAO } from '@/lib/dados'
import { dataLonga } from '@/lib/formato'
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

/**
 * Endereço público do site. Sem ele, o Next não consegue transformar caminho
 * relativo em URL absoluta na hora de montar a prévia de compartilhamento — e
 * o link colado no WhatsApp sai sem imagem e sem descrição.
 *
 * Variável de runtime, sem prefixo NEXT_PUBLIC_: é lida no servidor ao montar
 * o metadata, então trocar o domínio não exige rebuild.
 */
const enderecoDoSite = process.env.BOTECO_SITE_URL ?? 'http://localhost:3311'

export const metadata: Metadata = {
  metadataBase: new URL(enderecoDoSite),
  title: {
    default: `${EDICAO.nome} — festival gastronômico de ${EDICAO.cidade}`,
    template: `%s · ${EDICAO.nome}`,
  },
  description: `Os bares e restaurantes de Ariquemes puseram um prato na disputa. Você prova, aponta o celular para o QR da mesa e dá a sua nota. De ${dataLonga(CALENDARIO.inicioFestival)} a ${dataLonga(CALENDARIO.fimFestival)} de ${EDICAO.ano}.`,
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

/**
 * Layout raiz: só html, body e as fontes.
 *
 * Cabeçalho e rodapé do site vivem em `app/(publico)/layout.tsx`, não aqui.
 * Quando estavam neste arquivo, o painel e a tela de voto herdavam a navegação
 * inteira do site — na tela de voto isso significava carregar menu, faixa de
 * fase e rodapé com doze patrocinadores numa página que precisa abrir rápido
 * em 4G ruim, e ainda dava saída no meio do voto.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${archivo.variable}`}>
      <body className="overflow-x-hidden">{children}</body>
    </html>
  )
}
