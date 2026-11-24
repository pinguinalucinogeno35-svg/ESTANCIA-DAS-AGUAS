import { exigirAdmin } from '@/lib/admin/sessao';

export default async function Ajustes() {
  await exigirAdmin('ajustes');
  return (
    <>
      <div className="cabecalho-tela">
        <h1>Ajustes</h1>
        <p>Preços, limite de pessoas, dias abertos, chalés, sinal e prazos.</p>
      </div>
      <section className="bloco-claro">
        <h2>Em construção</h2>
        <p>Os formulários de ajuste entram na etapa 4.</p>
      </section>
    </>
  );
}
