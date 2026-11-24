import { redirect } from 'next/navigation';
import { adminAtual } from '@/lib/admin/sessao';
import { telaInicial } from '@/lib/permissoes';
import { FormularioEntrada } from './FormularioEntrada';

export default async function Entrada({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  const admin = await adminAtual();
  if (admin) redirect('/admin/' + telaInicial(admin.papel));
  const { motivo } = await searchParams;
  const aviso = motivo === 'sem-acesso' ? 'Esta conta não tem acesso ao aplicativo do administrador.' : null;
  return (
    <main className="entrada">
      <div className="entrada-caixa">
        <img src="/img/logo-negativo.svg" alt="Estância das Águas" width={196} height={64} />
        <FormularioEntrada aviso={aviso} />
      </div>
    </main>
  );
}
