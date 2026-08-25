import 'server-only'

/**
 * Dados do pedido HTTP que a auditoria vai querer depois.
 *
 * O regulamento (Cap. VI) dá à ACIA o poder de descartar voto suspeito. IP e
 * user-agent existem para essa análise — não para bloquear ninguém na hora.
 * O wi-fi do próprio bar faz clientes honestos dividirem o mesmo IP, então
 * bloqueio automático por IP geraria mais reclamação do que fraude evitada.
 */

export const NOME_DO_COOKIE = 'boteco_sessao'

/**
 * Ordem de confiança das fontes de IP.
 *
 * Atrás de qualquer proxy — Traefik no Coolify, edge da Vercel — o socket é o
 * do proxy, nunca o do visitante. O IP real chega por cabeçalho e só por
 * cabeçalho.
 *
 * A ordem serve as duas hospedagens e é a mesma pelo mesmo motivo: **preferir
 * o cabeçalho que o proxy SOBRESCREVE ao que ele ACRESCENTA.**
 *
 * - `x-vercel-forwarded-for` — só existe na Vercel, escrito pela plataforma.
 *   Fora de lá é ignorado, porque não vem.
 * - `x-real-ip` — o Traefik sobrescreve com o peer real. É a fonte boa no
 *   Coolify.
 * - `x-forwarded-for` — o padrão, e a fonte que sempre funciona. Mas o proxy
 *   normalmente **acrescenta** à lista em vez de substituí-la: se o visitante
 *   mandar um `x-forwarded-for` inventado, a lista vira "forjado, real" e o
 *   primeiro item — que é o que se lê — é o forjado. Por isso fica por último.
 *
 * Consequência para o Coolify: a confiabilidade do IP depende de o Traefik
 * estar mesmo sobrescrevendo o cabeçalho, e de o container **não** ser
 * alcançável direto, sem passar pelo proxy. Se for, qualquer um escolhe o
 * próprio IP no log. Para auditoria de fraude isso importa.
 */
const FONTES_DE_IP = [
  'x-vercel-forwarded-for', // Vercel; ausente em qualquer outra hospedagem
  'x-real-ip', // Traefik/Coolify sobrescreve: confiável
  'x-forwarded-for', // sempre presente, mas o proxy acrescenta em vez de trocar
] as const

const OCTETO_VALIDO = (ip: string) =>
  ip.split('.').every((o) => o.length > 0 && o.length <= 3 && Number(o) <= 255)

/**
 * A coluna `ip` é do tipo `inet`: valor sujo derruba o insert inteiro. Na
 * dúvida devolve null — perder o dado de auditoria é melhor que perder o voto.
 */
export function normalizarIp(bruto: string | null | undefined): string | null {
  if (!bruto) return null

  let ip = bruto.trim()
  if (!ip) return null

  // "[2001:db8::1]:443" — IPv6 entre colchetes, com ou sem porta.
  const entreColchetes = /^\[(.+)\](?::\d+)?$/.exec(ip)
  if (entreColchetes) ip = entreColchetes[1]

  // IPv4 mapeado em IPv6 tem ponto E dois-pontos, então precisa vir ANTES da
  // heurística de porta abaixo — senão "::ffff:203.0.113.5" vira string vazia.
  const mapeado = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})(?::(\d+))?$/i.exec(ip)
  if (mapeado) ip = mapeado[1]
  // "203.0.113.5:52413" — só IPv4 leva porta separada por dois-pontos.
  else if (ip.includes('.') && ip.includes(':')) ip = ip.split(':')[0]

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return OCTETO_VALIDO(ip) ? ip : null
  if (/^[0-9a-fA-F:]+$/.test(ip) && ip.includes(':')) return ip
  return null
}

export function ipDoPedido(cabecalhos: Headers): string | null {
  for (const fonte of FONTES_DE_IP) {
    const valor = cabecalhos.get(fonte)
    if (!valor) continue

    // A lista é "cliente, proxy1, proxy2" — o primeiro é quem interessa.
    // Cabeçalho presente mas vazio não pode calar as fontes seguintes, que é o
    // que acontecia quando o encadeamento usava `??` em cima de string vazia.
    for (const parte of valor.split(',')) {
      const ip = normalizarIp(parte)
      if (ip) return ip
    }
  }
  return null
}

/**
 * User-agent só existe como cabeçalho — não há equivalente de socket para ele,
 * nem na Vercel nem em lugar nenhum. Já vinha do lugar certo; o corte em 400
 * evita que um agente absurdo engorde a linha sem necessidade.
 */
export function agenteDoPedido(cabecalhos: Headers): string | null {
  const bruto = cabecalhos.get('user-agent')?.trim()
  return bruto ? bruto.slice(0, 400) : null
}
