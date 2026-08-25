'use client'

import dynamic from 'next/dynamic'
import type { Casa } from '@/lib/tipos'

/**
 * Casca do mapa. `ssr: false` só é aceito dentro de um componente de cliente,
 * e é obrigatório aqui: o Leaflet lê `window` na importação.
 */
const MapaCasas = dynamic(() => import('@/components/MapaCasas'), {
  ssr: false,
  loading: () => (
    <div
      className="h-[320px] w-full animate-pulse rounded-2xl bg-creme larga:h-[440px]"
      aria-hidden="true"
    />
  ),
})

export default function Mapa({ casas }: { casas: readonly Casa[] }) {
  return <MapaCasas casas={casas} />
}
