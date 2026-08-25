import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // `server-only` lanca por design fora do Next. No teste ele vira um
      // modulo vazio; a protecao continua valendo no build de verdade.
      'server-only': path.resolve(__dirname, 'tests/vazio.ts'),
      '@': path.resolve(__dirname),
    },
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
