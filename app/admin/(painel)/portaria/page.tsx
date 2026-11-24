import { exigirAdmin } from '@/lib/admin/sessao';

export default async function Portaria() {
  await exigirAdmin('portaria');
  return (
    <>
      <div className="cabecalho-tela">
        <h1>Portaria</h1>
        <p>Ler o QR code do voucher pela câmera ou buscar pelo nome.</p>
      </div>
      <section className="bloco-claro">
        <h2>Em construção</h2>
        <p>A leitura de voucher entra na etapa 4.</p>
      </section>
    </>
  );
}
