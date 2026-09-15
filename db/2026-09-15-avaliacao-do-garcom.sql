-- Boteco ACIA — 15/09/2026
--
-- Avaliacao de quem atendeu: na tela de voto, a pessoa pode escrever o nome
-- do garcom ou garconete e dar uma nota de 0 a 5. E devolutiva para a casa —
-- NAO e criterio do regulamento e nao entra em media, desempate nem piso. O
-- criterio "atendimento" continua sendo o da casa, nas colunas de `avaliacoes`.
--
-- Mesma regra das observacoes: tabela propria, SEM nada que a ligue a quem
-- votou. Sem avaliacao_id, sem cpf_hash, sem ip, e `criada_em` e DATE. Com o
-- CPF em claro na auditoria, guardar isto na linha da avaliacao ligaria
-- "quem votou" a "o que disse do garcom" numa tela so — e o nome do garcom e
-- dado de terceiro, que o dono da casa vai ler.
--
-- Rode isto no SQL Editor do Supabase (projeto do Boteco) ANTES de subir o
-- deploy: a rota de voto grava aqui e o painel le daqui.

begin;

create table if not exists public.avaliacoes_garcom (
  id uuid primary key default gen_random_uuid(),
  casa_id uuid not null references public.casas(id),
  nome text not null check (btrim(nome) <> '' and length(nome) <= 60),
  nota smallint not null check (nota between 0 and 5),
  criada_em date not null default (now() at time zone 'America/Porto_Velho')::date
);

comment on table public.avaliacoes_garcom is
  'Nota que o cliente deu a quem o atendeu, com o nome que ele escreveu. Devolutiva para a casa; fora da apuracao. Desvinculada da avaliacao de proposito: sem avaliacao_id, sem cpf_hash, sem ip, e criada_em e DATE.';

create index if not exists avaliacoes_garcom_casa_id_idx on public.avaliacoes_garcom (casa_id);

-- Sem policy nenhuma, igual a `observacoes`: so a service_role enxerga.
alter table public.avaliacoes_garcom enable row level security;

commit;
