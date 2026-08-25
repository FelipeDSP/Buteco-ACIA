'use client'

import { useState } from 'react'
import type { Faixa, Horarios } from '@/lib/tipos'

/**
 * Editor de horários por dia da semana.
 *
 * É a peça que liga a janela de votação. Hoje as doze casas estão com `{}`, e
 * enquanto estiverem o QR aceita voto a qualquer hora — inclusive às quatro da
 * manhã, com a casa fechada.
 *
 * Três regras que a interface precisa deixar óbvias, porque erro aqui só
 * aparece no dia do festival:
 *  - um dia pode ter mais de uma faixa (almoço e jantar);
 *  - um dia sem faixa nenhuma significa **fechado nesse dia**;
 *  - faixa que termina antes de começar atravessa a meia-noite, e isso é
 *    proposital para casa que fecha às 2h.
 */

const DIAS_DA_SEMANA = [
  { chave: 'seg', nome: 'Segunda' },
  { chave: 'ter', nome: 'Terça' },
  { chave: 'qua', nome: 'Quarta' },
  { chave: 'qui', nome: 'Quinta' },
  { chave: 'sex', nome: 'Sexta' },
  { chave: 'sab', nome: 'Sábado' },
  { chave: 'dom', nome: 'Domingo' },
] as const

const PADRAO: Faixa = ['18:00', '23:30']

export default function EditorDeHorarios({
  valor,
  aoMudar,
}: {
  valor: Horarios
  aoMudar: (novo: Horarios) => void
}) {
  const [copiarDe, setCopiarDe] = useState<string>('sex')

  const faixasDe = (dia: string): Faixa[] => valor[dia as keyof Horarios] ?? []

  const trocar = (dia: string, faixas: Faixa[]) => {
    const novo = { ...valor }
    if (faixas.length === 0) delete novo[dia as keyof Horarios]
    else novo[dia as keyof Horarios] = faixas
    aoMudar(novo)
  }

  const semCadastro = DIAS_DA_SEMANA.every((d) => faixasDe(d.chave).length === 0)

  return (
    <div className="flex flex-col gap-3">
      {semCadastro ? (
        <p className="rounded-xl bg-ambar/20 px-4 py-3 text-[13.5px] font-semibold text-ambar-e">
          Sem horário cadastrado, esta casa aceita voto a qualquer hora — inclusive
          fechada. Preencha antes do dia 19 de setembro.
        </p>
      ) : null}

      {DIAS_DA_SEMANA.map(({ chave, nome }) => {
        const faixas = faixasDe(chave)
        const fechado = faixas.length === 0

        return (
          <div
            key={chave}
            className="flex flex-wrap items-start gap-3 rounded-xl bg-claro px-4 py-3"
          >
            <span className="w-[86px] shrink-0 pt-1.5 font-display text-[15px] font-bold">
              {nome}
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {fechado ? (
                <span className="pt-1.5 text-[14px] text-tinta-3">Fechado</span>
              ) : (
                faixas.map((faixa, i) => {
                  const viraODia =
                    faixa[1] !== '' && faixa[0] !== '' && faixa[1] <= faixa[0]
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        value={faixa[0]}
                        onChange={(e) => {
                          const copia = faixas.map((f) => [...f] as Faixa)
                          copia[i][0] = e.target.value
                          trocar(chave, copia)
                        }}
                        className="rounded-lg bg-creme px-3 py-1.5 text-[14px]"
                      />
                      <span className="text-[13px] text-tinta-3">às</span>
                      <input
                        type="time"
                        value={faixa[1]}
                        onChange={(e) => {
                          const copia = faixas.map((f) => [...f] as Faixa)
                          copia[i][1] = e.target.value
                          trocar(chave, copia)
                        }}
                        className="rounded-lg bg-creme px-3 py-1.5 text-[14px]"
                      />
                      {viraODia ? (
                        <span
                          title="Fecha depois da meia-noite. É aceito de propósito."
                          className="rounded-full bg-marinho/10 px-2 py-0.5 text-[11.5px] font-bold text-marinho"
                        >
                          vira o dia
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => trocar(chave, faixas.filter((_, k) => k !== i))}
                        className="text-[12.5px] font-semibold text-tinta-3 underline underline-offset-2"
                      >
                        remover
                      </button>
                    </div>
                  )
                })
              )}

              <button
                type="button"
                onClick={() => trocar(chave, [...faixas, [...PADRAO] as Faixa])}
                className="self-start text-[12.5px] font-bold text-marinho underline underline-offset-2"
              >
                {fechado ? '+ abrir neste dia' : '+ outra faixa'}
              </button>
            </div>
          </div>
        )
      })}

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-creme px-4 py-3 text-[13.5px]">
        <span className="text-tinta-3">Copiar o horário de</span>
        <select
          value={copiarDe}
          onChange={(e) => setCopiarDe(e.target.value)}
          className="rounded-lg bg-claro px-2.5 py-1.5 font-semibold"
        >
          {DIAS_DA_SEMANA.map((d) => (
            <option key={d.chave} value={d.chave}>
              {d.nome}
            </option>
          ))}
        </select>
        <span className="text-tinta-3">para todos os outros dias</span>
        <button
          type="button"
          onClick={() => {
            const modelo = faixasDe(copiarDe)
            const novo: Horarios = {}
            for (const d of DIAS_DA_SEMANA) {
              if (modelo.length > 0) novo[d.chave] = modelo.map((f) => [...f] as Faixa)
            }
            aoMudar(novo)
          }}
          className="rounded-full bg-marinho px-3 py-1 text-[12.5px] font-bold text-branco"
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}
