-- Boteco ACIA — 27/08/2026
--
-- Duas mudancas, ambas por decisao da ACIA (nao por escolha tecnica):
--
--   1. O CPF passa a ser gravado em claro, para exibicao na auditoria.
--   2. A observacao deixa de ser coluna da avaliacao e vira tabela propria,
--      SEM nenhuma coluna que a ligue a quem escreveu.
--
-- As duas andam juntas de proposito. Com CPF visivel na auditoria, manter o
-- texto na mesma linha da avaliacao ligaria comentario a CPF numa tela so.
--
-- Rode isto no SQL Editor do Supabase (projeto do Boteco) ANTES de subir o
-- deploy: o painel le a coluna `cpf` e a tabela `observacoes`.

begin;

-- 1. CPF em claro. Nulo nas avaliacoes que ja existem, e continua nulo: o
--    numero nao esta guardado em lugar nenhum para ser preenchido depois.
--    `cpf_hash` CONTINUA sendo gravado e CONTINUA sendo a base do indice
--    unico de deduplicacao — a unicidade nao passa para o CPF em claro.
alter table public.avaliacoes add column if not exists cpf text;

comment on column public.avaliacoes.cpf is
  'CPF em claro, so digitos. Decisao da ACIA em 27/08/2026 para auditoria. Nulo nas avaliacoes anteriores a essa data. A deduplicacao continua sendo por cpf_hash.';

-- 2. Observacoes fora da avaliacao.
--
--    Nao ha avaliacao_id, nao ha cpf_hash, nao ha ip. E `criada_em` e DATE,
--    nao timestamp: com hora, bastava alinhar as duas telas por horario para
--    reconstruir quem escreveu o que — e com CPF na auditoria isso ligaria
--    CPF a comentario. O desvinculo tem de ser real, nao visual.
create table if not exists public.observacoes (
  id uuid primary key default gen_random_uuid(),
  casa_id uuid not null references public.casas(id),
  texto text not null check (btrim(texto) <> '' and length(texto) <= 400),
  criada_em date not null default (now() at time zone 'America/Porto_Velho')::date
);

comment on table public.observacoes is
  'Observacoes de quem votou, desvinculadas da avaliacao. Sem avaliacao_id, sem cpf_hash e sem ip, de proposito. criada_em e DATE — hora reconstruiria o vinculo por alinhamento de horario.';

create index if not exists observacoes_casa_id_idx on public.observacoes (casa_id);

-- Sem policy nenhuma, igual a `avaliacoes`: so a service_role enxerga.
alter table public.observacoes enable row level security;

-- 3. Migra o que ja existe, com a data sem hora.
--    Texto de avaliacao anulada nao vem junto: ele ja estava fora dos CSV, e
--    depois do desvinculo nao havera mais como anular observacao.
insert into public.observacoes (casa_id, texto, criada_em)
select casa_id, btrim(comentario), (criada_em at time zone 'America/Porto_Velho')::date
from public.avaliacoes
where comentario is not null
  and btrim(comentario) <> ''
  and anulada_em is null;

-- 4. Some com a coluna. Enquanto ela existir, o vinculo existe.
alter table public.avaliacoes drop column comentario;

commit;
