import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Autenticação do painel: uma senha só, sem contas.
 *
 * Usam isto duas ou três pessoas da ACIA. Cadastro, recuperação de senha e
 * papéis de usuário seriam semanas de trabalho para resolver um problema que
 * não existe aqui.
 *
 * O cookie não guarda a senha nem um id de sessão: guarda `validade.assinatura`,
 * onde a assinatura é HMAC da validade usando a própria senha como chave. Isso
 * significa que **ter o cookie prova ter sabido a senha**, sem precisar de
 * tabela de sessão — e que trocar `PAINEL_SENHA` invalida todos os cookies
 * emitidos, na hora.
 */

export const COOKIE_DO_PAINEL = 'boteco_painel'

/** Oito horas: um turno de trabalho, não um mês de acesso esquecido aberto. */
const DURACAO_MS = 8 * 60 * 60 * 1000

function senhaConfigurada(): string {
  const senha = process.env.PAINEL_SENHA
  if (!senha || senha.length < 12) {
    throw new Error(
      'PAINEL_SENHA ausente ou curta demais. O painel não sobe sem ela — ver .env.example.',
    )
  }
  return senha
}

/** Comparação em tempo constante: `===` vaza o tamanho do prefixo certo. */
function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  if (x.length !== y.length) return false
  return timingSafeEqual(x, y)
}

function assinar(validade: number, senha: string): string {
  return createHmac('sha256', senha).update(String(validade)).digest('hex')
}

export function senhaConfere(tentativa: unknown): boolean {
  if (typeof tentativa !== 'string' || tentativa.length === 0) return false
  return iguais(tentativa, senhaConfigurada())
}

export function crachaNovo(): { valor: string; expiraEm: Date } {
  const validade = Date.now() + DURACAO_MS
  return {
    valor: `${validade}.${assinar(validade, senhaConfigurada())}`,
    expiraEm: new Date(validade),
  }
}

function crachaVale(valor: string | undefined): boolean {
  if (!valor) return false
  const [validadeTexto, assinatura] = valor.split('.')
  const validade = Number(validadeTexto)
  if (!Number.isFinite(validade) || !assinatura) return false
  if (validade <= Date.now()) return false

  try {
    return iguais(assinatura, assinar(validade, senhaConfigurada()))
  } catch {
    return false
  }
}

/** Verdadeiro quando o pedido traz um crachá válido. Não redireciona. */
export async function temSessaoDoPainel(): Promise<boolean> {
  const cookie = (await cookies()).get(COOKIE_DO_PAINEL)?.value
  return crachaVale(cookie)
}

/**
 * Trava das páginas do painel. Chamada no layout, protege tudo abaixo dele —
 * no servidor, antes de qualquer dado ser lido. Esconder no cliente não seria
 * proteção nenhuma.
 */
export async function exigirSessaoDoPainel(): Promise<void> {
  if (!(await temSessaoDoPainel())) redirect('/painel/entrar')
}

/**
 * Trava dos route handlers. Devolve 401 em vez de redirecionar — é a resposta
 * certa para quem chamou a API direto, sem passar pela tela.
 */
export async function recusarSemSessao(): Promise<Response | null> {
  if (await temSessaoDoPainel()) return null
  return Response.json({ erro: 'Sessão do painel expirada ou ausente.' }, { status: 401 })
}
