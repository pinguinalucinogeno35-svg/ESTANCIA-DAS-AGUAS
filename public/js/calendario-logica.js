// Regras do calendário de hospedagem, sem nada de tela. Usado pelo navegador e pelos testes.
// Datas são textos 'AAAA-MM-DD' (datas locais, sem hora). Um período ocupado é [inicio, fim):
// a noite do dia "fim" está livre, então quem sai e quem entra no mesmo dia não se chocam.

export function somarDias(iso, n) {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function noites(entrada, saida) {
  const ms = Date.parse(saida + 'T00:00:00Z') - Date.parse(entrada + 'T00:00:00Z');
  return Math.round(ms / 86400000);
}

// A noite deste dia está ocupada nesta acomodação?
export function noiteOcupada(acomodacao, dia) {
  return acomodacao.ocupado.some(([ini, fim]) => dia >= ini && dia < fim);
}

// A acomodação está livre em todas as noites de [entrada, saida)?
export function livreNoPeriodo(acomodacao, entrada, saida) {
  return !acomodacao.ocupado.some(([ini, fim]) => ini < saida && fim > entrada);
}

export function livresNoPeriodo(acomodacoes, entrada, saida) {
  return acomodacoes.filter((a) => livreNoPeriodo(a, entrada, saida));
}

// Quantas acomodações da lista têm a noite deste dia livre.
export function livresNaNoite(acomodacoes, dia) {
  return acomodacoes.filter((a) => !noiteOcupada(a, dia)).length;
}

// Última data de saída possível para uma entrada: o primeiro dia em que nenhuma acomodação
// consegue cobrir o período inteiro desde a entrada. Limitada por "ate" (fim do calendário).
export function ultimaSaida(acomodacoes, entrada, ate) {
  let saida = entrada;
  while (saida < ate) {
    const proxima = somarDias(saida, 1);
    if (livresNoPeriodo(acomodacoes, entrada, proxima).length === 0) break;
    saida = proxima;
  }
  return saida === entrada ? null : saida;
}

// Situação de cada dia para desenhar a grade.
//   passado: antes de hoje ou depois do fim do calendário
//   ocupado: nenhuma acomodação da lista tem a noite livre (vermelho)
//   livre:   pelo menos uma tem
export function situacaoDoDia(acomodacoes, dia, hoje, ate) {
  if (dia < hoje || dia >= ate) return 'passado';
  if (acomodacoes.length === 0) return 'ocupado';
  return livresNaNoite(acomodacoes, dia) === 0 ? 'ocupado' : 'livre';
}

// Semanas de um mês (domingo a sábado). Posições fora do mês vêm como null.
export function semanasDoMes(ano, mes) {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
  const dias = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const celulas = [];
  for (let i = 0; i < primeiro.getUTCDay(); i++) celulas.push(null);
  for (let d = 1; d <= dias; d++) celulas.push(ano + '-' + String(mes).padStart(2, '0') + '-' + String(d).padStart(2, '0'));
  while (celulas.length % 7) celulas.push(null);
  const semanas = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return semanas;
}
