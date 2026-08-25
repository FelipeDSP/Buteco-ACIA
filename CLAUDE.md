# Boteco ACIA — site oficial

Festival gastronômico competitivo em Ariquemes/RO, 1ª edição, 2026. Realização: ACIA — Associação Comercial e Industrial de Ariquemes. Doze patrocinadores com marca no ar, mais CDL Ariquemes e Motopam, que apoiam mas ainda não enviaram a arte.

As casas servem um prato em seus próprios espaços; o público avalia via QR Code. **Só voto popular — não há júri.** As inscrições estão encerradas.

**Escopo atual: apenas o site público.** Não construir painel admin nem tela de voto ainda.

---

## O princípio que organiza tudo

**Quem entra no site quer escolher onde comer hoje.**

Quase todo visitante chega por uma de duas portas: viu no Instagram, ou acabou de votar pelo QR e quer saber para onde ir depois. Nos dois casos a intenção é a mesma — escolher um lugar, perto de onde está, para ir agora.

O site não existe para explicar o festival. Existe para ajudar a escolher uma casa. Toda decisão de hierarquia se resolve por aí: se uma seção não serve a essa intenção, ela desce ou sai.

---

## Fatos do regulamento

Não inventar, não arredondar, não "melhorar".

- Festival ativo: **19 de setembro a 10 de outubro de 2026**
- Kits distribuídos: 01 a 18 de setembro · Apuração: 11 a 13 de outubro · Premiação: 2ª quinzena de outubro
- **4 critérios, peso igual, nota 0 a 5 cada, total 20 pontos**: apresentação visual, sabor, criatividade, atendimento
- Nota final = média aritmética simples de todas as avaliações válidas. Nenhum voto é descartado nem tem peso reduzido
- Uma avaliação por pessoa em cada casa; pode avaliar quantas casas quiser
- Desempate: maior média em sabor → criatividade → número de avaliações
- Piso mínimo de elegibilidade: 10% da média de avaliações do festival
- Premiação: 1º R$ 1.000 + mesa (Rosalin Mesas) + lixeira (Motopam) + placa + certificado · 2º R$ 750 · 3º R$ 500 · todas recebem placa e certificado
- **Número de casas indefinido no código.** Qualquer layout funciona com qualquer N
- Hashtag: `#BotecoACIA`

---

## Arquitetura das páginas

### Home — a lista é o conteúdo

Ordem das seções, de cima para baixo:

1. **Hero** — marinho, título, dois botões, e um leque de três cartões de prato sobrepostos e inclinados, **em rotação por todas as casas**
2. **Faixa de números** — casas, dias, bairros atendidos, premiação. Escala em dois segundos
3. **Mapa das casas** — "Onde ficam as casas", com marcador por casa e popup que leva à página dela
4. **A lista** — busca por casa ou prato, pílulas de bairro, contagem, grade de cartões
5. **Monte seu rolê** — três passos numerados
6. **Como se vota** — só a mecânica em uma frase, com link para a página completa
7. **Apoiadores**

### Internas — capa padronizada

Todas usam a mesma capa: faixa marinho, migalha de navegação, selo âmbar, título grande, subtítulo. É o que dá coesão entre as páginas.

```
/                       Home — hero, bairros, lista completa, rolê, voto resumido
/casas/[slug]           Página da casa — URL estável entre edições
/como-se-vota           Índice, passos, critérios, apuração, premiação, calendário
/acia                   Manifesto, objetivos, apoiadores por nível, números
/vencedores             Só entra no menu a partir de 14/10
```

Menu: `Início · As casas · Monte seu rolê · Como se vota · A ACIA`

**Não criar:** página "Sobre" separada, regulamento jurídico como aba (é PDF no rodapé), nem qualquer fluxo de inscrição.

### Cartão de casa

Foto, etiquetas de tipo e bairro em pílula, nome do prato em display, nome da casa, e dois botões — "Ver a casa" e "Como chegar". **Todos os cartões da grade terminam alinhados**, mesmo com quantidade diferente de etiquetas.

**Sem numeração.** O cartão não carrega número de casa, em nenhuma forma. Numeração sequencial é lida como classificação, e o resultado é fechado até a premiação — mostrar "01, 02, 03" antes da apuração sugere um ranking que não existe. Não recolocar.

---

## Paleta — fechada

Derivada da logo oficial do evento.

