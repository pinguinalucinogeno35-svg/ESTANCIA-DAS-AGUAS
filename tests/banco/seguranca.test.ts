import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type pg from 'pg';
import { como, criarUsuario, novoCliente } from './ajuda';

const TABELAS = [
  'admin_perfis', 'configuracoes', 'dayuse_dias', 'dayuse_pedidos', 'vouchers', 'chales', 'hospedagem_pedidos',
  'chale_ocupacoes', 'pagamentos', 'webhook_eventos', 'push_inscricoes', 'auditoria', 'limite_tentativas',
];
const SO_DONO = ['configuracoes', 'dayuse_dias', 'chale_ocupacoes', 'pagamentos', 'auditoria'];
const DOS_DOIS = ['dayuse_pedidos', 'vouchers', 'hospedagem_pedidos', 'chales'];

let c: pg.Client;
let dono: string, portaria: string, estranho: string, inativo: string;

beforeAll(async () => { c = novoCliente(); await c.connect(); });
afterAll(async () => { await c.end(); });

beforeEach(async () => {
  await c.query('begin');
  dono = await criarUsuario(c, 'dono@teste.invalid');
  portaria = await criarUsuario(c, 'portaria@teste.invalid');
  estranho = await criarUsuario(c, 'estranho@teste.invalid');
  inativo = await criarUsuario(c, 'inativo@teste.invalid');
  await c.query(`insert into public.admin_perfis (user_id, nome, papel, ativo) values ($1,'Dono','dono',true), ($2,'Portaria','portaria',true), ($3,'Ex-dono','dono',false)`, [dono, portaria, inativo]);
  const chale = (await c.query(`insert into public.chales (nome, capacidade, tarifa_centavos) values ('Chalé de teste', 4, 10000) returning id`)).rows[0].id;
  const pedido = (await c.query(
    `insert into public.dayuse_pedidos (data_visita, adultos, pessoas_no_limite, valor_centavos, nome, whatsapp, reserva_expira_em, aceite_em)
     values (current_date + 7, 2, 2, 6000, 'Visitante de teste', '5573999990000', now() + interval '30 minutes', now()) returning id`)).rows[0].id;
  await c.query(`insert into public.vouchers (pedido_id) values ($1)`, [pedido]);
  const hosp = (await c.query(
    `insert into public.hospedagem_pedidos (chale_id, entrada, saida, adultos, valor_total_centavos, valor_sinal_centavos, nome, whatsapp, aceite_em)
     values ($1, current_date + 10, current_date + 12, 2, 20000, 10000, 'Hóspede de teste', '5573999990001', now()) returning id`, [chale])).rows[0].id;
  await c.query(`insert into public.chale_ocupacoes (chale_id, periodo, origem, pedido_id) values ($1, daterange(current_date + 10, current_date + 12), 'pedido', $2)`, [chale, hosp]);
  await c.query(`insert into public.pagamentos (tipo, dayuse_pedido_id, valor_centavos) values ('dayuse', $1, 6000)`, [pedido]);
  await c.query(`insert into public.dayuse_dias (data, aberto) values (current_date + 7, true)`);
  await c.query(`insert into public.auditoria (admin_id, acao) values ($1, 'teste')`, [dono]);
  await c.query(`insert into public.webhook_eventos (mp_recurso_id, acao) values ('ORD_TESTE', 'order.processed')`);
  await c.query(`insert into public.push_inscricoes (admin_id, endpoint, p256dh, auth) values ($1,'https://push.invalid/dono','k','a'), ($2,'https://push.invalid/portaria','k','a')`, [dono, portaria]);
});
afterEach(async () => { await c.query('rollback'); });

async function linhas(tabela: string): Promise<number | 'negado'> {
  await c.query('savepoint s');
  try {
    const r = await c.query(`select count(*)::int as n from public.${tabela}`);
    await c.query('release savepoint s');
    return r.rows[0].n;
  } catch {
    await c.query('rollback to savepoint s');
    return 'negado';
  }
}
async function falha(sql: string, params: unknown[] = []): Promise<boolean> {
  await c.query('savepoint s');
  try {
    const r = await c.query(sql, params);
    await c.query('rollback to savepoint s');
    return (r.rowCount ?? 0) === 0;
  } catch {
    await c.query('rollback to savepoint s');
    return true;
  }
}

