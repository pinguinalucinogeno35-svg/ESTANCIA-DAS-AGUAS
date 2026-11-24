import { expect, test, type Page } from '@playwright/test';
import { DONO, PORTARIA, prepararAdmins } from './preparo';

test.beforeAll(() => prepararAdmins());

async function entrar(page: Page, u: { email: string; senha: string }) {
  await page.goto('/admin/login');
  await page.getByLabel('E-mail').fill(u.email);
  await page.getByLabel('Senha').fill(u.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
}
function abas(page: Page) {
  return page.locator('nav.abas:visible a');
}
function vigiarConsole(page: Page) {
  const erros: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(String(e)));
  return erros;
}

test('sem login, qualquer tela do administrador leva para a entrada', async ({ page }) => {
  for (const caminho of ['/admin', '/admin/hoje', '/admin/ajustes', '/admin/pedidos']) {
    await page.goto(caminho);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
});

test('senha errada mostra erro e não entra', async ({ page }) => {
  await entrar(page, { email: DONO.email, senha: 'senha-errada-qualquer' });
  await expect(page.locator('p.erro[role="alert"]')).toContainText('E-mail ou senha incorretos.');
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test('dono entra, vê as cinco telas e sai', async ({ page }) => {
  const erros = vigiarConsole(page);
  await entrar(page, DONO);
  await expect(page).toHaveURL(/\/admin\/hoje$/);
  await expect(abas(page)).toHaveText(['Hoje', 'Agenda', 'Pedidos', 'Portaria', 'Ajustes']);
  await expect(page.getByText(DONO.nome)).toBeVisible();
  for (const [rotulo, caminho] of [['Agenda', 'agenda'], ['Pedidos', 'pedidos'], ['Portaria', 'portaria'], ['Ajustes', 'ajustes']]) {
    await abas(page).filter({ hasText: rotulo }).click();
    await expect(page).toHaveURL(new RegExp('/admin/' + caminho + '$'));
    await expect(page.getByRole('heading', { level: 1, name: rotulo })).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Sair do aplicativo' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto('/admin/hoje');
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(erros).toEqual([]);
});

test('portaria vê só Hoje e Portaria e é barrada nas outras telas', async ({ page }) => {
  await entrar(page, PORTARIA);
  await expect(page).toHaveURL(/\/admin\/hoje$/);
  await expect(abas(page)).toHaveText(['Hoje', 'Portaria']);
  for (const caminho of ['agenda', 'pedidos', 'ajustes']) {
    await page.goto('/admin/' + caminho);
    await expect(page).toHaveURL(/\/admin\/hoje$/);
  }
  await page.goto('/admin/portaria');
  await expect(page.getByRole('heading', { level: 1, name: 'Portaria' })).toBeVisible();
});

test('navegação por teclado na entrada, com foco visível', async ({ page }) => {
  await page.goto('/admin/login');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('E-mail')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Senha')).toBeFocused();
  await page.keyboard.press('Tab');
  const botao = page.getByRole('button', { name: 'Entrar' });
  await expect(botao).toBeFocused();
  expect(await botao.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
});
