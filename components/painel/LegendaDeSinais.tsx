import type { Limiares } from '@/lib/painel'

/**
 * O que cada marcador significa, escrito para quem abrir esta tela em outubro
 * sem ter participado da construção.
 *
 * O texto é longo de propósito. Um selo "IP repetido" sem explicação convida a
 * anular voto de cliente honesto — e anular voto legítimo é pior do que deixar
 * passar voto duvidoso, porque tira da casa uma nota que ela ganhou.
 *
 * "Observação repetida" saiu daqui junto com o texto das observações: o sinal
 * agora mora na aba Observações, onde os textos vivem sem vínculo com a
 * avaliação. Continua sendo por casa, e continua usando
 * `PAINEL_LIMIAR_COMENTARIO_IGUAL`.
 */

export default function LegendaDeSinais({ limites }: { limites: Limiares }) {
  const sinais = [
    {
      nome: 'IP repetido',
      regra: `${limites.ipPorCasa} ou mais avaliações do mesmo endereço na mesma casa.`,
      porque:
        'O wi-fi do próprio bar faz dezenas de clientes saírem pelo mesmo endereço, e o 4G também: as operadoras usam CGNAT e dividem um IP entre milhares de assinantes. Numa sexta cheia isto aparece sozinho, sem ninguém fraudando.',
      quandoImporta:
        'Vira suspeita quando vem junto de rajada, ou quando o volume é desproporcional ao movimento real da casa naquele dia.',
    },
    {
      nome: 'IP em várias casas',
      regra: `Mesmo endereço avaliando ${limites.ipEmCasas} ou mais casas diferentes.`,
      porque:
        'Mais específico que volume: quem está no wi-fi de um bar avalia aquele bar. Um endereço que aparece em muitas casas não esteve fisicamente em todas.',
      quandoImporta:
        'A ressalva vale: um IP de operadora móvel cobre a cidade inteira, então CGNAT também produz este sinal com gente honesta. Pesa mais quando o mesmo endereço concentra notas máximas em casas espalhadas.',
    },
    {
      nome: 'Rajada',
      regra: `${limites.rajadaMinima} ou mais avaliações na mesma casa dentro de ${limites.janelaDeRajadaMin} minutos.`,
      porque:
        'Mesa grande que pede a conta junto gera rajada legítima, e é o que o regulamento chama de volume atípico quando não gera.',
      quandoImporta:
        'O Art. 21 cita justamente volume atípico de notas máximas em curto período. Rajada com notas variadas costuma ser mesa cheia; rajada de 5·5·5·5 costuma ser outra coisa.',
    },
    {
      nome: 'Fora de horário',
      regra: 'Voto registrado com a casa fechada, segundo o horário cadastrado.',
      porque:
        'Só dispara em casa com horário preenchido. Casa sem cadastro nunca aciona, senão todo voto seria marcado e o painel viraria ruído.',
      quandoImporta:
        'É o sinal mais direto de todos, mas confira o cadastro antes: horário errado no painel produz alerta falso.',
    },
  ]

  return (
    <details className="mt-4 rounded-2xl bg-claro">
      <summary className="cursor-pointer px-5 py-3.5 font-display text-[14.5px] font-extrabold">
        O que cada marcador quer dizer — e por que nenhum é prova
      </summary>

      <div className="border-t border-risco px-5 py-4">
        <p className="mb-4 max-w-[78ch] text-[13.5px] text-tinta-3">
          Estes marcadores existem para <b className="text-tinta">dirigir o olhar</b>, não para
          decidir. O regulamento (Art. 21) dá à ACIA o poder de descartar avaliação suspeita, e a
          decisão é da comissão, olhando o conjunto — nunca do selo sozinho.{' '}
          <b className="text-tinta">
            Anular voto legítimo é pior do que deixar passar voto duvidoso
          </b>
          , porque tira da casa uma nota que ela ganhou honestamente.
        </p>

        <dl className="grid gap-3 larga:grid-cols-2">
          {sinais.map((sinal) => (
            <div key={sinal.nome} className="rounded-xl bg-creme px-4 py-3">
              <dt className="font-display text-[14px] font-extrabold">{sinal.nome}</dt>
              <dd className="mt-1 text-[13px] text-tinta-3">
                <span className="block font-semibold text-tinta">{sinal.regra}</span>
                <span className="mt-1.5 block">{sinal.porque}</span>
                <span className="mt-1.5 block">{sinal.quandoImporta}</span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 max-w-[78ch] text-[12.5px] text-tinta-3">
          Os limiares são ajustáveis sem novo deploy, por variável de ambiente:{' '}
          <code className="font-mono">PAINEL_LIMIAR_IP_POR_CASA</code>,{' '}
          <code className="font-mono">PAINEL_LIMIAR_IP_EM_CASAS</code>,{' '}
          <code className="font-mono">PAINEL_LIMIAR_RAJADA</code>,{' '}
          <code className="font-mono">PAINEL_JANELA_RAJADA_MIN</code>. Se um sinal estiver
          aparecendo em quase tudo, o limiar está baixo demais para o movimento real — suba, em
          vez de aprender a ignorar o alerta.
        </p>
      </div>
    </details>
  )
}
