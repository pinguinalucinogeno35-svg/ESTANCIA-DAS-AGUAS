import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo JavaScript do navegador, sem tipos
import * as cal from '../../public/js/calendario-logica.js';
import { hojeNaBahia, lerPeriodo, somarMeses } from '@/lib/datas';

const A = { id: 'a', nome: 'A', ocupado: [['2026-12-10', '2026-12-13']] };
const B = { id: 'b', nome: 'B', ocupado: [['2026-12-11', '2026-12-12'], ['2026-12-20', '2026-12-22']] };

describe('calendário de hospedagem', () => {
  it('a noite da saída fica livre: quem sai e quem entra no mesmo dia não se chocam', () => {
    expect(cal.noiteOcupada(A, '2026-12-10')).toBe(true);
    expect(cal.noiteOcupada(A, '2026-12-12')).toBe(true);
    expect(cal.noiteOcupada(A, '2026-12-13')).toBe(false);
    expect(cal.livreNoPeriodo(A, '2026-12-13', '2026-12-15')).toBe(true);
    expect(cal.livreNoPeriodo(A, '2026-12-08', '2026-12-10')).toBe(true);
    expect(cal.livreNoPeriodo(A, '2026-12-08', '2026-12-11')).toBe(false);
    expect(cal.livreNoPeriodo(A, '2026-12-12', '2026-12-14')).toBe(false);
  });

  it('o dia só fica vermelho quando todas as acomodações estão ocupadas', () => {
    const s = (dia: string) => cal.situacaoDoDia([A, B], dia, '2026-12-01', '2027-12-01');
    expect(s('2026-12-10')).toBe('livre');
    expect(s('2026-12-11')).toBe('ocupado');
    expect(s('2026-12-12')).toBe('livre');
    expect(s('2026-11-30')).toBe('passado');
    expect(s('2027-12-01')).toBe('passado');
    expect(cal.situacaoDoDia([A], '2026-12-12', '2026-12-01', '2027-12-01')).toBe('ocupado');
    expect(cal.situacaoDoDia([], '2026-12-12', '2026-12-01', '2027-12-01')).toBe('ocupado');
  });

  it('lista só as acomodações livres no período inteiro', () => {
    expect(cal.livresNoPeriodo([A, B], '2026-12-08', '2026-12-10').map((x: { id: string }) => x.id)).toEqual(['a', 'b']);
    expect(cal.livresNoPeriodo([A, B], '2026-12-09', '2026-12-11').map((x: { id: string }) => x.id)).toEqual(['b']);
    expect(cal.livresNoPeriodo([A, B], '2026-12-10', '2026-12-12')).toEqual([]);
    expect(cal.livresNoPeriodo([A, B], '2026-12-19', '2026-12-21').map((x: { id: string }) => x.id)).toEqual(['a']);
  });

  it('a última saída possível para na primeira noite que ninguém cobre', () => {
    // entrando dia 8: B cobre 8, 9 e 10; a noite 11 está ocupada nas duas, então sai no máximo dia 11
    expect(cal.ultimaSaida([A, B], '2026-12-08', '2027-01-01')).toBe('2026-12-11');
    expect(cal.ultimaSaida([A], '2026-12-08', '2027-01-01')).toBe('2026-12-10');
    expect(cal.ultimaSaida([A, B], '2026-12-11', '2027-01-01')).toBe(null);
    expect(cal.ultimaSaida([A], '2026-12-30', '2027-01-01')).toBe('2027-01-01');
  });

  it('conta noites e soma dias atravessando mês e ano', () => {
    expect(cal.noites('2026-12-30', '2027-01-02')).toBe(3);
    expect(cal.somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(cal.somarDias('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('monta as semanas do mês de domingo a sábado', () => {
    const dez = cal.semanasDoMes(2026, 12);
    expect(dez[0]).toEqual([null, null, '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']);
    expect(dez.flat().filter(Boolean)).toHaveLength(31);
    expect(dez.every((s: unknown[]) => s.length === 7)).toBe(true);
    expect(cal.semanasDoMes(2027, 2).flat().filter(Boolean)).toHaveLength(28);
  });
});

describe('datas no fuso da Bahia', () => {
  it('o dia vira à meia-noite de Ilhéus, não à de UTC', () => {
    expect(hojeNaBahia(new Date('2026-12-01T02:30:00Z'))).toBe('2026-11-30');
    expect(hojeNaBahia(new Date('2026-12-01T03:00:00Z'))).toBe('2026-12-01');
  });
  it('soma meses sem estourar o fim do mês', () => {
    expect(somarMeses('2026-11-25', 12)).toBe('2027-11-25');
    expect(somarMeses('2027-01-31', 1)).toBe('2027-02-28');
  });
  it('lê o período do Postgres', () => {
    expect(lerPeriodo('[2026-12-01,2026-12-05)')).toEqual(['2026-12-01', '2026-12-05']);
    expect(lerPeriodo('empty')).toBe(null);
  });
});
