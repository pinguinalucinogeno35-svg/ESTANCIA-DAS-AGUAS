import { exigirAdmin } from '@/lib/admin/sessao';

export default async function Pedidos() {
  await exigirAdmin('pedidos');
  return (
    <>
      <div className="cabecalho-tela">
        <h1>Pedidos</h1>
        <p>Aprovar ou recusar hospedagens e enviar o link do sinal.</p>
      </div>
      <section className="bloco-claro">
        <h2>Em construção</h2>
        <p>A fila de pedidos entra na etapa 5.</p>
      </section>
    </>
  );
}
