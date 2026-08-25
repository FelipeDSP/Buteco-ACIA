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

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * Build enxuto para container: o Next junta em `.next/standalone` só o que o
   * servidor precisa em runtime, com as dependências já rastreadas. A imagem
   * final não leva `node_modules` inteiro nem o código-fonte.
   */
  output: 'standalone',
  // Sem isto o Turbopack sobe a árvore procurando lockfile e acha o do usuário.
  turbopack: { root: path.resolve(process.cwd()) },
  allowedDevOrigins: origensDeDesenvolvimento,
}

export default nextConfig
