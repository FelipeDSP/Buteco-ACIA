'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Louros } from '@/components/Ornamentos'
import { EDICAO } from '@/data/edicao'

/**
 * Pódio clássico: 1º ao centro e mais alto, 2º à esquerda, 3º à direita.
 *
 * A ordem visual e a ordem do documento são diferentes de propósito. No HTML
 * as casas vêm em 1-2-3, que é a ordem que um leitor de tela deve ouvir e a
 * que o celular empilha; a disposição de pódio é feita por `order` no CSS, só
 * na largura em que os três cabem lado a lado.
 *
 * A entrada sobe do 3º para o 1º, com um respiro entre eles — o olho segue a
 * sequência e chega no campeão por último.
 *
 * **Comemorativo sem virar festa infantil.** O componente vive sobre bloco
 * marinho, que é o único fundo em que o ouro existe no site: por isso a coroa
 * de louros e o filete do campeão brilham aqui e em lugar nenhum mais. O
 * degrau é desenhado (`ALTURA_DO_DEGRAU`), não sugerido pela proporção da
 * foto — antes vinha só daí e quase não se lia. Nada de confete, estrela
 * (proibida) ou brilho animado: solene, não lúdico.
 *
 * **Sem nota e sem contagem de votos, por decisão da ACIA em 30/09/2026.** A
 * página anuncia quem ganhou, não por quanto. Publicar o número abre duas
 * portas ruins: a comparação entre 2º e 3º, que na prática diferem na terceira
 * casa decimal, e a pergunta de quanto fez quem não aparece. O número existe
 * no retrato de `resultado`, no painel e no certificado da casa.
 */

export type LugarDoPodio = {
  posicao: number
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
const ARRANJO: Record<number, { ordem: string; atraso: number }> = {
  1: { ordem: 'media:order-2', atraso: 320 },
  2: { ordem: 'media:order-1', atraso: 160 },
  3: { ordem: 'media:order-3', atraso: 0 },
}

/**
 * Altura do degrau sob cada cartão, em pixels. Só entra na largura em que os
 * três ficam lado a lado — empilhado no celular, plataforma de alturas
 * diferentes não significaria nada.
 *
 * Com `items-end`, a base dos três é a mesma linha: degrau mais alto empurra o
 * cartão para cima. Daí o campeão subir.
 */
const ALTURA_DO_DEGRAU: Record<number, number> = { 1: 72, 2: 44, 3: 20 }

/** Espessura da face superior do bloco, em pixels. */
const FACE = 6

export default function Podio({ lugares }: { lugares: LugarDoPodio[] }) {
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
            className={`flex flex-1 flex-col ${arranjo.ordem} ${
              animar
                ? `transition-[opacity,transform] ease-out ${
                    entrou ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                  }`
                : ''
            }`}
          >
            <div
              className={`overflow-hidden rounded-2xl ${
                primeiro
                  ? 'bg-marinho text-branco ring-2 ring-ouro/70'
                  : 'bg-claro text-tinta'
              }`}
            >
            {/* No celular todas as fotos têm o mesmo formato; o degrau só faz
                sentido quando os três estão lado a lado. */}
            {/* Mesma proporção nos três. A variação de formato já foi o que
                sugeria o pódio, e ficava desigual demais — o 1º alto demais, o
                3º achatado. Agora quem faz o degrau é o degrau. */}
            <div className="relative aspect-4/3 bg-marinho-2">
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

              {/* Sobre a foto o selo é igual para os três: ouro aqui não
                  funcionaria — a regra é "ouro só sobre marinho", e foto de
                  prato é fundo claro e colorido. Os louros do campeão ficam no
                  corpo do cartão, que é marinho. */}
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

            <div className={primeiro ? 'p-6 text-center' : 'p-5'}>
              {/* O emblema do campeão. Aqui o fundo é marinho, então o ouro
                  pode existir — é o único ponto do site em que ele aparece
                  como ornamento, e não como filete. */}
              {primeiro ? (
                <span className="relative mx-auto mb-3 block h-[137px] w-[156px]">
                  <Louros className="absolute inset-0 h-full w-full text-ouro" />
                  {/* A coroa abre para cima e os grãos avançam para dentro, e
                      é o grão — não o caule — que define o vão útil: cerca de
                      58% da largura na altura deste texto. Mexer no tamanho da
                      fonte ou da coroa sem refazer essa conta faz a palavra
                      bater nos ramos. */}
                  <span className="absolute inset-x-0 top-[50px] block text-center font-display text-[11px] leading-[1.25] font-extrabold tracking-[0.05em] text-ambar uppercase">
                    Campeão
                    <br />
                    <span className="text-[17px] tracking-normal text-branco">
                      {EDICAO.ano}
                    </span>
                  </span>
                </span>
              ) : null}
              <h3 className={`display ${primeiro ? 'text-[24px]' : 'text-[18px]'}`}>
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

              <p className="mt-5">
                <Link
                  href={`/casas/${lugar.casa.slug}`}
                  className={`btn btn-pequeno ${primeiro ? 'btn-ambar' : ''}`}
                >
                  Ver a casa
                </Link>
              </p>
              </div>
            </div>

            {/* O degrau. `mt-auto` prende na base porque os cartões têm alturas
                diferentes; `hidden media:block` porque empilhado ele não
                significaria nada. */}
            {/* O bloco do pódio. A face superior clara é o que o faz ler
                como plataforma: só escurecer virava sombra do cartão. */}
            <div
              style={{
                height: ALTURA_DO_DEGRAU[lugar.posicao] ?? 20,
                background: `linear-gradient(to bottom, var(--color-acia) 0 ${FACE}px, var(--color-marinho-2) ${FACE}px)`,
              }}
              className={`mt-auto hidden rounded-b-xl media:block ${
                primeiro ? 'ring-1 ring-ouro/40' : ''
              }`}
              aria-hidden="true"
            />
          </li>
        )
      })}
    </ol>
  )
}