```
--marinho    #072658   AÇÃO e âncora
--marinho-2  #04182F   rodapé, contornos
--acia       #0065A4   faixa de números, blocos
--selo       #8CCAEE   texto secundário sobre marinho
--ambar      #E8A020   DESTAQUE
--ambar-e    #B87708   texto âmbar sobre claro
--ouro       #D7BF75   ornamento, só sobre marinho
--branco     #F5EFE3   fundo da página
--claro      #FBF7EE   cartões e blocos elevados
--creme      #EDE4D2   seções alternadas
--tinta      #1C1917   texto
--tinta-3    #6B6259   texto secundário
--risco      #E1D6C0   divisórias
```

**Regras:**
- **Marinho é onde se clica** — botões escuros, aba ativa, capas, rodapé
- **Âmbar é destaque, nunca ação** — selos, rótulos, botão primário sobre fundo escuro
- **Ouro só sobre marinho.** Nunca como texto sobre fundo claro
- Fundo da página é creme, **nunca branco puro**

**Cores proibidas, por decisão da ACIA:**
- **Vermelho** — leitura político-partidária
- **Verde com amarelo** — mesma razão
- **Preto como cor dominante** — só em texto, e mesmo assim `--tinta`

---

## Tipografia

| Papel | Fonte | Uso |
|---|---|---|
| Display | **Montserrat** 700/800 | Títulos, números, nome de prato |
| Corpo | **Archivo** 400/500/600 | Texto corrido, rótulos, botões |

Montserrat é a família da própria logo. É larga — usar tracking negativo (`-.022em`) em títulos. Sem terceira fonte. Nunca Inter, Roboto ou fontes de sistema.

---

## Repertório visual

Elementos derivados do brasão do evento, em SVG, vazando pelas bordas das seções:

1. **Espiga de cevada** — está no próprio brasão
2. **Tampinha de garrafa** — círculo âmbar, borda serrilhada em marinho
3. **Rodela de limão**

**Estrelas são proibidas** em qualquer forma ou número de pontas — decisão da ACIA por risco de leitura política.

**A tampinha é elemento de marca, não rótulo de casa.** Ela vive nas decorações que vazam pelas bordas das seções (`TampinhaDeco`), nunca sobre a foto de um cartão carregando número. Ver "Cartão de casa".

Decorações somem abaixo de 980px.

---

## Stack

Next.js (App Router) + TypeScript, Tailwind v4 com tokens via `@theme`, deploy Vercel, fontes por `next/font/google` sem `<link>` externo. **Supabase em uso** desde a entrada da votação. Sem ORM, sem auth, sem state manager.

As casas vivem na tabela `casas` do Supabase, acessadas sempre por `lib/dados.ts`. Nenhuma página fala com o banco direto. `data/restaurantes.ts` não existe mais.

As funções de leitura são assíncronas — não tem como não serem. As puras (`nomeDoPrato`, `linkComoChegar`, `enderecoCompleto`) e o tipo `Casa` moram em `lib/tipos.ts`, separadas de propósito: os componentes de cliente precisam delas, e importar de `lib/dados` arrastaria o cliente do Supabase para o bundle do navegador.

### Duas chaves, dois papéis

`lib/supabase.ts` — chave anônima, leitura pública. É pública por natureza: vai no HTML. Quem protege é o RLS. A única policy de `casas` libera `SELECT` onde `ativa = true`; `sessoes` e `avaliacoes` não têm policy nenhuma, então essa chave não enxerga uma linha delas.

`lib/supabase-admin.ts` — `service_role`, **ignora RLS por completo**. Só em route handler. O arquivo abre com `import 'server-only'`: se algum componente de cliente importá-lo, o build quebra na hora em vez de embarcar a chave no bundle. A variável também não tem prefixo `NEXT_PUBLIC_`, que é a segunda tranca.

Não criar nem alterar tabela sem pedido explícito. O schema é do usuário.

Busca e filtro por **parâmetro de URL**, funcionando sem JS, compartilhável, parâmetro inválido caindo para "todos".

---

## Deploy — Coolify, não Vercel

Docker atrás de Traefik. `output: 'standalone'` no `next.config.ts`, `Dockerfile` multi-stage, processo como usuário `nextjs` sem privilégio.

### Segredo nenhum entra na imagem

`CPF_PEPPER` e `SUPABASE_SERVICE_ROLE_KEY` **não aparecem como `ARG` no Dockerfile**, e isso é regra, não estilo: build arg fica gravado no histórico da imagem e sai em `docker history` para quem tiver a imagem na mão. Os dois chegam por variável de ambiente em runtime, do painel do Coolify. O `.dockerignore` barra `.env` e `.env.*` para nenhum arquivo de segredo ser copiado por engano.

