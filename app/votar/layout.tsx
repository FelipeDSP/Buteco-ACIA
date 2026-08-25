/**
 * A tela de voto não leva menu nem rodapé.
 *
 * É a página com prazo real, aberta no celular à noite com 4G ruim. Cada
 * elemento a mais é peso para carregar e um convite a sair no meio do voto.
 * Quem chega aqui veio pelo QR da mesa e tem uma tarefa só.
 */
export default function LayoutDoVoto({ children }: { children: React.ReactNode }) {
  return <main id="conteudo">{children}</main>
}
