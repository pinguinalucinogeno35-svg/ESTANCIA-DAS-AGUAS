import { execFileSync } from 'node:child_process';

export const DONO = { email: 'dono.e2e@teste.invalid', senha: 'senha-de-teste-dono-1', nome: 'Dona Teste' };
export const PORTARIA = { email: 'portaria.e2e@teste.invalid', senha: 'senha-de-teste-portaria-1', nome: 'Portaria Teste' };

let feito = false;
// Cria (ou atualiza) os dois administradores de teste no banco local, pelo mesmo script do README.
export function prepararAdmins() {
  if (feito) return;
  for (const [u, papel] of [[DONO, 'dono'], [PORTARIA, 'portaria']] as const) {
    execFileSync('node', ['--env-file=.env.local', 'scripts/criar-admin.mjs', u.email, u.nome, papel], {
      env: { ...process.env, ADMIN_SENHA: u.senha },
      stdio: 'pipe',
    });
  }
  feito = true;
}