Os dois `NEXT_PUBLIC_*` **precisam** ser build arg — o Next grava o valor dentro do JavaScript que vai para o navegador, no momento do build. E podem ser: são públicos por natureza, e quem protege os dados é o RLS.

### Confiabilidade do IP fora da Vercel

`x-vercel-forwarded-for` não existe no Coolify; a lista cai para `x-real-ip` e depois `x-forwarded-for`, e o log continua correto — conferido com o build standalone rodando.

Mas a garantia muda de dono. Na Vercel o IP vem da plataforma e não se falsifica. **No Coolify, o IP só é confiável se o Traefik sobrescrever o cabeçalho e se o container não for alcançável direto, sem passar pelo proxy.** Se der para bater na porta do container por fora, qualquer um escolhe o próprio IP no log de auditoria — e é justamente o dono do bar quem tem incentivo para isso.

### Cookie `Secure` exige HTTPS de verdade

O cookie de sessão sai com `Secure` quando `NODE_ENV=production`. Isso significa que **o domínio no Coolify precisa servir HTTPS**: em HTTP puro o navegador descarta o cookie e a votação para de funcionar, sem erro visível — a pessoa preenche, envia, e recebe "sessão não encontrada". Traefik com certificado resolve; só não pode publicar em HTTP.

### O build lê o banco

`generateStaticParams` das páginas de casa consulta o Supabase. Ele cai para lista vazia se o banco não responder, para indisponibilidade momentânea não derrubar o deploy — as páginas passam a ser geradas sob demanda.

---

## Testes

`npm test` (Vitest). Duas camadas, com regras diferentes.

**Unidade** — funções puras, sem rede e sem banco. Rodam sempre, em qualquer situação.

**Integração** — falam com o servidor de desenvolvimento e com o Supabase de verdade. **Não existe banco de teste: é o mesmo banco que atende o site.**

### Testar no celular exige `allowedDevOrigins`

O Next 16 bloqueia `/_next/*` quando a origem não é localhost. Abrir o site pelo IP da rede — que é o caso de todo teste com celular — cai nisso, e a falha é traiçoeira: o HTML chega (é renderizado no servidor), os chunks de JavaScript são recusados, **o React não hidrata e a tela fica inerte**. Nenhum erro no navegador; o aviso sai só no terminal do dev.

`next.config.ts` já lista o IP da máquina. Rede diferente: `BOTECO_DEV_ORIGINS=192.168.0.50 npm run dev`.

Sintoma para reconhecer: o menu não abre, o carrossel do hero não gira, e o formulário de voto faz submit nativo em vez de chamar a API.

### Formulário de dado sensível é sempre `method="post"`

Formulário sem `method` faz submit nativo em **GET**, e os campos viram query string. Foi o que aconteceu no celular: sem React para interceptar, tocar em "Enviar" recarregou a página com `?cpf=52998224725` na URL — e o CPF foi parar na barra de endereço, no histórico do aparelho, no log de acesso do servidor e no cabeçalho `Referer`. Todo o cuidado do HMAC não vale nada se o número vaza antes de chegar no servidor.

Duas travas, as duas obrigatórias em qualquer formulário que toque em CPF:

1. **`method="post"`** — se o submit nativo acontecer, os campos vão no corpo, não na URL.
2. **Botão travado até o React assumir** (`useEffect` que liga um estado `pronto`). Se os scripts não carregarem, a pessoa vê um aviso em vez de um envio que parece dar certo e não grava nada. Falha visível é melhor que falha silenciosa — ainda mais nessa tela.

Mais um motivo para não confiar em teste por `curl`: ele fala direto com a API e pula o formulário inteiro. O bug do celular passou por toda a bateria de testes de API sem ser notado.

### Redirect nunca deriva de `request.url`

`NextResponse.redirect()` exige URL absoluta, e a forma que todo mundo escreve — `new URL(caminho, request.url)` — monta essa URL a partir do **endereço em que o servidor escuta**, não do `Host` que o visitante pediu.

Com `next dev -H 0.0.0.0`, o celular na rede local escaneia o QR de `192.168.1.26:3311`, conecta, e recebe um `Location` apontando para `0.0.0.0:3311` — endereço que não existe fora da máquina. Dá `ERR_CONNECTION_REFUSED` com o QR na mesa e o cliente esperando. O bug é invisível no desktop, onde bind e host coincidem.

