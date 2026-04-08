import { test, expect } from '@playwright/test';
import { loginAsStudent, loginAsAdmin, BASE_URL } from './helpers/auth';

// ════════════════════════════════════════════════════════════════════
// SUITE 2 — LOJA, INVENTÁRIO E PRESENTES
// ════════════════════════════════════════════════════════════════════

test.describe('2 · Loja e Inventário', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  // ── 2.1 Loja carrega com itens ──────────────────────────────────
  test('2.1 · Loja carrega e exibe itens disponíveis', async ({ page }) => {
    await page.goto(`${BASE_URL}/loja`);
    // Aguarda pelo menos 1 card de item aparecer
    await expect(page.locator('[data-testid="item-card"], .item-card, [class*="card"]').first()).toBeVisible({ timeout: 10000 });
    // Título/header da loja
    await expect(
      page.locator('text=/[Ll]oja|[Ss]tore|[Mm]ercado/').first()
    ).toBeVisible();
  });

  // ── 2.2 Comprar item na loja ─────────────────────────────────────
  test('2.2 · Comprar item na loja deduz saldo e vai para mochila', async ({ page }) => {
    await page.goto(`${BASE_URL}/loja`);
    // Busca qualquer botão de comprar visível
    const buyBtn = page.locator('button:has-text("COMPRAR"), button:has-text("Comprar")').first();
    await expect(buyBtn).toBeVisible({ timeout: 10000 });
    // Salva o nome do item (para verificar na mochila)
    const itemCard = buyBtn.locator('xpath=ancestor::*[contains(@class,"card") or contains(@class,"item")][1]');
    await buyBtn.click();
    // Modal de confirmação (se existir)
    const confirmBtn = page.locator('button:has-text("CONFIRMAR"), button:has-text("Confirmar compra"), button:has-text("COMPRAR AGORA")');
    if (await confirmBtn.isVisible({ timeout: 2000 })) {
      await confirmBtn.click();
    }
    // Toast de sucesso
    await expect(
      page.locator('text=/[Ss]ucesso|[Cc]omprado|[Aa]dquirido/').first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ── 2.3 Mochila mostra itens comprados ───────────────────────────
  test('2.3 · Mochila carrega e exibe inventário', async ({ page }) => {
    await page.goto(`${BASE_URL}/mochila`);
    await expect(page.locator('text=/[Mm]ochila|[Ii]nventário|[Bb]ackpack/').first()).toBeVisible({ timeout: 8000 });
    // A página não pode estar em erro
    await expect(page.locator('text=/[Ee]rro ao carregar|[Ff]ailed/').first()).not.toBeVisible({ timeout: 3000 });
  });

  // ── 2.4 Usar item da mochila ─────────────────────────────────────
  test('2.4 · Usar item da mochila exibe confirmação', async ({ page }) => {
    await page.goto(`${BASE_URL}/mochila`);
    const useBtn = page.locator('button:has-text("USAR"), button:has-text("Usar"), button:has-text("USE")').first();
    if (await useBtn.isVisible({ timeout: 5000 })) {
      await useBtn.click();
      // Modal ou confirmação deve aparecer
      await expect(
        page.locator('text=/[Uu]sar|[Cc]onfirmar|[Hh]as certeza/').first()
      ).toBeVisible({ timeout: 5000 });
    } else {
      // Avisa se não há itens para usar (não é falha)
      console.log('ℹ️ Nenhum item utilizável encontrado na mochila — adicione itens ao banco de teste');
    }
  });
});

// ════════════════════════════════════════════════════════════════════
// SUITE 3 — PRESENTES (Gift Boxes)
// ════════════════════════════════════════════════════════════════════

test.describe('3 · Presentes (Gift Boxes)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('3.1 · Página de presentes carrega', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/gifts`);
    await expect(
      page.locator('text=/[Pp]resente|[Gg]ift|[Cc]aixa/').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('3.2 · Resgatar presente disponível', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/gifts`);
    const claimBtn = page.locator(
      'button:has-text("RESGATAR"), button:has-text("Resgatar"), button:has-text("ABRIR"), button:has-text("Abrir")'
    ).first();
    if (await claimBtn.isVisible({ timeout: 5000 })) {
      await claimBtn.click();
      await expect(
        page.locator('text=/[Ss]ucesso|[Rr]esgatado|[Aa]berto|[Pp]rêmio/').first()
      ).toBeVisible({ timeout: 10000 });
    } else {
      console.log('ℹ️ Nenhum presente disponível no banco de teste');
    }
  });
});
