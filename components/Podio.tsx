'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * Pódio clássico: 1º ao centro e mais alto, 2º à esquerda, 3º à direita.
 *
 * A ordem visual e a ordem do documento são diferentes de propósito. No HTML
 * as casas vêm em 1-2-3, que é a ordem que um leitor de tela deve ouvir e a
 * que o celular empilha; a disposição de pódio é feita por `order` no CSS, só
 * na largura em que os três cabem lado a lado.
 *
 * A entrada sobe do 3º para o 1º, com um respiro entre eles — o olho segue a
 * sequência e chega no campeão por último. Sem confete e sem brilho: o
 * resultado é de um concurso municipal, não de um jogo.
 */

export type LugarDoPodio = {
  posicao: number
  notaFinal: number
  totalAvaliacoes: number
  casa: {
    slug: string
    nome: string
    prato: string | null
    pratoConfirmado: boolean
    fotoUrl: string | null
  }
}

/**
 * Ordem visual no desktop, formato da foto e atraso da entrada.
 *
 * O degrau do pódio vem da **altura da foto**, não de margem: com os cartões
 * alinhados pela base (`items-end`), margem no topo não empurra nada para
 * baixo. Foto mais alta no 1º, mais baixa no 3º, e o degrau aparece sozinho.
 */
const ARRANJO: Record<number, { ordem: string; foto: string; atraso: number }> = {
  1: { ordem: 'media:order-2', foto: 'media:aspect-4/3', atraso: 320 },
  2: { ordem: 'media:order-1', foto: 'media:aspect-3/2', atraso: 160 },
  3: { ordem: 'media:order-3', foto: 'media:aspect-16/9', atraso: 0 },
}

const nota = (v: number) => v.toFixed(2).replace('.', ',')

export default function Podio({
  lugares,
  notaMaxima,
}: {
  lugares: LugarDoPodio[]
  notaMaxima: number
}) {
  /**
   * Começa como "já entrou" e só vira "vai animar" depois da montagem, se a
   * pessoa não pediu menos movimento. Assim o HTML do servidor é o estado
   * final: sem JavaScript, ou com movimento reduzido, o pódio aparece pronto —
   * nunca invisível esperando uma animação que não vai rodar.
   */
  const [animar, setAnimar] = useState(false)
  const [entrou, setEntrou] = useState(true)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setEntrou(false)
    setAnimar(true)
    const t = requestAnimationFrame(() => setEntrou(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <ol className="flex flex-col gap-4 media:flex-row media:items-end media:gap-3">
      {lugares.map((lugar) => {
        const arranjo = ARRANJO[lugar.posicao] ?? ARRANJO[3]
        const primeiro = lugar.posicao === 1

        return (
          <li
            key={lugar.posicao}
            style={
              animar
                ? { transitionDelay: `${arranjo.atraso}ms`, transitionDuration: '420ms' }
                : undefined
            }
            className={`flex-1 overflow-hidden rounded-2xl ${arranjo.ordem} ${
              primeiro ? 'bg-marinho text-branco' : 'bg-claro'
            } ${
              animar
                ? `transition-[opacity,transform] ease-out ${
                    entrou ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                  }`
                : ''
            }`}
          >
            {/* No celular todas as fotos têm o mesmo formato; o degrau só faz
                sentido quando os três estão lado a lado. */}
            <div className={`relative aspect-4/3 bg-marinho-2 ${arranjo.foto}`}>
              {lugar.casa.fotoUrl ? (
                <Image
                  src={lugar.casa.fotoUrl}
                  alt={`${lugar.casa.prato ?? 'Prato'}, de ${lugar.casa.nome}`}
                  fill
                  sizes="(max-width: 760px) 92vw, 380px"
                  priority={primeiro}
                  className="object-cover"
                />
              ) : (
                <span className="grid h-full place-content-center text-[12.5px] font-semibold text-selo">
                  foto do prato
                </span>
              )}

              <span
                className={`absolute top-3 left-3 grid place-content-center rounded-full font-display font-extrabold ${
                  primeiro
                    ? 'size-12 bg-ambar text-[19px] text-marinho'
                    : 'size-10 bg-branco text-[16px] text-tinta'
                }`}
              >
                {lugar.posicao}º
              </span>
            </div>

            <div className={primeiro ? 'p-6' : 'p-5'}>
              <h3 className={`display ${primeiro ? 'text-[21px]' : 'text-[18px]'}`}>
                {lugar.casa.pratoConfirmado && lugar.casa.prato
                  ? lugar.casa.prato
                  : 'Prato da casa'}
              </h3>
              <p
                className={`mt-1 font-display font-bold ${
                  primeiro ? 'text-[16px] text-ouro' : 'text-[14.5px] text-tinta-3'
                }`}
              >
                {lugar.casa.nome}
              </p>

              <p className="mt-4 flex items-baseline gap-2">
                <b
                  className={`font-display leading-none font-extrabold ${
                    primeiro ? 'text-[30px]' : 'text-[24px]'
                  }`}
                >
                  {nota(lugar.notaFinal)}
                </b>
                <span className={`text-[13px] ${primeiro ? 'text-selo' : 'text-tinta-3'}`}>
                  de {notaMaxima}, em {lugar.totalAvaliacoes}{' '}
                  {lugar.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
                </span>
              </p>

              <p className="mt-5">
                <Link
                  href={`/casas/${lugar.casa.slug}`}
                  className={`btn btn-pequeno ${primeiro ? 'btn-ambar' : ''}`}
                >
                  Ver a casa
                </Link>
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
