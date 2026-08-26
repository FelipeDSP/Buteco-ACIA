import Image from 'next/image'
import { REALIZADORES } from '@/lib/realizacao'

/**
 * Marca da ACIA — a associação, não o festival. Para o brasão do Boteco, ver
 * `Logo`.
 *
 * A marca tem miolo branco e borda azul-clara: colada direto no cartão azul
 * ela se dissolve no fundo. Por isso vive dentro de um disco claro, no mesmo
 * padrão do disco do brasão no rodapé.
 *
 * O arquivo vem de `lib/realizacao.ts` — é a **mesma** arte que assina a faixa
 * de realização e o rodapé. Já houve uma cópia separada em
 * `public/acia-logo.png`, e duas cópias da mesma marca é como uma delas fica
 * para trás quando a associação manda a arte nova.
 */

const ACIA = REALIZADORES.find((r) => r.curto === 'ACIA')!

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
        src={`/realizacao/${ACIA.arquivo}`}
        alt={ACIA.nome}
        width={marca}
        height={marca}
        className="block object-contain"
      />
    </span>
  )
}
