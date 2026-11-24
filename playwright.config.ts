import { defineConfig } from '@playwright/test';

// Pré-requisitos: banco local no ar (npm run db:start) e .env.local preenchido.
// O servidor é o de produção (next build + next start), na porta 3100.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:3100', locale: 'pt-BR', timezoneId: 'America/Bahia' },
  projects: [
    { name: 'celular-390', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: 'computador-1440', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'npm run build && npx next start -p 3100',
    url: 'http://127.0.0.1:3100/admin/login',
    reuseExistingServer: true,
    timeout: 240000,
  },
});
