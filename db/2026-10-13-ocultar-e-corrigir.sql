-- Moderação de observações e de nomes de atendimento.
--
-- Decisão da ACIA em 13/10/2026, véspera da divulgação, ao revisar os
-- relatórios que vão para os estabelecimentos. Dois casos reais apareceram no
-- Restaurante Caravellas:
--
--   - "Muito gay mas gente boa" — observação que a casa não deve receber.
--   - "Junior rosca doce" — apelido de zoação que entrou no relatório como se
--     fosse um segundo funcionário, ao lado do Junior de verdade.
--
-- Mais duas observações e uma avaliação de atendimento deixadas por testes.
--
-- **Ocultar não apaga**, pela mesma razão que anular avaliação não apaga: a
-- decisão pode ser questionada, e a linha é o lastro dela. O motivo é
-- obrigatório pela mesma razão — "achei estranho" não se sustenta numa
-- reunião, e aqui se trata de suprimir o que um cliente escreveu.
--
-- `nome_corrigido` resolve o outro caso, que ocultar não resolveria: as duas
-- notas de "Junior rosca doce" eram do Junior, com apelido. Ocultá-las tiraria
-- do Junior duas avaliações que ele recebeu. Corrigir mantém a nota e troca só
-- o rótulo.

alter table observacoes
  add column if not exists oculta_em    timestamptz,
  add column if not exists oculta_motivo text;

alter table avaliacoes_garcom
  add column if not exists oculta_em      timestamptz,
  add column if not exists oculta_motivo  text,
  add column if not exists nome_corrigido text;

-- Motivo obrigatório quando oculta, e proibido quando não oculta: sem isto
-- sobra motivo órfão de uma ocultação desfeita, dizendo que a linha está
-- escondida quando ela não está.
alter table observacoes
  drop constraint if exists observacao_oculta_tem_motivo;
alter table observacoes
  add constraint observacao_oculta_tem_motivo check (
    (oculta_em is null and oculta_motivo is null)
    or (oculta_em is not null and length(btrim(oculta_motivo)) >= 3)
  );

alter table avaliacoes_garcom
  drop constraint if exists garcom_oculto_tem_motivo;
alter table avaliacoes_garcom
  add constraint garcom_oculto_tem_motivo check (
    (oculta_em is null and oculta_motivo is null)
    or (oculta_em is not null and length(btrim(oculta_motivo)) >= 3)
  );

-- O nome corrigido obedece ao mesmo limite do digitado pelo cliente.
alter table avaliacoes_garcom
  drop constraint if exists garcom_nome_corrigido_tamanho;
alter table avaliacoes_garcom
  add constraint garcom_nome_corrigido_tamanho check (
    nome_corrigido is null
    or (length(btrim(nome_corrigido)) between 2 and 60)
  );

-- As duas tabelas continuam sem policy: só `service_role` lê e escreve.
-- Nada aqui muda isso.
