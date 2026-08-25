import 'server-only'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NOME_DO_COOKIE } from '@/lib/pedido'

/**
 * Estado da sessão de voto. A recusa é sempre explícita: quem chega aqui sem
 * sessão válida precisa saber que basta apontar o QR de novo.
 */

export type MotivoRecusa = 'sem-cookie' | 'inexistente' | 'expirada' | 'usada' | 'outra-casa'

export type Sessao = { id: string; casaId: string }

export type Verificacao =
  | { ok: true; sessao: Sessao }
  | { ok: false; motivo: MotivoRecusa }

export async function lerSessao(casaId: string): Promise<Verificacao> {
  const id = (await cookies()).get(NOME_DO_COOKIE)?.value
  if (!id) return { ok: false, motivo: 'sem-cookie' }

  const { data, error } = await supabaseAdmin()
    .from('sessoes')
    .select('id, casa_id, expira_em, usada_em')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return { ok: false, motivo: 'inexistente' }
  if (data.casa_id !== casaId) return { ok: false, motivo: 'outra-casa' }
  if (data.usada_em) return { ok: false, motivo: 'usada' }
  if (new Date(data.expira_em).getTime() <= Date.now()) {
    return { ok: false, motivo: 'expirada' }
  }

  return { ok: true, sessao: { id: data.id, casaId: data.casa_id } }
}

export const RECUSA: Record<MotivoRecusa, string> = {
  'sem-cookie':
    'Não encontramos a sua sessão de voto. Aponte a câmera para o QR code da mesa de novo.',
  inexistente:
    'Essa sessão de voto não existe mais. Aponte a câmera para o QR code da mesa de novo.',
  expirada:
    'A sessão expirou — ela vale por 20 minutos. Aponte a câmera para o QR code da mesa de novo.',
  usada: 'Esta sessão já virou uma avaliação. Cada leitura do QR vale um voto.',
  'outra-casa':
    'A sua sessão é de outra casa. Aponte a câmera para o QR code da mesa onde você está.',
}
