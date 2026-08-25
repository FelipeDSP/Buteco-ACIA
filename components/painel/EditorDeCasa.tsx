'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import EditorDeHorarios from '@/components/painel/EditorDeHorarios'
import type { CasaDoPainel } from '@/lib/painel'
import type { Horarios } from '@/lib/tipos'

/** Mesma regra do servidor, para a prévia bater com o que será gravado. */
const previaDoSlug = (nome: string) =>
  nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

/**
 * Formulário de uma casa. Nada é escrito daqui direto no banco: tudo passa por
 * `/api/painel/casa`, que valida e usa a `service_role` no servidor.
 */

const CATEGORIAS = [
  'Bar', 'Bistrô', 'Restaurante', 'Lanchonete', 'Espetaria',
  'Choperia', 'Hamburgueria', 'Petiscaria', 'Casa noturna',
]

type Campos = Record<string, string | boolean | null>

function Campo({
  rotulo,
  nome,
  valor,
  aoMudar,
  ajuda,
  tipo = 'text',
}: {
  rotulo: string
  nome: string
  valor: string
  aoMudar: (v: string) => void
  ajuda?: string
  tipo?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13.5px] font-bold">{rotulo}</span>
      <input
        name={nome}
        type={tipo}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="rounded-xl bg-claro px-3.5 py-2.5 text-[15px]"
      />
      {ajuda ? <span className="text-[12.5px] text-tinta-3">{ajuda}</span> : null}
    </label>
  )
}

