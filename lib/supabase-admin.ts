import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Cliente administrativo. **Ignora RLS por completo.**
 *
 * Existe para duas coisas e só: criar a sessão de voto e gravar a avaliação.
 * `sessoes` e `avaliacoes` não têm policy alguma, então nenhuma outra chave
 * chega nelas.
 *
 * O `import 'server-only'` no topo não é enfeite: se algum dia um componente
 * de cliente importar este arquivo, o build quebra na hora, em vez de embarcar
 * a chave no bundle e vazar acesso irrestrito ao banco. A variável também não
 * tem prefixo `NEXT_PUBLIC_`, que é a segunda tranca.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY

export function supabaseAdmin() {
  if (!url || !chave) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY no .env.local — sem ela a votação não grava. Ver .env.example.',
    )
  }

  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
