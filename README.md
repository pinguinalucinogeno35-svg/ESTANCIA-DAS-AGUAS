# Estância das Águas

Site, reservas online e aplicativo do administrador da Estância das Águas (Ilhéus, BA).

**Situação:** etapa 2 de 6 concluída (base). Reservas com Pix, push e telas do administrador chegam nas próximas etapas.

## O que existe hoje

- **Página inicial** (`public/index.html`): o site aprovado, servido na raiz como arquivo estático, sem passar pelo React. A fonte e o GSAP são servidos pelo próprio site.
- **Aplicativo do administrador** (`/admin`): login e as cinco telas (ainda vazias), liberadas conforme o perfil. `dono` vê tudo; `portaria` vê só Hoje e Portaria.
- **Calendário de hospedagem**: no diálogo Hospedagem da página inicial, mostra os dias livres e os reservados (em vermelho) e as acomodações disponíveis nas datas escolhidas. O pedido ainda segue pelo WhatsApp; o pagamento do sinal entra na etapa 5.
- **Banco** (`supabase/migrations/`): todas as tabelas, restrições e Row Level Security.
- `site_v4/` guarda o site original intacto, só para comparação visual. Não é publicado.

## Como rodar no seu computador

Requisitos: Node 22 ou mais novo e Docker.

```bash
npm install
```

```bash
npm run db:start
```

O último comando sobe o Supabase local, aplica as migrações e carrega os dados de exemplo (`supabase/seed.sql`). Ao terminar, ele mostra a URL e as chaves locais. Copie `.env.example` para `.env.local` e preencha com elas.

```bash
npm run dev
```

O site abre em `http://localhost:3000` e o administrador em `http://localhost:3000/admin`.

## Variáveis de ambiente

| Variável | Onde fica | Para quê |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase, Project Settings, API | Endereço do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase, Project Settings, API Keys | Chave publicável (pode ir ao navegador) |
| `SUPABASE_SECRET_KEY` | Supabase, Project Settings, API Keys | Chave secreta. Só no servidor. |

Em produção, cadastre as três na Vercel (Project Settings, Environment Variables). Nenhuma chave vai para o repositório.

## Como criar o primeiro administrador

```bash
npm run admin:criar -- email@exemplo.com "Nome da pessoa" dono
```

O script pede a senha no terminal (mínimo de 10 caracteres) e não a mostra na tela. Para a portaria, troque `dono` por `portaria`. Rodar de novo com o mesmo e-mail troca a senha e o perfil.

## Testes

```bash
npm test
```

Testes de unidade e de banco (precisam do banco local no ar): permissões dos dois perfis, RLS em todas as tabelas, sobreposição de datas de chalé.

```bash
npm run test:e2e
```

Testes no navegador em 390 px e 1440 px: página inicial sem erros no console e sem chamadas a terceiros, login, telas por perfil.

```bash
npm run verificar:glifos
```

Busca emojis e caracteres usados como ícone em todo o código. Precisa dar zero.

## Banco de dados

- Migrações em `supabase/migrations/`, aplicadas em ordem.
- `supabase/seed.sql` tem **dados de exemplo só para desenvolvimento**. Nenhum daqueles valores foi definido pelo cliente; não rode o seed em produção.
- O que o cliente ainda não definiu (preços, limite de pessoas, sinal, regra de cancelamento) nasce vazio e será preenchido na tela Ajustes.

## Hospedin

A pousada usa o Hospedin como sistema de gestão da hospedagem. O site já está estruturado para receber a agenda de lá:

- O calendário lê sempre a tabela `chale_ocupacoes`. Hoje ela tem os bloqueios locais; com a integração ligada, uma rotina copia para ela os períodos ocupados no Hospedin.
- `lib/hospedagem/hospedin.ts` é o ponto de encaixe. **As chamadas à API ainda não foram escritas**, porque dependem da documentação oficial e da credencial da API v3 (Client ID e Secret), que o cliente precisa pedir ao Hospedin.
- Variáveis reservadas: `HOSPEDIN_ACCOUNT_ID`, `HOSPEDIN_CLIENT_ID`, `HOSPEDIN_CLIENT_SECRET`.

## Pendências conhecidas

- A política de privacidade ainda descreve o site antigo (sem coleta de dados). Ela será reescrita na etapa 6 e, junto com a regra de cancelamento, **precisa de revisão do cliente ou de um profissional jurídico** antes de entrar no ar.
- Os textos "o maior da região" e "aprovada pelo DNPM" foram publicados como o cliente informou. O DNPM foi substituído pela ANM em 2018: confirme com o cliente a redação e se há documento que comprove.
- As acomodações do calendário são de exemplo. Quantidade, nomes e capacidade reais dependem do cliente ou do Hospedin.
- Nada foi publicado. Não há projeto criado na Vercel nem no Supabase.
