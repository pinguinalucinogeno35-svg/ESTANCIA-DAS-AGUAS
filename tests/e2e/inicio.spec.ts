import { expect, test } from '@playwright/test';

test('página inicial abre na raiz, sem erros no console e sem terceiros', async ({ page }) => {
  const erros: string[] = [];
  const externos: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(String(e)));
  page.on('request', (r) => { const u = new URL(r.url()); if (u.protocol.startsWith('http') && u.hostname !== '127.0.0.1') externos.push(r.url()); });
  page.on('response', (r) => { if (r.status() >= 400) erros.push(r.status() + ' ' + r.url()); });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seu dia de parque aquático em Ilhéus');
  await expect(page.locator('html')).toHaveClass(/com-gsap/);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('800 20px "Plus Jakarta Sans"'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // rola a página inteira para disparar o passeio e as imagens das seções
  const altura = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < altura; y += 600) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
  await expect(page.locator('#tabela-precos tbody tr')).toHaveCount(3);

  // os diálogos de pedido continuam abrindo
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator('.topo [data-abrir="dayuse"]').click();
  await expect(page.locator('#dlg-dayuse')).toBeVisible();

  expect(externos).toEqual([]);
  expect(erros).toEqual([]);
});
