import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Derruba o cache das páginas de casa depois de uma gravação no painel.
 *
 * `/casas/[slug]` é ISR (`revalidate = 3600`), e ISR é *stale-while-revalidate*:
 * a primeira visita depois do prazo recebe a versão VELHA e só então dispara a
 * regeneração; quem vê a nova é a visita seguinte. Foi assim que as fotos dos
 * pratos ficaram invisíveis por dias — o deploy foi construído minutos antes
 * da primeira foto subir, as doze páginas nasceram com placeholder, e com
 * pouco tráfego cada pessoa que abria uma casa era a "primeira visita" que
 * leva a versão antiga.
 *
 * Invalida TODAS as casas, não só a editada: a página de uma casa mostra as
 * outras como sugestão, com foto e nome, então trocar a foto de uma muda a
 * página das vizinhas. São poucas páginas e a regeneração é sob demanda —
 * em route handler a marcação não renderiza nada na hora; a próxima visita a
 * cada página é que sai fresca (e bloqueante, não *stale*).
 *
 * **Caminho literal, um por casa, de propósito.** A forma com padrão
 * (`revalidatePath('/casas/[slug]', 'page')`) foi testada no build standalone
 * desta versão do Next e não invalidou nada: a página seguia `HIT` com o dado
 * velho. Só o caminho literal deu `MISS`. Se um dia for simplificar para o
 * padrão, refaça o teste — gravar um campo pelo painel e conferir a primeira
 * visita — antes de confiar.
 *
 * A home não precisa: lê `searchParams` e por isso é dinâmica, bate no banco
 * a cada visita.
 */
export async function invalidarPaginasDeCasa(): Promise<void> {
  const { data, error } = await supabaseAdmin().from('casas').select('slug')
  if (error) {
    // A gravação já aconteceu; o pior caso aqui é a página levar a hora do ISR.
    console.error(`Não deu para invalidar as páginas de casa: ${error.message}`)
    return
  }
  for (const { slug } of data ?? []) revalidatePath(`/casas/${slug}`)
}
