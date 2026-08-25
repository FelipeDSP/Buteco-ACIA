import { existsSync } from 'node:fs'
import path from 'node:path'
import Image from 'next/image'

/**
 * Único ponto de uso do brasão oficial em todo o site.
 * O arquivo nunca é redesenhado, recolorido ou distorcido — só reduzido.
 *
 * Enquanto `public/logo/Logo_Boteco_Acia.png` não estiver no repositório,
 * entra um marcador de ausência explícito. Preencher com um desenho parecido
 * seria pior que mostrar que falta.
 */

const ARQUIVO = '/logo/Logo_Boteco_Acia.png'

const TEM_BRASAO = existsSync(path.join(process.cwd(), 'public', 'logo', 'Logo_Boteco_Acia.png'))

type Props = {
  /** Lado do quadrado, em pixels. */
  tamanho?: number
  /** Decorativo quando o nome do evento já aparece escrito ao lado. */
  decorativo?: boolean
  className?: string
  prioridade?: boolean
}

export default function Logo({
  tamanho = 52,
  decorativo = false,
  className = '',
  prioridade = false,
}: Props) {
  if (!TEM_BRASAO) {
    return (
      <span
        role={decorativo ? undefined : 'img'}
        aria-label={decorativo ? undefined : 'Brasão do Boteco ACIA'}
        aria-hidden={decorativo || undefined}
        title="Brasão oficial pendente de envio pela ACIA"
        className={`grid shrink-0 place-content-center rounded-full border-2 border-dashed border-marinho/40 text-center text-[9px] leading-tight font-semibold text-marinho/55 ${className}`}
        style={{ width: tamanho, height: tamanho }}
      >
        brasão
      </span>
    )
  }

  return (
    <Image
      src={ARQUIVO}
      alt={decorativo ? '' : 'Brasão do Boteco ACIA'}
      aria-hidden={decorativo || undefined}
      width={tamanho}
      height={tamanho}
      priority={prioridade}
      className={`block shrink-0 ${className}`}
    />
  )
}