describe('Row Level Security', () => {
  it('está ligada em todas as tabelas do schema public', async () => {
    const r = await c.query(`select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity`);
    expect(r.rows).toEqual([]);
    const todas = await c.query(`select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1`);
    expect(todas.rows.map((x) => x.relname).sort()).toEqual([...TABELAS].sort());
  });

  it('visitante (anon) não lê nenhuma tabela', async () => {
    await como(c, 'anon');
    for (const t of TABELAS) expect([t, await linhas(t)]).toEqual([t, 'negado']);
  });

  it('usuário logado sem perfil de administrador não vê nenhuma linha', async () => {
    await como(c, 'authenticated', estranho);
    for (const t of TABELAS) expect([t, await linhas(t)]).toSatisfy(([, n]: [string, number | string]) => n === 0 || n === 'negado');
  });

  it('administrador desativado não vê dados', async () => {
    await como(c, 'authenticated', inativo);
    for (const t of [...SO_DONO, ...DOS_DOIS]) expect([t, await linhas(t)]).toEqual([t, 0]);
  });

  it('dono lê tudo o que as telas usam', async () => {
    await como(c, 'authenticated', dono);
    for (const t of [...SO_DONO, ...DOS_DOIS]) expect([t, await linhas(t)]).toSatisfy(([, n]: [string, number | string]) => typeof n === 'number' && n > 0);
    expect(await linhas('admin_perfis')).toBe(3);
    expect(await linhas('push_inscricoes')).toBe(1);
  });

  it('portaria lê só o que Hoje e Portaria precisam', async () => {
    await como(c, 'authenticated', portaria);
    for (const t of DOS_DOIS) expect([t, await linhas(t)]).toSatisfy(([, n]: [string, number | string]) => typeof n === 'number' && n > 0);
    for (const t of SO_DONO) expect([t, await linhas(t)]).toEqual([t, 0]);
    expect(await linhas('admin_perfis')).toBe(1);
    expect(await linhas('push_inscricoes')).toBe(1);
  });

  it('ninguém lê avisos de pagamento nem limite de tentativas pelo navegador', async () => {
    for (const u of [dono, portaria]) {
      await como(c, 'authenticated', u);
      expect(await linhas('webhook_eventos')).toBe('negado');
      expect(await linhas('limite_tentativas')).toBe('negado');
    }
  });

  it('nenhum perfil escreve direto no banco', async () => {
    for (const u of [dono, portaria]) {
      await como(c, 'authenticated', u);
      expect(await falha(`update public.configuracoes set preco_adulto_centavos = 1`)).toBe(true);
      expect(await falha(`update public.vouchers set situacao = 'usado', conferido_em = now()`)).toBe(true);
      expect(await falha(`update public.admin_perfis set papel = 'dono' where user_id = $1`, [u])).toBe(true);
      expect(await falha(`insert into public.admin_perfis (user_id, nome, papel) values ($1, 'Invasor', 'dono')`, [estranho])).toBe(true);
      expect(await falha(`delete from public.dayuse_pedidos`)).toBe(true);
      expect(await falha(`insert into public.chale_ocupacoes (chale_id, periodo, origem) select id, daterange(current_date + 30, current_date + 31), 'bloqueio' from public.chales limit 1`)).toBe(true);
    }
  });
});

describe('restrições do banco', () => {
  it('o mesmo chalé não aceita dois períodos sobrepostos, e aceita entrada no dia da saída anterior', async () => {
    const chale = (await c.query(`select id from public.chales where nome = 'Chalé de teste'`)).rows[0].id;
    const tenta = (ini: number, fim: number) => falha(`insert into public.chale_ocupacoes (chale_id, periodo, origem, motivo) values ($1, daterange(current_date + $2::int, current_date + $3::int), 'bloqueio', 'teste') returning id`, [chale, ini, fim]);
    expect(await tenta(11, 13)).toBe(true);
    expect(await tenta(9, 11)).toBe(true);
    expect(await tenta(10, 12)).toBe(true);
    expect(await tenta(12, 14)).toBe(false);
    expect(await tenta(8, 10)).toBe(false);
  });

  it('configurações têm uma única linha', async () => {
    expect(await falha(`insert into public.configuracoes (id) values (true)`)).toBe(true);
    expect(await falha(`insert into public.configuracoes (id) values (false)`)).toBe(true);
  });

  it('códigos de pedido e de voucher são longos, aleatórios e diferentes entre si', async () => {
    const r = await c.query(`select p.codigo as a, v.codigo as b from public.dayuse_pedidos p join public.vouchers v on v.pedido_id = p.id`);
    expect(r.rows[0].a).toMatch(/^[0-9a-f]{64}$/);
    expect(r.rows[0].b).toMatch(/^[0-9a-f]{64}$/);
    expect(r.rows[0].a).not.toBe(r.rows[0].b);
  });
});
