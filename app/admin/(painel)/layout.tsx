import type { ReactNode } from 'react';
import { exigirAdmin } from '@/lib/admin/sessao';
import { telasDe } from '@/lib/permissoes';
import { Abas } from '@/componentes/Abas';
import { Icone } from '@/componentes/Icones';
import { sair } from '../acoes';

const NOME_PAPEL = { dono: 'Dono', portaria: 'Portaria' } as const;

export default async function Painel({ children }: { children: ReactNode }) {
  const admin = await exigirAdmin();
  const telas = telasDe(admin.papel).map(({ id, rotulo, icone }) => ({ id, rotulo, icone }));
  return (
    <div className="painel">
      <header className="barra">
        <div className="barra-vidro">
          <span className="marca">
            <img src="/img/logo-negativo.svg" alt="Estância das Águas" width={154} height={50} />
          </span>
          <Abas telas={telas} className="abas-topo" />
          <div className="barra-quem">
            <b>{admin.nome}</b>
            <span>{NOME_PAPEL[admin.papel]}</span>
          </div>
          <form action={sair}>
            <button className="sair" type="submit" aria-label="Sair do aplicativo">
              <Icone id="a-sair" />
            </button>
          </form>
        </div>
      </header>
      <main className="container">{children}</main>
      <Abas telas={telas} className="abas-baixo" />
    </div>
  );
}
