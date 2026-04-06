import { test, expect } from '@playwright/test';

test.describe('Sistema de Loja', () => {
  test.beforeEach(async ({ page }) => {
    // Login inicial
    await page.goto('http://localhost:5173/login/aluno');
    await page.fill('input[name="matricula"]', 'PLAY001');
    await page.fill('input[name="senha"]', 'password123');
    await page.locator('button:has-text("ENTRAR"), button:has-text("Entrar"), button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('deve comprar um item na loja e deduzir saldo', async ({ page }) => {
    // Pegar saldo inicial
    const saldoInicialText = await page.locator('text=PC$').first().textContent();
    const saldoInicial = parseInt(saldoInicialText?.replace(/[^0-9]/g, '') || '0');
    
    // Navegar para a loja (URL correta baseada no DashboardHome: /loja)
    await page.goto('http://localhost:5173/loja');
    
    // Localizar o item de teste
    const itemCard = page.locator('text=ITEM DE TESTE PLAYWRIGHT').first();
    await expect(itemCard).toBeVisible();
    
    // Clicar no botão de comprar
    await itemCard.locator('button:has-text("COMPRAR")').click();
    
    // Confirmar compra no modal/toast se necessário
    // Baseado no código, parece que o clique no botão já inicia a compra ou abre um modal.
    // Vamos assumir que abre um modal de confirmação.
    const confirmButton = page.locator('button:has-text("CONFIRMAR COMPRA")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
    }
    
    // Verificar mensagem de sucesso (toast)
    await expect(page.locator('text=sucesso')).toBeVisible();
    
    // Verificar se o saldo foi deduzido (50 PC$)
    const saldoFinalText = await page.locator('text=PC$').first().textContent();
    const saldoFinal = parseInt(saldoFinalText?.replace(/[^0-9]/g, '') || '0');
    
    expect(saldoFinal).toBe(saldoInicial - 50);
    
    // Verificar se o item aparece no inventário (Mochila)
    await page.goto('http://localhost:5173/mochila');
    await expect(page.locator('text=ITEM DE TESTE PLAYWRIGHT')).toBeVisible();
  });
});
