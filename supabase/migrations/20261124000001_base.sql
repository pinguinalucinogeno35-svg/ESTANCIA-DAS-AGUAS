-- Estância das Águas: estrutura inicial do banco.
-- Dinheiro sempre em centavos (integer). Datas de visita e de hospedagem são datas locais (America/Bahia), sem hora.
-- Nenhuma tabela é escrita pelo navegador: toda escrita passa pelo servidor, com a chave secreta.

create extension if not exists btree_gist with schema extensions;

create schema if not exists interno;

create type public.papel_admin as enum ('dono', 'portaria');
create type public.situacao_dayuse as enum ('aguardando_pagamento', 'pago', 'pago_sem_vaga', 'expirado', 'cancelado', 'usado');
create type public.situacao_voucher as enum ('valido', 'usado', 'cancelado');
create type public.situacao_hospedagem as enum ('aguardando_aprovacao', 'aguardando_sinal', 'confirmado', 'recusado', 'expirado', 'cancelado');
create type public.situacao_pagamento as enum ('pendente', 'aprovado', 'cancelado', 'expirado', 'devolvido', 'falhou');
create type public.tipo_pagamento as enum ('dayuse', 'sinal');
create type public.tipo_sinal as enum ('percentual', 'fixo');
create type public.origem_ocupacao as enum ('pedido', 'bloqueio');

-- Código público longo e aleatório (244 bits), sem relação com dados da pessoa.
create function interno.codigo_aleatorio() returns text
language sql volatile set search_path = ''
as $$ select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') $$;

create function interno.tocar_atualizado_em() returns trigger
language plpgsql set search_path = ''
as $$ begin new.atualizado_em := now(); return new; end $$;

-- ---------------------------------------------------------------------------
-- Administradores
-- ---------------------------------------------------------------------------
create table public.admin_perfis (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) between 1 and 120),
  papel public.papel_admin not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Papel do administrador logado. Nulo para quem não é administrador ativo.
create function interno.papel_atual() returns public.papel_admin
language sql stable security definer set search_path = ''
as $$ select papel from public.admin_perfis where user_id = (select auth.uid()) and ativo $$;

create function interno.e_dono() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(interno.papel_atual() = 'dono', false) $$;

create function interno.e_admin() returns boolean
language sql stable set search_path = ''
as $$ select interno.papel_atual() is not null $$;

-- ---------------------------------------------------------------------------
-- Configurações gerais (linha única). O que o cliente ainda não definiu fica nulo
-- e é preenchido na tela Ajustes; enquanto estiver nulo, a venda correspondente fica fechada.
-- ---------------------------------------------------------------------------
create table public.configuracoes (
  id boolean primary key default true check (id),
  preco_adulto_centavos integer check (preco_adulto_centavos >= 0),
  preco_crianca_centavos integer check (preco_crianca_centavos >= 0),
  dayuse_limite_padrao integer check (dayuse_limite_padrao > 0),
  -- dias da semana abertos por padrão: 0 = domingo ... 6 = sábado
  dayuse_dias_semana smallint[] not null default '{}' check (dayuse_dias_semana <@ array[0,1,2,3,4,5,6]::smallint[]),
  dayuse_contar_bebes boolean not null default true,
  dayuse_hora_limite_mesmo_dia time,
  -- o Pix do Mercado Pago vale no mínimo 30 minutos
  dayuse_reserva_minutos integer not null default 30 check (dayuse_reserva_minutos between 30 and 1440),
  sinal_tipo public.tipo_sinal,
  -- percentual: 1 a 100; fixo: centavos
  sinal_valor integer check (sinal_valor > 0),
  sinal_prazo_horas integer check (sinal_prazo_horas between 1 and 720),
  hospedagem_aprovacao_manual boolean not null default true,
  regra_cancelamento text,
  -- verdadeiro quando os valores vieram do seed de desenvolvimento
  dados_de_exemplo boolean not null default false,
  atualizado_em timestamptz not null default now(),
  check (sinal_tipo is distinct from 'percentual' or sinal_valor is null or sinal_valor <= 100)
);
insert into public.configuracoes (id) values (true);
create trigger configuracoes_atualizado before update on public.configuracoes
  for each row execute function interno.tocar_atualizado_em();

