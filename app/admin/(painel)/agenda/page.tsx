import { exigirAdmin } from '@/lib/admin/sessao';

export default async function Agenda() {
  await exigirAdmin('agenda');
  return (
    <>
      <div className="cabecalho-tela">
        <h1>Agenda</h1>
        <p>Vagas de day use por dia e ocupação dos chalés.</p>
      </div>
      <section className="bloco-claro">
        <h2>Em construção</h2>
        <p>O calendário entra na etapa 4.</p>
      </section>
    </>
  );
}
