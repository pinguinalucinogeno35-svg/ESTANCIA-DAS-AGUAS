import { redirect } from 'next/navigation';
import { exigirAdmin } from '@/lib/admin/sessao';
import { telaInicial } from '@/lib/permissoes';

export default async function AdminInicio() {
  const admin = await exigirAdmin();
  redirect('/admin/' + telaInicial(admin.papel));
}
