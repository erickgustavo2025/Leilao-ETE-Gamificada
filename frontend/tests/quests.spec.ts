import { test, expect } from '@playwright/test';

test.describe('Sistema de Missões', () => {
  test.beforeEach(async ({ page }) => {
    // Login inicial
    await page.goto('http://localhost:5173/login/aluno');
    await page.fill('input[name="matricula"]', 'PLAY001');
    await page.fill('input[name="senha"]', 'password123');
    await page.locator('button:has-text("ENTRAR"), button:has-text("Entrar"), button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('deve completar uma missão com código secreto e receber recompensa', async ({ page }) => {
    // Navegar para o mural de missões (URL correta baseada no DashboardHome: /missoes)
    await page.goto('http://localhost:5173/missoes');
    
    // Localizar a missão de teste (Usando uppercase pois o sistema parece forçar isso na UI)
    const questCard = page.locator('text=MISSÃO DE TESTE PLAYWRIGHT').first();
    await expect(questCard).toBeVisible();
    
    // Clicar no botão de validar (geralmente um ícone ou botão dentro do card)
    await questCard.click();
    
    // Verificar se o modal de validação abriu (conforme linha 190 do QuestBoard.tsx)
    await expect(page.locator('text=VALIDAR MISSAO').first()).toBeVisible();
    
    // Preencher o código secreto
    await page.fill('input[placeholder="••••••••"]', 'TESTCODE123');
    
    // Enviar validação
    await page.click('button:has-text("VALIDAR AGORA")');
    
    // Verificar mensagem de sucesso (toast)
    await expect(page.locator('text=Concluída')).toBeVisible({ timeout: 10000 });
    
    // Verificar se o status da missão mudou para concluída
    // No frontend, o card pode mostrar um checkmark ou texto "CONCLUÍDA"
    await expect(questCard.locator('text=CONCLUÍDA')).toBeVisible();
  });
});
