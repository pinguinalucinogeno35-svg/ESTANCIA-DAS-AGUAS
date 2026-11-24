import pg from 'pg';

// Banco local do Supabase (npm run db:start). Os testes rodam em transações desfeitas no fim.
export const URL_BANCO = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

export function novoCliente() {
  return new pg.Client({ connectionString: URL_BANCO });
}

// Executa como um papel do Supabase (anon ou authenticated), com o usuário indicado no token.
export async function como(c: pg.Client, papel: 'anon' | 'authenticated', userId?: string) {
  await c.query('reset role');
  await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(userId ? { sub: userId, role: papel } : { role: papel })]);
  await c.query(`set local role ${papel}`);
}

export async function criarUsuario(c: pg.Client, email: string): Promise<string> {
  const r = await c.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
     values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $1, '', now(), now(), now())
     returning id`,
    [email],
  );
  return r.rows[0].id;
}
