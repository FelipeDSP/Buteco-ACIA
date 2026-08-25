/** Pílula de tipo e bairro. `tom` separa a categoria (marinho) do lugar (âmbar). */
export default function Etiqueta({
  children,
  tom = 'lugar',
}: {
  children: React.ReactNode
  tom?: 'tipo' | 'lugar'
}) {
  const cores =
    tom === 'tipo'
      ? 'bg-selo/40 text-marinho-2'
      : 'bg-branco text-ambar-e'
  return (
    <span
      className={`rounded-full px-3 py-0.5 text-[12.5px] font-bold ${cores}`}
    >
      {children}
    </span>
  )
}
