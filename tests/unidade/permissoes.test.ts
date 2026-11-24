import { describe, expect, it } from 'vitest';
import { podeVer, telaInicial, telasDe, TELAS } from '@/lib/permissoes';

describe('permissões dos perfis', () => {
  it('dono vê todas as telas', () => {
    expect(telasDe('dono').map((t) => t.id)).toEqual(['hoje', 'agenda', 'pedidos', 'portaria', 'ajustes']);
  });
  it('portaria vê só Hoje e Portaria', () => {
    expect(telasDe('portaria').map((t) => t.id)).toEqual(['hoje', 'portaria']);
    for (const tela of ['agenda', 'pedidos', 'ajustes'] as const) expect(podeVer('portaria', tela)).toBe(false);
  });
  it('sem perfil não vê nada', () => {
    for (const t of TELAS) {
      expect(podeVer(null, t.id)).toBe(false);
      expect(podeVer(undefined, t.id)).toBe(false);
    }
  });
  it('a tela inicial dos dois perfis é Hoje', () => {
    expect(telaInicial('dono')).toBe('hoje');
    expect(telaInicial('portaria')).toBe('hoje');
  });
});
