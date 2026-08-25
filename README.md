# Boteco ACIA — site público

Site oficial da 1ª edição do Boteco ACIA (Ariquemes/RO, 2026). Next.js App Router
+ TypeScript + Tailwind v4. As regras de conteúdo, paleta e repertório visual
estão em [`CLAUDE.md`](./CLAUDE.md) — este arquivo cobre só o que é de código.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Onde fica o quê

```
app/                  rotas (App Router)
components/           componentes de interface
lib/dados.ts          porta de entrada única do conteúdo
lib/fase.ts           em que ponto do calendário o festival está
lib/formato.ts        moeda e data em pt-BR
lib/navegacao.ts      itens do menu
data/restaurantes.ts  casas participantes  (placeholder)
data/edicao.ts        fatos do regulamento (datas, critérios, premiação)
docs/prototipo.html   protótipo original — referência visual, não código
```

Nenhuma página importa `data/*` direto. Tudo passa por `lib/dados.ts`, para que
a troca da fonte de conteúdo por um banco mexa em um arquivo só.

## Decisões que valem conhecer

**A fase do calendário decide o texto.** `lib/fase.ts` deriva da data de hoje se
o festival ainda não começou, está rolando, está em apuração ou já foi
divulgado. A faixa do topo, a chamada da home, a página da casa e a página de
vencedores leem daí. A aba "Vencedores" só entra no menu a partir de 14/10.

- As datas são calculadas no fuso de Ariquemes (UTC−4). O servidor da Vercel
  roda em UTC; sem isso, entre 20h e meia-noite o site mostraria o dia seguinte.
- Para conferir o site em outra fase sem mexer no relógio:
  `BOTECO_FASE_HOJE=2026-09-25 npm run dev`.
- As páginas que dependem da data usam `revalidate = 3600`, para a virada do dia
  não depender de um deploy novo.

**Filtro da disputa é URL, não estado.** `/disputa?bairro=Centro&tipo=Bar`
funciona sem JavaScript, pode ser compartilhado e o parâmetro inventado cai para
"todos" em vez de quebrar.

**Espaço vazio se declara vazio.** Foto de prato, pódio e marcas dos apoiadores
têm dono futuro: aparecem como marcador de ausência, não como conteúdo de
enchimento. O mesmo vale para o brasão — ver `public/logo/LEIA-ME.md`.

**Breakpoints são nomeados pelo que muda neles**, definidos em `@theme`:
`cartao` (720px), `media` (760px), `larga` (900px), `deco` (980px). Além de
documentar a intenção, isso evita a colisão de ordenação que variantes
arbitrárias (`min-[900px]:`) causam contra as variantes padrão do Tailwind.

**A revelação ao rolar é CSS puro** (`animation-timeline: view()`). Onde não há
suporte, o elemento simplesmente já nasce visível — sem observer, sem JS.

## Pendências

- `public/logo/Logo_Boteco_Acia.png` (e as versões horizontal e vetorial)
- Lista definitiva dos estabelecimentos, fotos e descrição dos pratos
- Marcas dos apoiadores
- Domínio de produção — falta para gerar `sitemap.ts`, `robots.ts` e as imagens
  de Open Graph, que precisam de URL absoluta
