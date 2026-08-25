import Image from 'next/image'

/**
 * Marca da ACIA — a associação, não o festival. Para o brasão do Boteco, ver
 * `Logo`.
 *
 * A marca tem miolo branco e borda azul-clara: colada direto no cartão azul
 * ela se dissolve no fundo. Por isso vive dentro de um disco claro, no mesmo
 * padrão do disco do brasão no rodapé.
 */

const ARQUIVO = '/acia-logo.png'

export default function LogoAcia({
  /** Lado do disco, em pixels. A marca ocupa o miolo, com respiro. */
  tamanho = 132,
}: {
  tamanho?: number
}) {
  const marca = Math.round(tamanho * 0.74)

  return (
    <span
      className="grid shrink-0 place-content-center rounded-full bg-claro"
      style={{ width: tamanho, height: tamanho }}
    >
      <Image
        src={ARQUIVO}
        alt="Associação Comercial e Industrial de Ariquemes"
        width={marca}
        height={marca}
        className="block object-contain"
      />
    </span>
  )
}
