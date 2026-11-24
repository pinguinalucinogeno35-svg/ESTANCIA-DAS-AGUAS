'use server';

import { redirect } from 'next/navigation';
import { criarClienteServidor } from '@/lib/supabase/server';
import { telaInicial, type Papel } from '@/lib/permissoes';

export type EstadoEntrada = { erro: string | null };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export async function entrar(_anterior: EstadoEntrada, dados: FormData): Promise<EstadoEntrada> {
  const email = String(dados.get('email') ?? '').trim().toLowerCase();
  const senha = String(dados.get('senha') ?? '');
  if (!EMAIL.test(email) || senha.length < 1 || senha.length > 200) {
    return { erro: 'Confira o e-mail e a senha.' };
  }

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error || !data.user) {
    // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quem tem conta.
    return { erro: 'E-mail ou senha incorretos.' };
  }

  const { data: perfil } = await supabase.from('admin_perfis').select('papel, ativo').eq('user_id', data.user.id).maybeSingle();
  if (!perfil || !perfil.ativo) {
    await supabase.auth.signOut();
    return { erro: 'Esta conta não tem acesso ao aplicativo do administrador.' };
  }
  redirect('/admin/' + telaInicial(perfil.papel as Papel));
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
