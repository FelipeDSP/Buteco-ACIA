import Image from 'next/image'
import Link from 'next/link'
import EstadoDaCasa from '@/components/painel/EstadoDaCasa'
import { Bloco, Numero, Numeros, Selo, TopoDaTela } from '@/components/painel/Peças'
import { listarCasasDoPainel } from '@/lib/painel'
import { situacaoDaCasa } from '@/lib/horarios'

export const dynamic = 'force-dynamic'

export default async function Casas() {
  const casas = await listarCasasDoPainel()
  const desclassificadas = casas.filter((c) => c.desclassificada_em !== null)
  const ativas = casas.filter((c) => c.ativa && c.desclassificada_em === null)
  const semHorario = ativas.filter((c) => situacaoDaCasa(c.horarios ?? {}).semCadastro)
  const semFoto = ativas.filter((c) => !c.foto_url)
  const semPrato = ativas.filter((c) => !c.prato_confirmado)

  return (
    <div className="wrap">
      <TopoDaTela
        titulo="Casas"
        sub="Tudo que aparece no site e o que liga a janela de votação de cada QR."
        acao={
          <Link href="/painel/casas/nova" className="btn btn-pequeno">
            Adicionar casa
          </Link>
        }
      />

      <Numeros>
        <Numero valor={`${ativas.length}/${casas.length}`} rotulo="Ativas" tom="destaque" />
        <Numero
          valor={semHorario.length}
          rotulo="Sem horário"
          tom={semHorario.length > 0 ? 'alerta' : 'neutro'}
          detalhe={semHorario.length > 0 ? 'aceitam voto a qualquer hora' : 'todas cadastradas'}
        />
        <Numero valor={semFoto.length} rotulo="Sem foto do prato" />
        <Numero
          valor={desclassificadas.length}
          rotulo="Desclassificadas"
          tom={desclassificadas.length > 0 ? 'alerta' : 'neutro'}
          detalhe={desclassificadas.length > 0 ? 'Art. 22, fora do ranking' : undefined}
        />
      </Numeros>

      {semHorario.length > 0 ? (
        <p className="mt-5 rounded-2xl bg-ambar/20 px-5 py-4 text-[14px] font-semibold text-ambar-e">
          {semHorario.length} {semHorario.length === 1 ? 'casa ativa está' : 'casas ativas estão'} sem
          horário cadastrado. Enquanto estiverem, o QR aceita voto a qualquer hora — inclusive
          de madrugada, com a casa fechada. Precisa estar resolvido antes de 19 de setembro.
        </p>
      ) : null}

      <Bloco className="mt-7">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-[14.5px]">
            <thead>
              <tr className="border-b border-risco bg-creme text-left">
                <th className="px-5 py-2.5 font-semibold">Casa</th>
                <th className="py-2.5 pr-3 font-semibold">Prato</th>
                <th className="py-2.5 pr-3 font-semibold">Bairro</th>
                <th className="py-2.5 pr-3 font-semibold">Horário</th>
                <th className="py-2.5 pr-3 text-right font-semibold">Avaliações</th>
                <th className="px-5 py-2.5 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody>
              {casas.map((casa, i) => {
                const situacao = situacaoDaCasa(casa.horarios ?? {})
                return (
                  <tr
                    key={casa.id}
                    className={`border-b border-risco last:border-0 ${i % 2 === 1 ? 'bg-creme/40' : ''} ${
                      casa.ativa && casa.desclassificada_em === null ? '' : 'opacity-60'
                    }`}
                  >
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        {casa.foto_url ? (
                          <Image
                            src={casa.foto_url}
                            alt=""
                            width={44}
                            height={44}
                            className="size-11 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span
                            title="Sem foto do prato"
                            className="grid size-11 shrink-0 place-content-center rounded-lg bg-creme text-[10px] font-bold text-tinta-3"
                          >
                            foto
                          </span>
                        )}
                        <span className="min-w-0">
                          <Link
                            href={`/painel/casas/${casa.id}`}
                            className="block font-semibold hover:underline"
                          >
                            {casa.nome}
                          </Link>
                          {casa.desclassificada_em !== null ? (
                            <span className="mt-0.5 block">
                              <Selo tom="alerta" titulo={casa.desclassificada_motivo ?? undefined}>
                                desclassificada
                              </Selo>
                            </span>
                          ) : !casa.ativa ? (
                            <span className="mt-0.5 block">
                              <Selo>inativa</Selo>
                            </span>
                          ) : null}
                          <span className="block font-mono text-[11.5px] text-tinta-3">
                            /{casa.slug}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      {casa.prato ?? <span className="text-tinta-3">—</span>}
                      {!casa.prato_confirmado ? (
                        <span className="ml-1.5">
                          <Selo tom="alerta">a confirmar</Selo>
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 text-tinta-3">
                      {casa.bairro || <Selo tom="alerta">em branco</Selo>}
                    </td>
                    <td className="py-3 pr-3">
                      {situacao.semCadastro ? (
                        <Selo tom="alerta" titulo="Sem horário, o QR aceita voto a qualquer hora">
                          sem cadastro
                        </Selo>
                      ) : (
                        <Selo>cadastrado</Selo>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right">{casa.avaliacoes}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="flex flex-wrap items-start justify-end gap-1.5">
                        <Link
                          href={`/painel/casas/${casa.id}`}
                          title="Dados, horário de funcionamento e foto do prato"
                          className="rounded-full bg-marinho px-3 py-1 text-[12.5px] font-bold text-branco hover:bg-marinho-2"
                        >
                          Editar
                        </Link>
                        <EstadoDaCasa
                          id={casa.id}
                          nome={casa.nome}
                          ativa={casa.ativa}
                          desclassificada={casa.desclassificada_em !== null}
                          desclassificadaMotivo={casa.desclassificada_motivo}
                          avaliacoes={casa.avaliacoes}
                        />
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Bloco>
    </div>
  )
}