-- ---------------------------------------------------------------------------
-- Day use
-- ---------------------------------------------------------------------------
-- Exceções por data. Sem linha, vale o padrão de configuracoes (dia da semana e limite padrão).
create table public.dayuse_dias (
  data date primary key,
  aberto boolean not null,
  limite_pessoas integer check (limite_pessoas > 0),
  feriado boolean not null default false,
  observacao text check (length(observacao) <= 200),
  atualizado_em timestamptz not null default now()
);
create trigger dayuse_dias_atualizado before update on public.dayuse_dias
  for each row execute function interno.tocar_atualizado_em();

create table public.dayuse_pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default interno.codigo_aleatorio(),
  data_visita date not null,
  adultos integer not null check (adultos between 1 and 99),
  criancas integer not null default 0 check (criancas between 0 and 99),
  bebes integer not null default 0 check (bebes between 0 and 99),
  -- pessoas que contam no limite do dia, calculado no servidor na criação
  pessoas_no_limite integer not null check (pessoas_no_limite > 0),
  valor_centavos integer not null check (valor_centavos >= 0),
  nome text check (length(trim(nome)) between 2 and 120),
  whatsapp text check (whatsapp ~ '^[0-9]{10,13}$'),
  email text check (length(email) <= 254),
  situacao public.situacao_dayuse not null default 'aguardando_pagamento',
  reserva_expira_em timestamptz not null,
  aceite_em timestamptz not null,
  -- preenchido quando os dados pessoais são apagados a pedido do titular
  anonimizado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index dayuse_pedidos_data_situacao on public.dayuse_pedidos (data_visita, situacao);
create index dayuse_pedidos_pendentes on public.dayuse_pedidos (reserva_expira_em) where situacao = 'aguardando_pagamento';
create trigger dayuse_pedidos_atualizado before update on public.dayuse_pedidos
  for each row execute function interno.tocar_atualizado_em();

create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default interno.codigo_aleatorio(),
  pedido_id uuid not null unique references public.dayuse_pedidos (id) on delete restrict,
  situacao public.situacao_voucher not null default 'valido',
  conferido_por uuid references public.admin_perfis (user_id) on delete set null,
  conferido_em timestamptz,
  criado_em timestamptz not null default now(),
  check ((situacao = 'usado') = (conferido_em is not null))
);
create index vouchers_conferido_por on public.vouchers (conferido_por);

-- ---------------------------------------------------------------------------
-- Hospedagem
-- ---------------------------------------------------------------------------
create table public.chales (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) between 1 and 80),
  capacidade integer not null check (capacidade between 1 and 50),
  tarifa_centavos integer not null check (tarifa_centavos >= 0),
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create trigger chales_atualizado before update on public.chales
  for each row execute function interno.tocar_atualizado_em();

create table public.hospedagem_pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default interno.codigo_aleatorio(),
  chale_id uuid not null references public.chales (id) on delete restrict,
  entrada date not null,
  saida date not null,
  adultos integer not null check (adultos between 1 and 50),
  criancas integer not null default 0 check (criancas between 0 and 50),
  valor_total_centavos integer not null check (valor_total_centavos >= 0),
  valor_sinal_centavos integer not null check (valor_sinal_centavos >= 0),
  nome text check (length(trim(nome)) between 2 and 120),
  whatsapp text check (whatsapp ~ '^[0-9]{10,13}$'),
  email text check (length(email) <= 254),
  situacao public.situacao_hospedagem not null default 'aguardando_aprovacao',
  sinal_expira_em timestamptz,
  aceite_em timestamptz not null,
  decidido_por uuid references public.admin_perfis (user_id) on delete set null,
  decidido_em timestamptz,
  anonimizado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (saida > entrada),
  check (valor_sinal_centavos <= valor_total_centavos)
);
create index hospedagem_pedidos_chale on public.hospedagem_pedidos (chale_id, entrada);
create index hospedagem_pedidos_situacao on public.hospedagem_pedidos (situacao, criado_em);
create index hospedagem_pedidos_decidido_por on public.hospedagem_pedidos (decidido_por);
create trigger hospedagem_pedidos_atualizado before update on public.hospedagem_pedidos
  for each row execute function interno.tocar_atualizado_em();

