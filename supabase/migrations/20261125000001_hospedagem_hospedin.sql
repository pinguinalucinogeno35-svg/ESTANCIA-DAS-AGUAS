-- Prepara a hospedagem para receber a agenda do Hospedin (sistema de gestão usado pela pousada).
-- O calendário do site sempre lê chale_ocupacoes. Com a integração ligada, uma rotina copia para cá
-- os períodos ocupados no Hospedin (origem 'hospedin'); sem ela, valem os pedidos do site e os bloqueios manuais.

create type public.tipo_acomodacao as enum ('chale', 'apartamento');
create type public.fonte_hospedagem as enum ('local', 'hospedin');

alter type public.origem_ocupacao add value if not exists 'hospedin';

-- A tabela chales guarda todas as acomodações (chalés e apartamentos).
alter table public.chales
  add column tipo public.tipo_acomodacao not null default 'chale',
  add column descricao text check (length(descricao) <= 300),
  -- identificador da acomodação no Hospedin; nulo enquanto não houver integração
  add column hospedin_id text unique;

alter table public.chale_ocupacoes
  -- identificador da reserva ou do bloqueio no sistema de origem (para atualizar sem duplicar)
  add column ref_externa text check (length(ref_externa) <= 120),
  add column sincronizado_em timestamptz;
create unique index chale_ocupacoes_ref_externa on public.chale_ocupacoes (origem, ref_externa) where ref_externa is not null;
create index chale_ocupacoes_periodo on public.chale_ocupacoes using gist (periodo);

alter table public.hospedagem_pedidos
  -- reserva criada no Hospedin a partir deste pedido
  add column hospedin_reserva_id text unique,
  add column hospedin_enviado_em timestamptz;

alter table public.configuracoes
  add column hospedagem_fonte public.fonte_hospedagem not null default 'local',
  add column hospedin_sincronizado_em timestamptz,
  -- até quantos meses à frente o calendário do site mostra
  add column hospedagem_meses_a_frente integer not null default 12 check (hospedagem_meses_a_frente between 1 and 24);