export default function EditorDeCasa({ casa }: { casa?: CasaDoPainel }) {
  const router = useRouter()
  const criando = !casa
  const arquivoRef = useRef<HTMLInputElement>(null)

  const [campos, setCampos] = useState<Campos>({
    nome: casa?.nome ?? '',
    prato: casa?.prato ?? '',
    preco: casa?.preco ?? '',
    descricao: casa?.descricao ?? '',
    categoria: casa?.categoria ?? 'Bar',
    bairro: casa?.bairro ?? '',
    endereco: casa?.endereco ?? '',
    instagram: casa?.instagram ?? '',
    telefone: casa?.telefone ?? '',
    lat: casa?.lat != null ? String(casa.lat) : '',
    lng: casa?.lng != null ? String(casa.lng) : '',
    prato_confirmado: casa?.prato_confirmado ?? true,
    ativa: casa?.ativa ?? false,
  })
  const [horarios, setHorarios] = useState<Horarios>(casa?.horarios ?? {})
  const [fotoUrl, setFotoUrl] = useState<string | null>(casa?.foto_url ?? null)

  const [salvando, setSalvando] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const trocar = (nome: string, valor: string | boolean | null) =>
    setCampos((atuais) => ({ ...atuais, [nome]: valor }))

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setSalvando(true)
    setErro(null)
    setAviso(null)

    const resposta = await fetch('/api/painel/casa', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: casa?.id, ...campos, foto_url: fotoUrl, horarios }),
    })
    const dados = await resposta.json().catch(() => ({}))
    setSalvando(false)

    if (!resposta.ok) {
      setErro(dados?.erro ?? 'Não deu para salvar.')
      return
    }

    if (criando) {
      router.replace(`/painel/casas/${dados.id}`)
      router.refresh()
      return
    }
    setAviso('Salvo.')
    router.refresh()
  }

  async function enviarFoto(arquivo: File) {
    setEnviandoFoto(true)
    setErro(null)

    const dados = new FormData()
    dados.set('arquivo', arquivo)
    dados.set('slug', casa?.slug ?? 'nova')

    const resposta = await fetch('/api/painel/foto', { method: 'POST', body: dados })
    const corpo = await resposta.json().catch(() => ({}))
    setEnviandoFoto(false)

    if (!resposta.ok) {
      setErro(corpo?.erro ?? 'Não deu para enviar a foto.')
      return
    }
    setFotoUrl(corpo.url)
    setAviso('Foto enviada. Salve para gravar na casa.')
  }

  return (
    <form method="post" onSubmit={salvar} className="flex flex-col gap-7">
      {criando ? (
        <p className="rounded-xl bg-ambar/20 px-4 py-3 text-[14px] font-semibold text-ambar-e">
          O endereço da casa (o <i>slug</i>) é gerado a partir do nome e{' '}
          <b>vai impresso dentro do QR code</b>. Depois que os QR forem impressos
          ele não pode mais mudar — confira antes de criar.
          <span className="mt-2 block font-normal text-tinta-3">
            Vai ficar:{' '}
            <code className="font-mono font-bold text-tinta">
              /votar/{previaDoSlug(String(campos.nome)) || '…'}
            </code>
          </span>
        </p>
      ) : (
        <p className="rounded-xl bg-creme px-4 py-3 text-[13.5px] text-tinta-3">
          Endereço fixo: <code className="font-mono">/votar/{casa.slug}</code> — está
          dentro do QR impresso e não é editável.
        </p>
      )}

      <div className="grid gap-4 duas:grid-cols-2">
        <Campo rotulo="Nome" nome="nome" valor={String(campos.nome)} aoMudar={(v) => trocar('nome', v)} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[13.5px] font-bold">Categoria</span>
          <select
            value={String(campos.categoria)}
            onChange={(e) => trocar('categoria', e.target.value)}
            className="rounded-xl bg-claro px-3.5 py-2.5 text-[15px]"
          >
            {CATEGORIAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <Campo rotulo="Prato" nome="prato" valor={String(campos.prato)} aoMudar={(v) => trocar('prato', v)} />
        <Campo
          rotulo="Preço"
          nome="preco"
          valor={String(campos.preco)}
          aoMudar={(v) => trocar('preco', v)}
          ajuda="Texto livre, como a casa declarou."
        />

        <Campo rotulo="Bairro" nome="bairro" valor={String(campos.bairro)} aoMudar={(v) => trocar('bairro', v)} />
        <Campo rotulo="Endereço" nome="endereco" valor={String(campos.endereco)} aoMudar={(v) => trocar('endereco', v)} />

        <Campo
          rotulo="Instagram"
          nome="instagram"
          valor={String(campos.instagram)}
          aoMudar={(v) => trocar('instagram', v)}
          ajuda="Sem o @."
        />
        <Campo rotulo="Telefone" nome="telefone" valor={String(campos.telefone)} aoMudar={(v) => trocar('telefone', v)} />

        <Campo
          rotulo="Latitude"
          nome="lat"
          valor={String(campos.lat)}
          aoMudar={(v) => trocar('lat', v)}
          ajuda="Sai vazia do mapa. Ex: -9.9138212"
        />
        <Campo
          rotulo="Longitude"
          nome="lng"
          valor={String(campos.lng)}
          aoMudar={(v) => trocar('lng', v)}
          ajuda="Sem coordenada, a casa some do mapa da home."
        />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13.5px] font-bold">Descrição do prato</span>
        <textarea
          rows={3}
          value={String(campos.descricao)}
          onChange={(e) => trocar('descricao', e.target.value)}
          className="rounded-xl bg-claro px-3.5 py-2.5 text-[15px]"
        />
      </label>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2.5 text-[14px]">
          <input
            type="checkbox"
            checked={Boolean(campos.prato_confirmado)}
            onChange={(e) => trocar('prato_confirmado', e.target.checked)}
            className="size-5 accent-[var(--color-marinho)]"
          />
          <span>
            Prato confirmado
            <span className="block text-[12.5px] text-tinta-3">
              Desmarcado, o site mostra &quot;Prato a confirmar&quot; no lugar do nome.
            </span>
          </span>
        </label>

        <label className="flex items-center gap-2.5 text-[14px]">
          <input
            type="checkbox"
            checked={Boolean(campos.ativa)}
            onChange={(e) => trocar('ativa', e.target.checked)}
            className="size-5 accent-[var(--color-marinho)]"
          />
          <span>
            Ativa
            <span className="block text-[12.5px] text-tinta-3">
              Desmarcada, some do site e o QR para de aceitar voto.
            </span>
          </span>
        </label>
      </div>

      <div>
        <h2 className="mb-2 font-display text-[17px] font-extrabold">Foto do prato</h2>
        <div className="flex flex-wrap items-center gap-4">
          {fotoUrl ? (
            <Image
              src={fotoUrl}
              alt="Foto atual do prato"
              width={132}
              height={99}
              className="rounded-xl object-cover"
            />
          ) : (
            <span className="grid h-[99px] w-[132px] place-content-center rounded-xl bg-creme text-center text-[12.5px] text-tinta-3">
              sem foto
            </span>
          )}
          <div className="flex flex-col gap-1.5">
            <input
              ref={arquivoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const arquivo = e.target.files?.[0]
                if (arquivo) enviarFoto(arquivo)
              }}
              className="text-[13.5px]"
            />
            <span className="text-[12.5px] text-tinta-3">
              JPG, PNG ou WebP, até 5 MB. {enviandoFoto ? 'Enviando…' : ''}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-1 font-display text-[17px] font-extrabold">Horário de funcionamento</h2>
        <p className="mb-3 text-[13px] text-tinta-3">
          Define quando o QR aceita voto. Dia sem faixa = fechado nesse dia.
        </p>
        <EditorDeHorarios valor={horarios} aoMudar={setHorarios} />
      </div>

      {erro ? (
        <p aria-live="assertive" className="rounded-xl bg-ambar/20 px-4 py-3 text-[14px] font-semibold text-ambar-e">
          {erro}
        </p>
      ) : null}
      {aviso ? (
        <p aria-live="polite" className="text-[14px] font-semibold text-tinta-3">
          {aviso}
        </p>
      ) : null}

      <button type="submit" disabled={salvando} className="btn self-start disabled:opacity-60">
        {salvando ? 'Salvando…' : criando ? 'Criar casa' : 'Salvar alterações'}
      </button>
    </form>
  )
}