**Use caminho relativo.** É válido pela RFC 7231 §7.1.2 e o navegador resolve contra o host que ele mesmo pediu:

```ts
new NextResponse(null, { status: 307, headers: { location: '/votar/x/avaliar' } })
```

Funciona igual em rede local, em preview e no domínio final, sem configuração. `redirect()` e `permanentRedirect()` de `next/navigation` já emitem `Location` relativo — o cuidado é só com `NextResponse.redirect`.

Se precisar mesmo de URL absoluta — a geração dos QR codes vai precisar —, derive de `Host` ou `x-forwarded-host`. Nunca de `request.url`.

### A trava do banco

Todo teste que escreve chama `exigirBancoSemVotosReais` no `beforeAll` (`tests/guarda.ts`). Se `avaliacoes` tiver **qualquer linha que não seja do próprio teste**, a suíte aborta antes de tocar em nada.

O motivo tem data: hoje a tabela está vazia e escrever nela é inofensivo. A partir do primeiro voto real do festival, um `npm test` distraído passaria a inserir voto de mentira no meio da apuração — e ninguém perceberia, porque o teste passa. A trava falha ruidosamente em vez de pular em silêncio: durante o festival você quer ser interrompido, não informado.

A limpeza dos testes já é escopada ao próprio `cpf_hash`, então nunca apagaria voto real. A trava é a segunda tranca — impede até de começar.

Teste novo que escreva no banco **tem que** chamar a trava. Sem isso ele é uma bomba com data marcada.

### Sabotar o código para conferir o teste

Teste que passa pode estar passando por engano, e aí é pior que teste nenhum: dá confiança sem dar garantia. Antes de considerar um teste pronto, **quebre de propósito o código que ele cobre e confirme que ele falha** — e falha pelo motivo certo, com o valor errado aparecendo na mensagem.

Foi assim que o teste do IP se provou: invertendo a ordem da lista do `x-forwarded-for`, o banco passou a gravar o IP do proxy e o teste acusou nas três asserções. Sem esse passo, um teste que sempre passa e um teste que nunca testa nada são indistinguíveis.

Vale também para a trava: ela só conta como verificada depois de você inserir uma linha no banco, ver a suíte abortar, e conferir que **a linha continua lá** — teste que apaga dado alheio é pior que teste que não roda.

---

## Qualidade mínima

Responsivo até 360px. Foco de teclado visível. Contraste AA. HTML semântico, `alt` em toda imagem. `next/image` nas fotos. `prefers-reduced-motion` respeitado. Rodar `npm run build` e `npm test` antes de dar qualquer tarefa por concluída.

---

## Conteúdo pendente

- As doze casas na tabela `casas` são reais, vindas da Ficha de Inscrição. Três pendências: Cia Petiscaria sem bairro, Garapeira e Caravellas sem prato confirmado. A interface tolera as três — não "consertar" preenchendo por conta própria
- `horarios` está `{}` em todas. Enquanto estiver vazio, a casa conta como **sempre aberta** — travar a votação por falta de cadastro seria pior que aceitar voto fora de hora, já que o QR está na mesa da própria casa
- A ficha não coleta horário de funcionamento. Falta para o site, e será necessário para a janela de aceitação de voto
- Fotos dos pratos — o item que mais falta. Todo espaço de foto é placeholder marcado
- `public/logo/Logo_Boteco_Acia.png` é o brasão oficial. Nunca redesenhar, recolorir ou distorcer. Falta a versão horizontal e o vetorial
- **Logos de CDL Ariquemes e Motopam.** As duas apoiam o festival mas não têm arquivo, e por isso **não aparecem em lugar nenhum do site** — nem na grade, nem no rodapé. Já foram cartão de texto com o nome; no meio de doze marcas desenhadas os dois retângulos pareciam imagem que não carregou, e saíram. Assim que a arte chegar, basta soltar o PNG em `public/patrocinadores/` e acrescentar o verbete de grafia em `NOMES` (`lib/apoiadores.ts`), senão o nome sai derivado do arquivo — `cdl-ariquemes.png` viraria "Cdl Ariquemes"
- Telefone das casas (a ficha não coleta). Endereço, Instagram e coordenadas já estão no arquivo

---

## Decisões já tomadas — não reabrir sem motivo novo

Cada uma custou uma rodada de trabalho. O motivo importa mais que a regra: se o motivo mudar, a regra pode mudar junto.

**Cartão de casa não tem número.** Numeração sequencial lê como classificação, e o resultado é fechado até a premiação. A tampinha continua no site, mas só como elemento de marca.

