import { test, expect } from '@playwright/test';

test.describe('Interação com Oráculo de IA', () => {
  test.beforeEach(async ({ page }) => {
    // Login inicial
    await page.goto('http://localhost:5173/login/aluno');
    await page.fill('input[name="matricula"]', 'PLAY001');
    await page.fill('input[name="senha"]', 'password123');
    await page.locator('button:has-text("ENTRAR"), button:has-text("Entrar"), button[type="submit"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('deve enviar uma pergunta ao Oráculo e receber resposta', async ({ page }) => {
    // Abrir o widget do Oráculo
    const aiWidgetButton = page.locator('button[aria-label="Abrir Oráculo"], .ai-widget-button').first();
    await aiWidgetButton.click();
    
    // Verificar se o widget abriu
    await expect(page.locator('text=ORÁCULO GIL')).toBeVisible();
    
    // Enviar uma pergunta
    const inputField = page.locator('input[placeholder*="Pergunte ao Oráculo"], textarea[placeholder*="Pergunte ao Oráculo"]').first();
    await inputField.fill('Olá Oráculo, quem é você?');
    await page.keyboard.press('Enter');
    
    // Verificar se a pergunta aparece no chat
    await expect(page.locator('text=Olá Oráculo, quem é você?')).toBeVisible();
    
    // Aguardar resposta (pode levar alguns segundos devido ao backoff e processamento)
    // Procuramos por um balão de chat da IA (classe 'ai-message' ou similar)
    const aiResponse = page.locator('.ai-message, .assistant-message, div:has-text("Oráculo")').last();
    await expect(aiResponse).toBeVisible({ timeout: 60000 }); // 60s timeout para dar tempo ao backoff
    
    // Verificar se a resposta não está vazia
    const responseText = await aiResponse.textContent();
    expect(responseText?.length).toBeGreaterThan(10);
    
    // Verificar se a conversa foi salva no histórico
    // Abrir histórico se necessário
    const historyButton = page.locator('button[aria-label="Ver Histórico"], .history-button').first();
    if (await historyButton.isVisible()) {
        await historyButton.click();
        await expect(page.locator('text=Olá Oráculo, quem é você?')).toBeVisible();
    }
  });
});
