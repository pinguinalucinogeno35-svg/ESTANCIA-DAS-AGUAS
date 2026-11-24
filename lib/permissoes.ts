// Quem vê o quê no aplicativo do administrador. Fonte única, usada pelo menu, pelas páginas e pelos testes.
export type Papel = 'dono' | 'portaria';
export type Tela = 'hoje' | 'agenda' | 'pedidos' | 'portaria' | 'ajustes';

export const TELAS: ReadonlyArray<{ id: Tela; rotulo: string; icone: string; papeis: ReadonlyArray<Papel> }> = [
  { id: 'hoje', rotulo: 'Hoje', icone: 'a-hoje', papeis: ['dono', 'portaria'] },
  { id: 'agenda', rotulo: 'Agenda', icone: 'a-agenda', papeis: ['dono'] },
  { id: 'pedidos', rotulo: 'Pedidos', icone: 'a-pedidos', papeis: ['dono'] },
  { id: 'portaria', rotulo: 'Portaria', icone: 'a-portaria', papeis: ['dono', 'portaria'] },
  { id: 'ajustes', rotulo: 'Ajustes', icone: 'a-ajustes', papeis: ['dono'] },
];

export function podeVer(papel: Papel | null | undefined, tela: Tela): boolean {
  if (!papel) return false;
  const t = TELAS.find((x) => x.id === tela);
  return !!t && t.papeis.includes(papel);
}

export function telasDe(papel: Papel | null | undefined) {
  return TELAS.filter((t) => podeVer(papel, t.id));
}

export function telaInicial(papel: Papel): Tela {
  return telasDe(papel)[0].id;
}
