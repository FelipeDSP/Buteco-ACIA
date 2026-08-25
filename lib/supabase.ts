import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de leitura pública.
 *
 * A chave anônima é pública por natureza — vai para o navegador junto com o
 * HTML. Quem protege os dados é o RLS: a única policy de `casas` libera
 * `SELECT` apenas onde `ativa = true`, e `sessoes` e `avaliacoes` não têm
 * policy nenhuma, então esta chave não enxerga uma linha sequer delas.
 *
 * Para escrever, ver `lib/supabase-admin.ts`.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !chave) {
  throw new Error(
    'Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY. Ver .env.example.',
  )
}

export const supabase = createClient(url, chave, {
  auth: { persistSession: false },
})
