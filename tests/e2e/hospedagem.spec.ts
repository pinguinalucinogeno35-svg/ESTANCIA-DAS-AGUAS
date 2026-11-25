import { expect, test, type Page } from '@playwright/test';

// Depende dos dados de exemplo do seed (npm run db:reset): as noites hoje+4 e hoje+5 estão ocupadas em todas as acomodações.
function mais(iso: string, n: number) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
async function dia(page: Page, iso: string) {
  const botao = page.locator(`#ho-dias [data-dia="${iso}"]`);
  for (let i = 0; i < 3 && (await botao.count()) === 0; i++) await page.getByRole('button', { name: 'Próximo mês' }).click();
  return botao;
}

test('calendário de hospedagem: reservados em vermelho, escolha de datas e acomodações livres', async ({ page }) => {
  const erros: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(String(e)));

  const api = await page.request.get('/api/hospedagem/disponibilidade');
  expect(api.ok()).toBe(true);
  const dados = await api.json();
  expect(dados.acomodacoes).toHaveLength(4);
  // a rota não entrega nada além de nome, tipo, capacidade e períodos
  expect(Object.keys(dados.acomodacoes[0]).sort()).toEqual(['capacidade', 'id', 'nome', 'ocupado', 'tipo']);
  const hoje: string = dados.hoje;

  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('estancia-cookies-v1', '{"medicao":false}'));
  await page.reload();
  await page.evaluate(() => document.querySelector<HTMLElement>('[data-abrir="hospedagem"]')!.click());
  const dlg = page.locator('#dlg-hospedagem');
  await expect(dlg).toBeVisible();
  await expect(page.locator('#ho-calendario')).toBeVisible();
  await expect(page.locator('#ho-entrada')).toBeHidden();
  await expect(page.locator('#ho-resumo')).toHaveText('Toque no dia de entrada.');

  // dia reservado: vermelho e não clicável
  const ocupado = await dia(page, mais(hoje, 4));
  await expect(ocupado).toHaveClass(/ocupado/);
  await expect(ocupado).toHaveAttribute('aria-disabled', 'true');
  await expect(ocupado).toHaveAttribute('aria-label', /reservado/);
  const cor = await ocupado.evaluate((el) => getComputedStyle(el).backgroundColor);
  const [r, g, b] = cor.match(/\d+/g)!.map(Number);
  expect(r).toBeGreaterThan(g + 20);
  expect(r).toBeGreaterThan(b + 20);
  await ocupado.click({ force: true });
  await expect(page.locator('#ho-resumo')).toHaveText('Toque no dia de entrada.');

  // entrada e saída
  await (await dia(page, mais(hoje, 1))).click();
  await expect(page.locator('#ho-resumo')).toContainText('Agora toque no dia de saída.');
  // a noite hoje+4 está reservada em todas, mas dá para sair nesse dia; depois dele, não
  await expect(await dia(page, mais(hoje, 4))).toHaveClass(/so-saida/);
  await expect(await dia(page, mais(hoje, 5))).toHaveAttribute('aria-disabled', 'true');
  await (await dia(page, mais(hoje, 3))).click();
  await expect(page.locator('#ho-resumo')).toContainText('2 noites');
  await expect(page.locator('#ho-entrada')).toHaveValue(mais(hoje, 1));
  await expect(page.locator('#ho-saida')).toHaveValue(mais(hoje, 3));

  // só as acomodações livres nas duas noites (o Apartamento de exemplo 2 está ocupado em hoje+2)
  const opcoes = page.locator('#ho-livres .cal-opcao b');
  await expect(opcoes).toHaveText(['Chalé de exemplo 1', 'Chalé de exemplo 2', 'Apartamento de exemplo 1']);
  await page.locator('#ho-livres .cal-opcao', { hasText: 'Apartamento de exemplo 1' }).click();
  const previa = dlg.locator('[data-previa]');
  await expect(previa).toContainText('- Acomodação: Apartamento de exemplo 1');
  await expect(dlg.locator('[data-enviar]')).toHaveAttribute('href', /wa\.me\/5573991500002\?text=.*Apartamento/);

  // filtro por acomodação muda o que fica vermelho
  await page.locator('#ho-filtro').selectOption({ label: 'Chalé de exemplo 1 (até 4 pessoas)' });
  await expect(page.locator('#ho-resumo')).toHaveText('Toque no dia de entrada.');
  await expect(await dia(page, mais(hoje, 3))).toHaveClass(/ocupado/);
  await expect(await dia(page, mais(hoje, 6))).toHaveClass(/livre/);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await dlg.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(erros).toEqual([]);
});

test('sem a rota de disponibilidade, os campos de data comuns continuam funcionando', async ({ page }) => {
  await page.route('**/api/hospedagem/disponibilidade', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: '{"erro":"x"}' }));
  await page.goto('/');
  await page.evaluate(() => document.querySelector<HTMLElement>('[data-abrir="hospedagem"]')!.click());
  await expect(page.locator('#ho-entrada')).toBeVisible();
  await expect(page.locator('#ho-calendario')).toBeHidden();
});

test('a página mostra as comodidades informadas pelo cliente', async ({ page }) => {
  await page.goto('/');
  const sec = page.locator('#estrutura');
  for (const texto of ['Piscinas de água mineral', '2 toboáguas de 70 metros', 'Playground', 'Salão de jogos', 'Churrasqueira gourmet', 'Campinho de futebol', 'Quadra de vôlei', 'Ar-condicionado', 'Frigobar', 'Wifi', 'Bar e restaurante', 'Para até 600 pessoas']) {
    await expect(sec.locator('.comodidades')).toContainText(texto);
  }
});
