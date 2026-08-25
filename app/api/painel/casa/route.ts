import { NextResponse, type NextRequest } from 'next/server'
import { recusarSemSessao } from '@/lib/painel-auth'
import { slugDoNome } from '@/lib/painel'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { DIAS, type Faixa, type Horarios } from '@/lib/tipos'

export const dynamic = 'force-dynamic'

/** Campos que o painel pode escrever. `slug` fica de fora depois de criado. */
const TEXTO = [
  'nome',
  'prato',
  'preco',
  'descricao',
  'categoria',
  'bairro',
  'endereco',
  'instagram',
  'telefone',
  'foto_url',
] as const

const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/

/**
 * Valida os horários antes de gravar. O formato é `{"seg":[["18:00","23:30"]]}`
 * e ele alimenta a janela de aceitação de voto — jsonb torto aqui vira casa que
 * não recebe voto no dia do festival, então nada entra sem conferência.
 */
function horariosLimpos(bruto: unknown): { ok: true; valor: Horarios } | { ok: false; erro: string } {
  if (bruto === null || bruto === undefined) return { ok: true, valor: {} }
  if (typeof bruto !== 'object' || Array.isArray(bruto)) {
    return { ok: false, erro: 'Horários em formato inesperado.' }
  }

  const limpo: Horarios = {}
  for (const [dia, faixas] of Object.entries(bruto as Record<string, unknown>)) {
    if (!(DIAS as readonly string[]).includes(dia)) {
      return { ok: false, erro: `Dia desconhecido: ${dia}.` }
    }
    if (!Array.isArray(faixas)) return { ok: false, erro: `Faixas inválidas em ${dia}.` }
    if (faixas.length === 0) continue // dia sem faixa = casa fechada nesse dia

    const doDia: Faixa[] = []
    for (const faixa of faixas) {
      if (!Array.isArray(faixa) || faixa.length !== 2) {
        return { ok: false, erro: `Faixa mal formada em ${dia}.` }
      }
      const [de, ate] = faixa.map((h) => String(h).trim())
      if (!HORA.test(de) || !HORA.test(ate)) {
        return { ok: false, erro: `Horário inválido em ${dia}: "${de}" às "${ate}". Use HH:MM.` }
      }
      if (de === ate) {
        return { ok: false, erro: `Em ${dia}, abertura e fechamento são iguais (${de}).` }
      }
      doDia.push([de, ate])
    }
    limpo[dia as keyof Horarios] = doDia
  }
  return { ok: true, valor: limpo }
}

const coordenada = (v: unknown, limite: number): number | null | undefined => {
  if (v === '' || v === null) return null
  if (v === undefined) return undefined
  const n = Number(v)
  if (!Number.isFinite(n) || Math.abs(n) > limite) return undefined
  return n
}

export async function POST(pedido: NextRequest) {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const corpo = (await pedido.json().catch(() => null)) as Record<string, unknown> | null
  if (!corpo) return NextResponse.json({ erro: 'Pedido malformado.' }, { status: 400 })

  const { id, ativa, prato_confirmado, lat, lng, horarios, ordem } = corpo
  const criando = !id

  const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : ''
  if (criando && nome.length < 2) {
    return NextResponse.json({ erro: 'A casa precisa de um nome.' }, { status: 400 })
  }
  /**
   * U+FFFD é a assinatura de texto que chegou com a codificação trocada. Num
   * campo qualquer daria só um nome feio; aqui gera o slug, que vai impresso
   * no QR e não muda mais. Melhor recusar do que carimbar o erro em papel.
   */
  if (nome.includes('�')) {
    return NextResponse.json(
      { erro: 'O nome chegou com caracteres corrompidos. Digite de novo, sem colar de outro programa.' },
      { status: 400 },
    )
  }

  const linha: Record<string, unknown> = {}
  for (const campo of TEXTO) {
    const valor = corpo[campo]
    if (valor === undefined) continue
    const texto = typeof valor === 'string' ? valor.trim() : ''
    linha[campo] = texto === '' ? (campo === 'nome' ? '' : null) : texto
  }
  if (typeof linha.nome === 'string' && linha.nome === '') delete linha.nome

  if (typeof ativa === 'boolean') linha.ativa = ativa
  if (typeof prato_confirmado === 'boolean') linha.prato_confirmado = prato_confirmado
  if (ordem !== undefined && Number.isFinite(Number(ordem))) linha.ordem = Number(ordem)

  const la = coordenada(lat, 90)
  const ln = coordenada(lng, 180)
  if (la !== undefined) linha.lat = la
  if (ln !== undefined) linha.lng = ln

  if (horarios !== undefined) {
    const conferido = horariosLimpos(horarios)
    if (!conferido.ok) return NextResponse.json({ erro: conferido.erro }, { status: 400 })
    linha.horarios = conferido.valor
  }

  const banco = supabaseAdmin()

  if (criando) {
    // O slug nasce aqui e nunca mais muda: ele vai impresso dentro do QR code.
    const base = slugDoNome(nome)
    if (!base) {
      return NextResponse.json(
        { erro: 'Não deu para gerar um endereço a partir desse nome.' },
        { status: 400 },
      )
    }
    linha.slug = base
    linha.nome = nome
    linha.ativa = typeof ativa === 'boolean' ? ativa : false

    const { data, error } = await banco.from('casas').insert(linha).select('id, slug').single()
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { erro: `Já existe uma casa com o endereço "${base}". Mude o nome.` },
          { status: 409 },
        )
      }
      return NextResponse.json({ erro: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, id: data.id, slug: data.slug })
  }

  linha.atualizada_em = new Date().toISOString()
  const { error } = await banco.from('casas').update(linha).eq('id', id as string)
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/**
 * "Remover" é sempre `ativa = false`. **Nunca DELETE:** `avaliacoes.casa_id`
 * aponta para cá, e apagar a casa levaria os votos junto — ou faria o banco
 * recusar a operação, na melhor das hipóteses. Voto apurado não se destrói
 * para arrumar a listagem.
 */
export async function DELETE(pedido: NextRequest) {
  const semSessao = await recusarSemSessao()
  if (semSessao) return semSessao

  const { id } = (await pedido.json().catch(() => ({}))) as { id?: string }
  if (!id) return NextResponse.json({ erro: 'Casa não informada.' }, { status: 400 })

  const { error } = await supabaseAdmin()
    .from('casas')
    .update({ ativa: false, atualizada_em: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
