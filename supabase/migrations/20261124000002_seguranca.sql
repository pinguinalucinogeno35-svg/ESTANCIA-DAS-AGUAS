-- Row Level Security: ligada em todas as tabelas, negando por padrão.
-- Visitante (anon): não lê nem escreve nada direto no banco.
-- Administrador logado (authenticated): só leitura, conforme o perfil. Toda escrita passa pelo servidor.
--   dono: lê tudo.
--   portaria: lê só o que as telas Hoje e Portaria precisam.

alter table public.admin_perfis        enable row level security;
alter table public.configuracoes       enable row level security;
alter table public.dayuse_dias         enable row level security;
alter table public.dayuse_pedidos      enable row level security;
alter table public.vouchers            enable row level security;
alter table public.chales              enable row level security;
alter table public.hospedagem_pedidos  enable row level security;
alter table public.chale_ocupacoes     enable row level security;
alter table public.pagamentos          enable row level security;
alter table public.webhook_eventos     enable row level security;
alter table public.push_inscricoes     enable row level security;
alter table public.auditoria           enable row level security;
alter table public.limite_tentativas   enable row level security;

-- Tira os privilégios padrão e devolve só leitura ao administrador logado.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;

grant select on
  public.admin_perfis, public.configuracoes, public.dayuse_dias, public.dayuse_pedidos, public.vouchers,
  public.chales, public.hospedagem_pedidos, public.chale_ocupacoes, public.pagamentos,
  public.push_inscricoes, public.auditoria
to authenticated;

revoke all on schema interno from public, anon;
grant usage on schema interno to authenticated, service_role;
revoke all on all functions in schema interno from public, anon;
grant execute on function interno.papel_atual(), interno.e_dono(), interno.e_admin() to authenticated, service_role;
grant execute on function interno.codigo_aleatorio(), interno.tocar_atualizado_em() to service_role;

-- Cada administrador vê o próprio perfil; o dono vê todos.
create policy admin_perfis_leitura on public.admin_perfis for select to authenticated
  using (user_id = (select auth.uid()) or (select interno.e_dono()));

-- Lidas pelos dois perfis (telas Hoje e Portaria).
create policy dayuse_pedidos_leitura on public.dayuse_pedidos for select to authenticated
  using ((select interno.e_admin()));
create policy vouchers_leitura on public.vouchers for select to authenticated
  using ((select interno.e_admin()));
create policy hospedagem_pedidos_leitura on public.hospedagem_pedidos for select to authenticated
  using ((select interno.e_admin()));
create policy chales_leitura on public.chales for select to authenticated
  using ((select interno.e_admin()));

-- Só o dono.
create policy configuracoes_leitura on public.configuracoes for select to authenticated
  using ((select interno.e_dono()));
create policy dayuse_dias_leitura on public.dayuse_dias for select to authenticated
  using ((select interno.e_dono()));
create policy chale_ocupacoes_leitura on public.chale_ocupacoes for select to authenticated
  using ((select interno.e_dono()));
create policy pagamentos_leitura on public.pagamentos for select to authenticated
  using ((select interno.e_dono()));
create policy auditoria_leitura on public.auditoria for select to authenticated
  using ((select interno.e_dono()));

-- Cada administrador vê só as inscrições de push dos próprios aparelhos.
create policy push_inscricoes_leitura on public.push_inscricoes for select to authenticated
  using (admin_id = (select auth.uid()) and (select interno.e_admin()));

-- webhook_eventos e limite_tentativas: sem política e sem privilégio. Só o servidor acessa.
