# Boteco ACIA — mapa da aplicação

Documento de referência para construção. Arquitetura multi-edição: o sistema nasce preparado para 2026, 2027 e além.

**Princípio que organiza tudo:** schema é caro de mudar depois, interface é barata. O banco nasce multi-edição desde já; o painel admin pode ser tosco no primeiro ano e você resolve no SQL.

---

## 1. As três superfícies

| Superfície | Quem usa | Auth | Volume |
|---|---|---|---|
| Site público | Cliente, imprensa, estabelecimentos | Nenhuma | Alto, picos no lançamento |
| Página de voto | Cliente na mesa | Nenhuma | Muito alto, concentrado à noite |
| Painel admin | ACIA e você | Login obrigatório | 2–5 pessoas |

As duas primeiras precisam ser rápidas e à prova de erro. A terceira pode ser feia desde que seja confiável. Não gaste tempo bonito no admin.

---

## 2. Modelo de dados

### O que persiste entre edições

```
estabelecimentos
  id, slug, nome, cnpj, categoria, bairro, endereco, lat, lng,
  telefone, instagram, foto_capa, criado_em
```

Um bar é o mesmo negócio em 2026 e 2027. Nunca amarrar `estabelecimentos` a uma edição — é isso que permite a página com histórico ("participou em 2026, 3º lugar").

Categorias: bar, restaurante, lanchonete, espetaria, choperia, hamburgueria, petiscaria, casa noturna.

### O que é específico de cada edição

```
edicoes
  id, ano, nome, inicio_inscricoes, fim_inscricoes,
  inicio_festival, fim_festival, inicio_apuracao,
  ativa, regras (jsonb)

participacoes
  id, estabelecimento_id, edicao_id,
  prato_nome, prato_descricao, prato_foto, prato_preco,
  codigo_qr (único), status, inscrito_em

criterios
  id, edicao_id, nome, descricao, nota_min, nota_max, peso, ordem

votos
  id, participacao_id, hash_cpf, origem (digital|fisica),
  comentario, criado_em, ip_hash, user_agent, suspeito

voto_notas
  voto_id, criterio_id, nota

resultados
  participacao_id, nota_final, media_por_criterio (jsonb),
  total_avaliacoes, elegivel, colocacao, apurado_em
```

### As quatro decisões que estruturam isso

**Critérios são dados, não colunas.** Se `votos` tivesse `nota_sabor`, `nota_criatividade` etc., o regulamento de 2026 estaria travado no schema. O Art. 30 permite a ACIA mudar as regras. Notas viram linhas em `voto_notas`. No volume deste evento a diferença de performance é irrelevante; uma view resolve o relatório.

**`edicoes.regras` guarda o que varia sem virar coluna.** Percentual do piso mínimo, ordem de desempate, se há júri, taxa de inscrição. A apuração lê de lá em vez de ter números escritos no código.

```json
{
  "piso_minimo_percentual": 10,
  "desempate": ["Sabor", "Criatividade", "total_avaliacoes"],
  "tem_juri": false,
  "peso_publico": 100
}
```

**Resultado é fotografia, não cálculo.** Ao encerrar a apuração, grava em `resultados` e nunca mais recalcula. Se em 2028 a fórmula mudar, o campeão de 2026 continua sendo o campeão de 2026. Os votos ficam como lastro auditável.

**`codigo_qr` vive em `participacoes`.** Cada casa recebe um por edição. Isso permite desativar um código que vazou e emitir outro sem mexer no estabelecimento.

---

## 3. CPF e privacidade

O Art. 15 exige uma avaliação por CPF por estabelecimento. O requisito real é *detectar duplicidade*, não *guardar o CPF*.

1. Validar dígitos verificadores (módulo 11) e rejeitar padrões inválidos (`11111111111` e afins)
2. Calcular HMAC-SHA256 do CPF com uma chave secreta do servidor — **HMAC com chave, não hash simples**: CPF tem poucas combinações e um SHA256 puro cai por força bruta em minutos
3. Gravar só o hash, com índice único em `(hash_cpf, participacao_id)`
4. Descartar o valor cru — nunca chega ao banco

**Chave secreta diferente por edição.** Assim ninguém consegue cruzar quem votou em 2026 com quem votou em 2027, nem você.

**Apagar os hashes depois da apuração encerrada.** A deduplicação já cumpriu sua função. Ficam os votos e as notas, sem nenhum identificador de pessoa. É a melhor postura possível de LGPD: o dado pessoal existe pelo tempo estritamente necessário e some.

Aviso de privacidade obrigatório na tela de voto. Vale a ACIA validar o texto com o jurídico deles.

---

## 4. Rotas

### Site público

```
/                            Edição corrente, conteúdo varia por fase
/casas                       Grade das casas da edição corrente
/casas/[slug]                Página da casa — estável para sempre, com histórico
/mapa                        Mapa oficial
/regulamento                 Regulamento da edição corrente
/inscricoes                  Ativa só durante o período de inscrição
/edicoes                     Índice das edições
/edicoes/[ano]               Arquivo daquele ano
/edicoes/[ano]/ganhadores    Resultado congelado
```

**Decida a estrutura de URL agora.** Link compartilhado e ranking do Google se acumulam ao longo dos anos. O que você não quer é `/casas/bar-do-ze` virando 404 em 2027 porque a casa não se inscreveu. A página sobrevive; o que ela mostra é que muda.

