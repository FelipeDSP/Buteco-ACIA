'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { linkComoChegar, nomeDoPrato, type Casa } from '@/lib/tipos'

// Sem este CSS os tiles saem desalinhados e o mapa parece quebrado.
import 'leaflet/dist/leaflet.css'

/**
 * Mapa das casas. Carregado só no cliente — o Leaflet toca `window` na
 * importação e derruba o render de servidor do Next.
 *
 * O pino é `divIcon`, não imagem: entra na cor da paleta e dispensa os PNGs
 * do Leaflet, que quebram sozinhos no bundler.
 */

const PINO = L.divIcon({
  className: '',
  // Gota invertida, como o pino de mapa que todo mundo já sabe ler. A ponta
  // embaixo é que marca o lugar — daí o `iconAnchor` na ponta, não no centro.
  html: `<svg width="26" height="36" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg"
    style="display:block; filter:drop-shadow(0 2px 3px rgba(4,24,47,.45))">
    <path d="M13 34C13 34 24 21 24 13A11 11 0 1 0 2 13C2 21 13 34 13 34Z"
      fill="var(--color-ambar)" stroke="var(--color-marinho)"
      stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="13" cy="13" r="4.5" fill="var(--color-marinho)"/>
  </svg>`,
  iconSize: [26, 36],
  iconAnchor: [13, 34],
  popupAnchor: [0, -32],
})

/** Casa que de fato pode virar pino. Coordenada é opcional no banco. */
type CasaNoMapa = Casa & { lat: number; lng: number }

const temCoordenada = (c: Casa): c is CasaNoMapa => c.lat != null && c.lng != null

/** Enquadra em todos os marcadores; sem isto o mapa abre num zoom arbitrário. */
function Enquadrar({ casas }: { casas: readonly CasaNoMapa[] }) {
  const mapa = useMap()

  useEffect(() => {
    if (casas.length === 0) return
    const limites = L.latLngBounds(casas.map((c) => [c.lat, c.lng] as [number, number]))
    const alvo = mapa.getContainer()
    let medida = ''

    /**
     * `invalidateSize` antes de enquadrar não é ritual: o mapa monta dentro do
     * placeholder do dynamic import e a altura muda de 320 para 440 no
     * breakpoint. Sem isso o Leaflet enquadra com a medida velha e os pinos
     * saem para fora da moldura.
     */
    const enquadrar = () => {
      const atual = `${alvo.clientWidth}x${alvo.clientHeight}`
      if (atual === medida) return
      medida = atual
      mapa.invalidateSize()
      // Sem animação: é o enquadramento de abertura, não um movimento que o
      // visitante pediu.
      mapa.fitBounds(limites, { padding: [48, 48], animate: false })
    }

    enquadrar()
    const observador = new ResizeObserver(enquadrar)
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [mapa, casas])

  return null
}

export default function MapaCasas({ casas }: { casas: readonly Casa[] }) {
  // Casa sem coordenada some do mapa, mas continua na lista abaixo — melhor
  // ausente do mapa do que cravada num ponto errado.
  const noMapa = casas.filter(temCoordenada)
  if (noMapa.length === 0) return null

  return (
    <MapContainer
      // Centro provisório: `Enquadrar` reposiciona assim que o mapa monta.
      center={[noMapa[0].lat, noMapa[0].lng]}
      zoom={14}
      /**
       * As casas formam uma mancha alta e estreita. Com o passo de zoom
       * inteiro do padrão, o `fitBounds` só acha nível que sobra — os pinos
       * ficavam em pouco mais da metade da altura. Passo de 0,25 deixa
       * escolher o zoom que enche a moldura. Os botões +/− continuam
       * andando de um em um.
       */
      zoomSnap={0.25}
      // Sem isto o mapa sequestra a rolagem da página no celular.
      scrollWheelZoom={false}
      className="h-[320px] w-full rounded-2xl larga:h-[440px]"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />

      <Enquadrar casas={noMapa} />

      {noMapa.map((casa) => (
        <Marker key={casa.slug} position={[casa.lat, casa.lng]} icon={PINO}>
          <Popup>
            <b className="block font-display text-[15px] leading-tight font-extrabold text-tinta">
              {casa.nome}
            </b>
            <span className="mt-0.5 block text-[13px] text-tinta-3">
              {nomeDoPrato(casa)}
              {casa.bairro ? ` · ${casa.bairro}` : ''}
            </span>
            <span className="mt-2.5 flex flex-wrap gap-2">
              <Link href={`/casas/${casa.slug}`} className="btn btn-pequeno">
                Ver a casa
              </Link>
              <a
                href={linkComoChegar(casa)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-linha btn-pequeno"
              >
                Como chegar
              </a>
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