-- Períodos ocupados de cada chalé: pedido aprovado ou confirmado, ou bloqueio manual (venda por fora).
-- O período é [entrada, saída): o dia da saída fica livre para a próxima entrada.
-- A restrição de exclusão é o que impede reservar o mesmo chalé duas vezes, mesmo com pedidos simultâneos.
create table public.chale_ocupacoes (
  id uuid primary key default gen_random_uuid(),
  chale_id uuid not null references public.chales (id) on delete restrict,
  periodo daterange not null check (not isempty(periodo) and lower_inc(periodo) and not upper_inc(periodo)),
  origem public.origem_ocupacao not null,
  pedido_id uuid unique references public.hospedagem_pedidos (id) on delete cascade,
  motivo text check (length(motivo) <= 200),
  criado_por uuid references public.admin_perfis (user_id) on delete set null,
  criado_em timestamptz not null default now(),
  check ((origem = 'pedido') = (pedido_id is not null)),
  constraint chale_sem_sobreposicao exclude using gist (chale_id with =, periodo with &&)
);
create index chale_ocupacoes_criado_por on public.chale_ocupacoes (criado_por);

-- ---------------------------------------------------------------------------
-- Pagamentos (Mercado Pago, API Orders)
-- ---------------------------------------------------------------------------
create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_pagamento not null,
  dayuse_pedido_id uuid references public.dayuse_pedidos (id) on delete restrict,
  hospedagem_pedido_id uuid references public.hospedagem_pedidos (id) on delete restrict,
  chave_idempotencia uuid not null unique default gen_random_uuid(),
  mp_order_id text unique,
  mp_payment_id text,
  valor_centavos integer not null check (valor_centavos > 0),
  situacao public.situacao_pagamento not null default 'pendente',
  pix_copia_cola text,
  pix_qr_base64 text,
  expira_em timestamptz,
  confirmado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check ((tipo = 'dayuse' and dayuse_pedido_id is not null and hospedagem_pedido_id is null)
      or (tipo = 'sinal' and hospedagem_pedido_id is not null and dayuse_pedido_id is null))
);
create index pagamentos_dayuse on public.pagamentos (dayuse_pedido_id);
create index pagamentos_hospedagem on public.pagamentos (hospedagem_pedido_id);
create index pagamentos_pendentes on public.pagamentos (criado_em) where situacao = 'pendente';
create trigger pagamentos_atualizado before update on public.pagamentos
  for each row execute function interno.tocar_atualizado_em();

-- Avisos do Mercado Pago já recebidos: a chave única é o que torna o processamento idempotente.
create table public.webhook_eventos (
  id bigint generated always as identity primary key,
  mp_recurso_id text not null,
  acao text not null,
  request_id text,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz,
  unique (mp_recurso_id, acao)
);

-- ---------------------------------------------------------------------------
-- Push, auditoria e limite de tentativas
-- ---------------------------------------------------------------------------
create table public.push_inscricoes (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_perfis (user_id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  aparelho text check (length(aparelho) <= 120),
  criado_em timestamptz not null default now(),
  ultimo_envio_em timestamptz
);
create index push_inscricoes_admin on public.push_inscricoes (admin_id);

create table public.auditoria (
  id bigint generated always as identity primary key,
  admin_id uuid references public.admin_perfis (user_id) on delete set null,
  acao text not null,
  alvo_tipo text,
  alvo_id text,
  antes jsonb,
  depois jsonb,
  criado_em timestamptz not null default now()
);
create index auditoria_admin on public.auditoria (admin_id);
create index auditoria_criado_em on public.auditoria (criado_em desc);

-- Contagem por rota e por janela de tempo. A chave é um hash com segredo do servidor, nunca o IP em claro.
create table public.limite_tentativas (
  chave text not null,
  rota text not null,
  janela_inicio timestamptz not null,
  contagem integer not null default 1,
  primary key (chave, rota, janela_inicio)
);
create index limite_tentativas_janela on public.limite_tentativas (janela_inicio);
