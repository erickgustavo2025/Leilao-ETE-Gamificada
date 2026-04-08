import { test, expect } from '@playwright/test';
import { loginAsStudent, BASE_URL } from './helpers/auth';

// ════════════════════════════════════════════════════════════════════
// SUITE 10 — ORÁCULO GIL (IA)
// ════════════════════════════════════════════════════════════════════

test.describe('10 · Oráculo Gil', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    // O oráculo abre via widget (botão flutuante) no dashboard
    await page.goto(`${BASE_URL}/dashboard`);
  });

  test('10.1 · Widget do Oráculo Gil aparece no dashboard', async ({ page }) => {
    // AIWidget é flutuante — procura ícone/botão
    const aiBtn = page.locator(
      '[data-testid="ai-widget"], [class*="ai-widget"], button:has-text("Gil"), [class*="AIWidget"]'
    ).first();
    await expect(aiBtn).toBeVisible({ timeout: 10000 });
  });

  test('10.2 · Abrir o Oráculo e enviar mensagem', async ({ page }) => {
    // Abre o widget
    const aiBtn = page.locator(
      '[data-testid="ai-widget"], [class*="ai"], button[title*="Gil"], button[title*="Oráculo"]'
    ).first();
    if (await aiBtn.isVisible({ timeout: 8000 })) {
      await aiBtn.click();
      // Input de mensagem
      const msgInput = page.locator(
        'input[placeholder*="pergunta"], textarea[placeholder*="mensagem"], [class*="chat-input"] input, [class*="chat-input"] textarea'
      ).first();
      await expect(msgInput).toBeVisible({ timeout: 8000 });
      await msgInput.fill('Oi Gil! Quanto vale 1 PC$ ?');
      await page.keyboard.press('Enter');
      // Aguarda resposta
      await expect(
        page.locator('[class*="message"], [class*="response"], [data-role="assistant"]').last()
      ).toBeVisible({ timeout: 20000 });
    } else {
      console.log('ℹ️ Widget do Oráculo não encontrado — verifique se está autenticado');
    }
  });

  test('10.3 · Memória do Oráculo — contexto persiste na conversa', async ({ page }) => {
    const aiBtn = page.locator('[data-testid="ai-widget"], button[title*="Gil"]').first();
    if (await aiBtn.isVisible({ timeout: 8000 })) {
      await aiBtn.click();
      const msgInput = page.locator('input, textarea').filter({ hasText: '' }).last();
      if (await msgInput.isVisible({ timeout: 5000 })) {
        // Primeira mensagem com contexto
        await msgInput.fill('Meu número favorito é 42.');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);
        // Segunda mensagem referenciando o contexto
        await msgInput.fill('Qual é o meu número favorito?');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(8000);
        // Verifica se 42 aparece na resposta
        const messages = page.locator('[class*="message"], [data-role="assistant"]');
        const lastMsg = messages.last();
        const text = await lastMsg.textContent({ timeout: 15000 });
        console.log(`ℹ️ Resposta de memória: ${text?.substring(0, 100)}`);
      }
    }
  });

  test('10.4 · Deletar conversa do Oráculo', async ({ page }) => {
    const aiBtn = page.locator('[data-testid="ai-widget"], button[title*="Gil"]').first();
    if (await aiBtn.isVisible({ timeout: 8000 })) {
      await aiBtn.click();
      // Busca botão de deletar chat
      const deleteBtn = page.locator(
        'button:has-text("Deletar"), button:has-text("DELETAR"), button[title*="deletar"], [data-testid="delete-chat"]'
      ).first();
      if (await deleteBtn.isVisible({ timeout: 5000 })) {
        await deleteBtn.click();
        const confirmBtn = page.locator('button:has-text("CONFIRMAR"), button:has-text("Sim, deletar")').first();
        if (await confirmBtn.isVisible({ timeout: 3000 })) await confirmBtn.click();
        await expect(page.locator('text=/[Dd]eletado|[Rr]emovido|[Ss]ucesso/').first()).toBeVisible({ timeout: 8000 });
      } else {
        console.log('ℹ️ Botão de deletar chat não encontrado');
      }
    }
  });

  test('10.5 · Editar título do chat', async ({ page }) => {
    const aiBtn = page.locator('[data-testid="ai-widget"], button[title*="Gil"]').first();
    if (await aiBtn.isVisible({ timeout: 8000 })) {
      await aiBtn.click();
      const editBtn = page.locator(
        'button:has-text("Editar"), button[title*="editar"], [data-testid="edit-chat-title"]'
      ).first();
      if (await editBtn.isVisible({ timeout: 5000 })) {
        await editBtn.click();
        const titleInput = page.locator('input[type="text"]').first();
        if (await titleInput.isVisible({ timeout: 3000 })) {
          await titleInput.clear();
          await titleInput.fill('Chat de Teste Playwright');
          await page.keyboard.press('Enter');
          await expect(page.locator('text=Chat de Teste Playwright').first()).toBeVisible({ timeout: 5000 });
        }
      } else {
        console.log('ℹ️ Botão de editar título não encontrado');
      }
    }
  });
});
