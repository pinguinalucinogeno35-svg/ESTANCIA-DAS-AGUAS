import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Cliente com a chave secreta: ignora a RLS. Só pode ser importado por código de servidor.
export function criarClienteServico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !chave) throw new Error('Variáveis do Supabase ausentes no servidor.');
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}
