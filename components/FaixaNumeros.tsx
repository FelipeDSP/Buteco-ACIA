import FaixaDeNumeros from '@/components/FaixaDeNumeros'
import { contarCasas, diasDeFestival, listarBairros, premiacaoEmDinheiro } from '@/lib/dados'
import { reais } from '@/lib/formato'

/**
 * Faixa de números logo abaixo do hero: a escala do festival em dois segundos.
 * Nenhum valor é escrito à mão — todos saem de `data/edicao.ts` e da lista
 * de casas, para nunca desmentirem o resto do site.
 */
export default async function FaixaNumeros() {
  const casas = await contarCasas()
  const bairros = (await listarBairros()).length

  const numeros = [
    {
      valor: casas > 0 ? String(casas) : '—',
      rotulo: casas === 1 ? 'Casa na disputa' : 'Casas na disputa',
    },
    { valor: String(diasDeFestival()), rotulo: 'Dias de festival' },
    {
      valor: String(bairros),
      rotulo: bairros === 1 ? 'Bairro atendido' : 'Bairros atendidos',
    },
    { valor: reais(premiacaoEmDinheiro()), rotulo: 'Em premiação' },
  ]

  return (
    <section className="bg-acia text-branco">
      <FaixaDeNumeros
        numeros={numeros}
        colunas="grid-cols-2 media:grid-cols-4"
        className="wrap"
      />
    </section>
  )
}
