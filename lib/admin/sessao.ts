import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { criarClienteServidor } from '@/lib/supabase/server';
import { podeVer, telaInicial, type Papel, type Tela } from '@/lib/permissoes';

export type Admin = { id: string; nome: string; papel: Papel };

// Administrador logado, com o perfil lido do banco (nunca do cookie). Nulo se não for administrador ativo.
export const adminAtual = cache(async (): Promise<Admin | null> => {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: perfil } = await supabase.from('admin_perfis').select('nome, papel, ativo').eq('user_id', id).maybeSingle();
  if (!perfil || !perfil.ativo) return null;
  return { id, nome: perfil.nome, papel: perfil.papel as Papel };
});

// Use no topo de toda página e de toda ação do administrador.
export async function exigirAdmin(tela?: Tela): Promise<Admin> {
  const admin = await adminAtual();
  if (!admin) redirect('/admin/login?motivo=sem-acesso');
  if (tela && !podeVer(admin.papel, tela)) redirect('/admin/' + telaInicial(admin.papel));
  return admin;
}
