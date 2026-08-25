import Image from 'next/image'

/**
 * A foto do prato tem dono futuro: cada estabelecimento ainda vai mandar a sua.
 * Enquanto não chega, o espaço se declara vazio em vez de fingir conteúdo.
 */

type Props = {
  src: string | null
  /** Nome do prato, para compor o alt quando houver foto. */
  prato: string
  casa: string
  className?: string
  /** Repassado ao next/image; a primeira foto da página costuma valer prioridade. */
  prioridade?: boolean
  sizes?: string
}

export default function FotoPrato({
  src,
  prato,
  casa,
  className = '',
  prioridade = false,
  sizes = '(max-width: 720px) 100vw, 262px',
}: Props) {
  if (!src) {
    return (
      <div
        className={`grid place-content-center bg-marinho p-5 text-center ${className}`}
      >
        <span className="rounded-xl border-2 border-dashed border-ouro/45 px-4 py-3 text-[12.5px] leading-snug font-semibold text-selo">
          foto do prato
          <br />
          em breve
        </span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-marinho ${className}`}>
      <Image
        src={src}
        alt={`${prato}, servido por ${casa}`}
        fill
        sizes={sizes}
        priority={prioridade}
        className="object-cover"
      />
    </div>
  )
}
