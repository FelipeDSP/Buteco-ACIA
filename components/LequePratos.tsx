'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import FotoPrato from '@/components/FotoPrato'
import { nomeDoPrato, type Casa } from '@/lib/tipos'

/**
 * Leque do hero: três cartões sobrepostos e inclinados que percorrem TODAS as
 * casas, para nenhuma ficar de fora da vitrine.
 *
 * É elemento visual, não navegação — sem setas, sem indicadores, sem controle.
 * Quem quer escolher usa a lista abaixo.
 *
 * A ordem é sorteada depois da hidratação: no servidor sai a ordem da lista,
 * igual ao primeiro render do cliente, então não há divergência de SSR.
 */

/**
 * Posições do leque. As duas pontas ficam invisíveis, fora da moldura: são a
 * porta de entrada e a de saída. Cada cartão anda uma casa para a esquerda a
 * cada volta, e é a transição de CSS que faz o deslize — o cartão não é
 * remontado, só recebe a posição do slot seguinte.
 */
const SLOTS = [
  { left: '-30%', giro: '-14deg', escala: '0.88', opacidade: 0, z: 0 },
  { left: '0%', giro: '-8deg', escala: '1', opacidade: 1, z: 10 },
  { left: '28%', giro: '-1deg', escala: '1.05', opacidade: 1, z: 30 },
  { left: '56%', giro: '7deg', escala: '1', opacidade: 1, z: 20 },
  { left: '86%', giro: '13deg', escala: '0.88', opacidade: 0, z: 0 },
] as const

/** Sem rotação, só os três do meio existem. */
const PARADO = [1, 2, 3]
const RODANDO = [0, 1, 2, 3, 4]

/** O slot do meio é o destaque, e é por onde toda casa passa. */
const DESTAQUE = 2

const INTERVALO = 4000
const DESLIZE = 600
const CURVA = 'cubic-bezier(0.4, 0, 0.2, 1)'

const TRANSICAO = ['left', 'rotate', 'scale', 'opacity']
  .map((prop) => `${prop} ${DESLIZE}ms ${CURVA}`)
  .join(', ')

function embaralhar(lista: readonly Casa[]): Casa[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

export default function LequePratos({ casas }: { casas: readonly Casa[] }) {
  // Estado inicial determinístico — é o que o servidor também renderiza.
  const [ordem, setOrdem] = useState<readonly Casa[]>(() => casas.slice(0, PARADO.length))
  const [inicio, setInicio] = useState(0)
  const [rodando, setRodando] = useState(false)
  const [pausado, setPausado] = useState(false)

  const originais = useRef(casas)

  useEffect(() => {
    const lista = embaralhar(originais.current)
    setOrdem(lista)

    // Com movimento reduzido, o leque para de pé: três casas sorteadas, fixas.
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // A janela tem cinco posições; com menos casas que isso um mesmo cartão
    // apareceria duas vezes na mesma volta.
    setRodando(!reduzido && lista.length >= SLOTS.length)
  }, [])

  useEffect(() => {
    if (!rodando || pausado) return
    const passo = setInterval(
      () => setInicio((i) => (i + 1) % ordem.length),
      INTERVALO,
    )
    return () => clearInterval(passo)
  }, [rodando, pausado, ordem.length])

  if (ordem.length === 0) return null

  const posicoes = rodando ? RODANDO : PARADO

  return (
    <ul
      aria-live="off"
      className="relative h-[clamp(268px,33vw,392px)]"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      {posicoes.map((posicao) => {
        const slot = SLOTS[posicao]
        // O slot 1 é o primeiro visível, daí o −1: a casa de índice `inicio`
        // abre o leque. A chave é a casa, não o slot — é o que faz o mesmo nó
        // do DOM viajar entre as posições em vez de piscar.
        const casa = ordem[(((inicio + posicao - 1) % ordem.length) + ordem.length) % ordem.length]
        if (!casa) return null

        const inerte = slot.opacidade === 0

        return (
          <li
            key={casa.slug}
            aria-hidden={inerte || undefined}
            style={{
              left: slot.left,
              rotate: slot.giro,
              scale: slot.escala,
              opacity: slot.opacidade,
              zIndex: slot.z,
              transition: rodando ? TRANSICAO : undefined,
            }}
            className={`absolute w-[min(212px,42%)] ${inerte ? 'pointer-events-none' : ''}`}
          >
            <Link
              href={`/casas/${casa.slug}`}
              tabIndex={inerte ? -1 : undefined}
              className="block overflow-hidden rounded-2xl bg-claro shadow-[0_16px_34px_rgba(4,24,47,0.42)]"
            >
              <FotoPrato
                src={casa.prato.foto}
                prato={nomeDoPrato(casa)}
                casa={casa.nome}
                prioridade={!rodando && posicao === DESTAQUE}
                sizes="212px"
                className="aspect-square w-full"
              />
              <div className="px-3.5 pt-3 pb-4">
                <b className="block font-display text-[15px] leading-tight font-extrabold text-tinta">
                  {nomeDoPrato(casa)}
                </b>
                <span className="mt-0.5 block text-[12.5px] text-tinta-3">
                  {casa.nome}
                </span>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
