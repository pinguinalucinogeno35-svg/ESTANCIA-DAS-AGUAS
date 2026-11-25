import 'server-only';
import { criarClienteServico } from '@/lib/supabase/servico';
import { hojeNaBahia, lerPeriodo, somarMeses } from '@/lib/datas';

export type AcomodacaoPublica = {
  id: string;
  nome: string;
  tipo: 'chale' | 'apartamento';
  capacidade: number;
  // períodos ocupados [inicio, fim), sem dizer por quem nem por quê
  ocupado: [string, string][];
};
export type Disponibilidade = { hoje: string; ate: string; acomodacoes: AcomodacaoPublica[] };

// O que o calendário do site mostra. Só nome, tipo, capacidade e períodos ocupados: nenhum dado de hóspede.
// A leitura é sempre de chale_ocupacoes; a integração com o Hospedin, quando ligada, mantém essa tabela em dia.
export async function lerDisponibilidade(): Promise<Disponibilidade> {
  const supabase = criarClienteServico();
  const hoje = hojeNaBahia();

  const { data: cfg, error: e0 } = await supabase.from('configuracoes').select('hospedagem_meses_a_frente').single();
  if (e0) throw new Error('Não foi possível ler as configurações.');
  const ate = somarMeses(hoje, cfg.hospedagem_meses_a_frente);

  const { data: chales, error: e1 } = await supabase
    .from('chales').select('id, nome, tipo, capacidade').eq('ativo', true).order('ordem').order('nome');
  if (e1) throw new Error('Não foi possível ler as acomodações.');

  const { data: ocupacoes, error: e2 } = await supabase
    .from('chale_ocupacoes').select('chale_id, periodo').overlaps('periodo', `[${hoje},${ate})`);
  if (e2) throw new Error('Não foi possível ler as ocupações.');

  const porChale = new Map<string, [string, string][]>();
  for (const o of ocupacoes ?? []) {
    const p = lerPeriodo(String(o.periodo));
    if (!p) continue;
    const lista = porChale.get(o.chale_id) ?? [];
    lista.push(p);
    porChale.set(o.chale_id, lista);
  }
  return {
    hoje,
    ate,
    acomodacoes: (chales ?? []).map((c) => ({
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      capacidade: c.capacidade,
      ocupado: (porChale.get(c.id) ?? []).sort((a, b) => a[0].localeCompare(b[0])),
    })),
  };
}