### Página de voto

```
/v/[codigo]            Tela de voto — destino do QR
/v/[codigo]/obrigado   Confirmação + descoberta das outras casas
```

O estabelecimento vem do código na rota, resolvido no servidor. Nunca de campo do formulário — se o usuário puder editar, ele vota no bar errado de propósito.

### Painel admin

```
/admin/entrar          Login
/admin                 Visão geral da edição ativa
/admin/edicoes         Criar e ativar edição
/admin/estabelecimentos  CRUD do cadastro permanente
/admin/participacoes   Inscrições da edição, prato, foto
/admin/qrcodes         Gerar e baixar para impressão
/admin/votos           Listagem, busca, marcar suspeito
/admin/fichas          Entrada manual das fichas físicas, com dupla conferência
/admin/auditoria       Anomalias: volume atípico de notas máximas
/admin/apuracao        Roda o cálculo e congela em resultados
```

---

## 5. Estados do site público

A home muda conforme a fase. Derivar da data, com override por variável de ambiente para permitir preview.

| Fase | CTA principal | Público |
|---|---|---|
| Antes das inscrições | Teaser, sem lista | Geral |
| Inscrições abertas | "Inscreva seu bar" | Dono de bar |
| Entre inscrição e festival | Casas confirmadas, contagem regressiva | Cliente |
| Festival ativo | "Ver os pratos" | Cliente |
| Após apuração | Ganhadores | Geral |

O número de estabelecimentos é indefinido até as inscrições fecharem. Nada de layout que assuma 14, 20 ou qualquer N.

---

## 6. Ordem de construção

A ordem óbvia é começar pela landing porque é a parte gostosa. **Não faça isso.** A landing não tem prazo fatal; a página de voto tem. Se ela estiver quebrada no primeiro dia do festival, não existe plano B.

1. **Schema no Supabase.** Tabelas, RLS, seed da edição 2026 com critérios e regras. Tudo depende disso.
2. **Página de voto.** Do QR ao "obrigado". Testar no celular, na rua, com 4G ruim, à noite.
3. **Geração e impressão dos QRs.** Precisa estar pronto semanas antes — alguém tem que imprimir e distribuir.
4. **Admin mínimo.** Listar votos e ver ranking parcial. CRUD vem depois.
5. **Entrada de fichas físicas.** Obrigatório pelo regulamento (Art. 12 e 21.3).
6. **Landing.** Agora sim.
7. **Páginas das casas.** É o que os estabelecimentos mais cobram.
8. **Mapa.**
9. **Apuração e página de ganhadores.** Dá para fazer na última semana do festival.

---

## 7. O que NÃO construir agora

Resista ao admin genérico: tela de cadastro de critérios, editor visual de regras de apuração, clonador de edição. São semanas de trabalho para resolver um problema que só aparece na preparação de 2027.

No primeiro ano, os critérios entram por `INSERT` e a apuração é um script. Quando 2027 chegar, você já vai saber exatamente o que precisa ser configurável — e constrói a coisa certa em vez de adivinhar.

Schema flexível, interface burra.

---

## 8. Antifraude

O dono do bar tem incentivo direto para inflar a própria nota. Vai acontecer.

O regulamento (Cap. VI) já define a linha: validação por CPF, descarte de CPF inválido ou duplicado, dupla conferência nas fichas físicas, e auditoria discricionária da ACIA sobre volume atípico.

Implementação recomendada:

- Índice único no banco resolve o duplicado sem código
- Registrar `ip_hash` e `user_agent` para a auditoria, sabendo que o wi-fi do próprio bar faz clientes legítimos compartilharem IP
- **Marcar como suspeito, não bloquear automaticamente.** Bloqueio agressivo gera reclamação de cliente honesto, e isso é pior do que alguns votos sujos. O Art. 21.4 dá à ACIA o poder de descartar — deixe a decisão com eles, com a evidência na tela.

---

## 9. Riscos práticos

- **Foto ruim mata a landing.** Se cada casa mandar foto de celular com luz amarela, o site inteiro cai de qualidade e não tem CSS que salve. Vale a ACIA bancar um fotógrafo por meio dia — é o melhor dinheiro do projeto.
- **O garçom é o ponto único de falha.** Se ele não apontar o QR, não tem voto. Material físico na mesa, não só na conta.
- **Teste o QR impresso, não na tela.** Tamanho, contraste e papel fosco versus brilhante mudam a leitura.
- **CPF é fricção pesada.** Notas primeiro, CPF por último, com o motivo escrito, teclado numérico e máscara. Se vier antes das notas, a taxa de resposta despenca.
- **Combine quem responde no dia.** Vai ter mensagem no domingo à noite dizendo que o QR de uma casa não lê.

---

## 10. Pendências com a ACIA

1. O regulamento está fechado ou ainda vai a assembleia? Critérios, pesos e datas estão travados no schema.
2. Vetorial do brasão Boteco ACIA, do selo da ACIA e das marcas dos apoiadores (CDL, Rosalin Mesas, Motopam).
3. Lista definitiva dos estabelecimentos, com data de entrega combinada.
4. Quem produz foto e texto de cada casa — você, a ACIA ou o próprio estabelecimento?
5. Texto do aviso de privacidade, validado pelo jurídico.
6. Em que fase do calendário vocês realmente estão hoje.
