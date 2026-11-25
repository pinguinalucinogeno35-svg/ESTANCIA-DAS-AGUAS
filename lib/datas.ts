// Datas locais da pousada. Tudo no fuso America/Bahia, como texto 'AAAA-MM-DD'.
export const FUSO = 'America/Bahia';

export function hojeNaBahia(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
}

export function somarMeses(iso: string, meses: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const alvo = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimo));
  return alvo.toISOString().slice(0, 10);
}

// '[2026-12-01,2026-12-05)' -> ['2026-12-01', '2026-12-05']
export function lerPeriodo(texto: string): [string, string] | null {
  const m = /^\[(\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})\)$/.exec(texto);
  return m ? [m[1], m[2]] : null;
}
