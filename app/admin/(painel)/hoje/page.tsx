import { exigirAdmin } from '@/lib/admin/sessao';

export default async function Hoje() {
  await exigirAdmin('hoje');
  return (
    <>
      <div className="cabecalho-tela">
        <h1>Hoje</h1>
        <p>Quem chega hoje: vouchers de day use e entradas de hóspedes.</p>
      </div>
      <section className="bloco-claro">
        <h2>Em construção</h2>
        <p>A lista de chegadas entra na etapa 4, depois que o day use estiver vendendo.</p>
      </section>
    </>
  );
}