**A home não ensina a contar nota.** Peso dos critérios, média das avaliações válidas, total de pontos e ausência de júri vivem só em `/como-se-vota`. Na home fica a mecânica e nada mais: provar, apontar o celular para o QR da mesa, dar a nota — mais o link para a página completa. Isso é conteúdo de regulamento, e regulamento não é o que traz alguém à home.

**O hero passa por todas as casas.** Três cartões visíveis por vez, avançando de um em um para toda casa passar pela posição de destaque no centro. Três casas fixas gerava reclamação de quem nunca aparecia. Não voltar a fixar.

**O resultado é fechado até a premiação.** Nota, média, parcial e posição não aparecem em lugar nenhum do site público — nem na tela de voto, nem na confirmação, nem na página da casa. Mostrar parcial durante o festival vira campanha: casa atrás corre atrás de voto, casa na frente vira alvo. A apuração é de 11 a 13 de outubro e o resultado sai depois disso.

**O CPF nunca é gravado.** Ver "Votação".

**Os blocos de bairro saíram da home; no lugar entrou o mapa.** Eram doze casas espalhadas por seis bairros, quase um bairro por casa — clicar num bloco filtrava de doze para uma ou duas, o que não é filtrar, é dar um passo a mais para chegar na mesma lista. O mapa responde a pergunta que o bairro só aproximava: *onde isso fica em relação a mim*. As pílulas de bairro seguem na lista, onde custam um clique e nada de espaço vertical.

**`slug` é imutável.** O slug de cada casa vai impresso dentro do QR code que fica na mesa e é a URL pública da casa. Trocar um slug quebra QR já distribuído e link já compartilhado, e não há redirecionamento que conserte papel impresso. Slug novo só para casa nova.

---

## Votação

Fluxo: o QR da mesa aponta para `/votar/[slug]`, que é **route handler e não página** — no Next, cookie só pode ser gravado em route handler ou server action; `cookies().set()` durante o render de uma página lança. Ele valida a casa, cria a sessão, grava o cookie e manda para `/votar/[slug]/avaliar`.

A casa vem da rota, **nunca de campo do formulário**. Se o estabelecimento pudesse ser escolhido pelo cliente, alguém votaria no bar errado de propósito.

**O CPF nunca é gravado.** Entra pelo corpo do POST, vira `HMAC-SHA256(cpf, CPF_PEPPER)` e some. Não é gravado, não é logado, não volta na resposta. Hash simples não serviria: CPF tem ~1,1 bilhão de números válidos e a tabela inteira se monta em minutos num notebook — o pepper é o que a torna inútil para quem levar um dump do banco.

**Trocar `CPF_PEPPER` invalida todos os hashes já gravados** e a deduplicação para de funcionar retroativamente. É segredo de guardar, não de rotacionar.

Validação do CPF é só aritmética de dígito verificador, nos dois lados. No cliente para dar retorno na hora; no servidor porque é lá que vale — um POST pode chegar sem passar pelo formulário.

**Voto repetido é barrado pelo índice único, não por `SELECT` antes.** Sob concorrência, checar antes de inserir deixa as duas gravações passarem. O código trata o `23505` do Postgres. Os nomes das constraints estão conferidos contra o banco: `uma_avaliacao_por_cpf_por_casa` (que **não** tem "cpf_hash" no nome) e `avaliacoes_sessao_id_key`.

As quatro notas são gravadas em colunas separadas, nunca a soma: guardar só o total impediria o desempate por sabor que o regulamento manda.

---

## Na fila, não agora

**"Adicionar ao rolê"** — deixar a pessoa marcar casas e montar um roteiro próprio. É a funcionalidade mais valiosa que ainda não existe, mas muda o modelo de dados. Não implementar sem decisão explícita.

**Geração e impressão dos QR codes** — precisa estar pronta semanas antes do dia 19. O QR aponta para `/votar/[slug]`, e o slug é imutável.

**Painel de apuração** — fora de escopo até a votação estar rodando.

---

## Sobre os protótipos

Os arquivos em `docs/` são **referência de arquitetura e hierarquia, não código a portar.** Reescrever como componentes; não traduzir o HTML linha a linha. Melhorar é bem-vindo, desde que respeite os tokens e as regras acima.

Eles também estão inchados — algumas seções foram preenchidas para parecerem completas. Cortar o que não serve a quem entra querendo escolher onde comer é melhoria, não desvio.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
