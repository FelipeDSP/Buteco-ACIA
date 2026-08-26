import path from 'node:path'
import type { NextConfig } from 'next'

/**
 * Origens liberadas para os recursos de desenvolvimento do Next.
 *
 * O Next 16 bloqueia `/_next/*` quando a origem não é localhost. Testar no
 * celular pela rede local cai exatamente nesse caso: o HTML vem (é renderizado
 * no servidor), os chunks de JavaScript são recusados, o React não hidrata e a
 * tela fica inerte — sem erro visível no navegador, só um aviso no terminal.
 *
 * Vale **só em desenvolvimento**. Em produção não existe esse bloqueio, e esta
 * lista não tem efeito nenhum.
 *
 * `BOTECO_DEV_ORIGINS=192.168.0.50,10.0.0.7 npm run dev` cobre outra rede sem
 * precisar editar este arquivo.
 */
const origensDeDesenvolvimento = [
  '192.168.1.26', // máquina de desenvolvimento na rede local
  ...(process.env.BOTECO_DEV_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
]

/**
 * Cabeçalhos de segurança. Não havia nenhum, nem local nem em produção — o
 * Traefik não adiciona por conta própria.
 *
 * O que mais importa aqui é `frame-ancestors 'none'`: sem ele, qualquer site
 * pode embutir `/votar/[slug]/avaliar` num iframe invisível e induzir a pessoa
 * a votar sem perceber em quê. Numa aplicação cujo produto é o voto, moldura
 * de terceiro é o ataque óbvio.
 *
 * `Referrer-Policy` é a segunda tranca do CPF: o formulário já é `method=post`
 * e nada sensível anda por query string, mas se algum dia escapar, o cabeçalho
 * impede que vá junto para o site seguinte.
 *
 * A CSP libera `unsafe-inline` em script porque o Next injeta o estado de
 * hidratação inline; apertar isso exige nonce por requisição, que é trabalho
 * de outra rodada. Mesmo assim a política já barra script de origem externa.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // Fotos no bucket do Supabase; data:/blob: para o next/image.
  // `tile.openstreetmap.org` não tem subdomínio, e `*.tile...` NÃO casa com
  // ele — o curinga exige um rótulo à esquerda. Sem a forma exata, o mapa
  // aparece cinza e sem nenhum erro de rede visível na página.
  "img-src 'self' data: blob: https://*.supabase.co https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const CABECALHOS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Some com `X-Powered-By: Next.js` — versão de stack não é informação de graça. */
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:caminho*', headers: CABECALHOS }]
  },
  /**
   * Build enxuto para container: o Next junta em `.next/standalone` só o que o
   * servidor precisa em runtime, com as dependências já rastreadas. A imagem
   * final não leva `node_modules` inteiro nem o código-fonte.
   */
  output: 'standalone',
  // Sem isto o Turbopack sobe a árvore procurando lockfile e acha o do usuário.
  turbopack: { root: path.resolve(process.cwd()) },
  allowedDevOrigins: origensDeDesenvolvimento,
  /**
   * As fotos dos pratos ficam no bucket `casas` do Supabase. Sem liberar o
   * host aqui, o next/image recusa a URL e a foto some — o painel deixa
   * enviar, grava a URL, e a imagem nunca aparece.
   */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: new URL(
          process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://exemplo.supabase.co',
        ).hostname,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
