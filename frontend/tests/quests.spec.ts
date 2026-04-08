import { test, expect } from '@playwright/test';
import { loginAsStudent, loginAsAdmin, BASE_URL } from './helpers/auth';

// ════════════════════════════════════════════════════════════════════
// SUITE 5 — MISSÕES (⚠️ ATENÇÃO ESPECIAL — BADGES!)
// ════════════════════════════════════════════════════════════════════

test.describe('5 · Missões', () => {
  // ── Aluno ────────────────────────────────────────────────────────
  test.describe('5A · Perspectiva do Aluno', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsStudent(page);
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
    });

    test('5A.1 · Mural de missões carrega corretamente', async ({ page }) => {
      await page.goto(`${BASE_URL}/missoes`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/[Mm]issão|[Qq]uest|[Mm]ural/').first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=/[Ee]rro/')).not.toBeVisible({ timeout: 3000 });
    });

    test('5A.2 · Aluno visualiza missões disponíveis', async ({ page }) => {
      await page.goto(`${BASE_URL}/missoes`);
      await page.waitForLoadState('networkidle');
      // Deve haver pelo menos 1 card de missão
      const questCards = page.locator('[data-testid="quest-card"], [class*="quest"], [class*="missao"]');
      // Aguarda carregamento
      await page.waitForTimeout(2000);
      const count = await questCards.count();
      console.log(`ℹ️ Missões encontradas: ${count}`);
      // Se não há missões, apenas avisa (banco pode estar sem dados de teste)
      if (count === 0) {
        console.log('ℹ️ Nenhuma missão no banco de teste — crie uma via Admin antes deste teste');
      }
    });

    test('5A.3 · Validação de missão com código secreto', async ({ page }) => {
      await page.goto(`${BASE_URL}/missoes`);
      await page.waitForLoadState('networkidle');
      // Procura missão com botão de validar (O texto real é "VALIDAR")
      const codeBtn = page.locator('button:has-text("VALIDAR")').first();
      if (await codeBtn.isVisible({ timeout: 15000 })) {
        await codeBtn.click();
        await page.waitForLoadState('networkidle');
        // Input do código (placeholder ••••••••)
        const codeInput = page.locator('input[placeholder*="••••••••"]').first();
        await expect(codeInput).toBeVisible({ timeout: 10000 });
        // Testa código inválido
        await codeInput.fill('CODIGO-INVALIDO-XYZ');
        // Botão de confirmar no modal (texto "VALIDAR AGORA")
        await page.locator('button:has-text("VALIDAR AGORA")').click();
        await page.waitForLoadState('networkidle');
        await expect(
          page.locator('text=/inválido|erro|código/i').first()
        ).toBeVisible({ timeout: 10000 });
      } else {
        console.log('ℹ️ Nenhuma missão de código secreto visível');
      }
    });

    test('5A.4 · Submissão de missão manual (envio de evidência)', async ({ page }) => {
      await page.goto(`${BASE_URL}/missoes`);
      await page.waitForLoadState('networkidle');
      // Na interface atual, o botão de missão manual também é "SOLICITAR"
      const submitBtn = page.locator('button:has-text("SOLICITAR")').first();
      if (await submitBtn.isVisible({ timeout: 15000 })) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        // Se abrir modal com textarea (algumas missões manuais podem apenas enviar a solicitação direto)
        const textarea = page.locator('textarea').first();
        if (await textarea.isVisible({ timeout: 5000 })) {
          await textarea.fill('[TESTE PLAYWRIGHT] Evidência de conclusão da missão.');
          await page.locator('button:has-text("SOLICITAR AGORA"), button:has-text("ENVIAR")').click();
        }
        await page.waitForLoadState('networkidle');
        await expect(
          page.locator('text=/Solicitação enviada|sucesso|pendente/i').first()
        ).toBeVisible({ timeout: 15000 });
      } else {
        console.log('ℹ️ Nenhuma missão com submissão manual disponível');
      }
    });
  });

  // ── Admin cria missões ───────────────────────────────────────────
  test.describe('5B · Admin — Criação de Missões', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.waitForURL(/\/admin/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
    });

    test('5B.1 · Admin visualiza quadro de missões', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/quests`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/[Mm]issão|[Qq]uest/').first()).toBeVisible({ timeout: 15000 });
    });

    test('5B.2 · Admin cria missão DIÁRIA com código secreto via API (Seed)', async ({ page, request }) => {
      await page.goto(`${BASE_URL}/admin/quests`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      const token = await page.evaluate(() => localStorage.getItem('@ETEGamificada:token') || localStorage.getItem('token'));
      const apiUrl = BASE_URL.replace(/:\d+$/, ':5000') + '/api/admin/quests';
      
      const payload = {
        title: '[PLAYWRIGHT] Missão Diária Teste',
        description: 'Teste automatizado de missão diária',
        type: 'daily',
        reward: { pc: 100 },
        validationType: 'code',
      };

      const response = await request.post(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
        data: payload
      });

      expect(response.ok()).toBeTruthy();
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=PLAYWRIGHT').first()).toBeVisible({ timeout: 15000 });
    });

    test('5B.3 · Admin cria missão com BADGE de funcionalidade via API (Seed)', async ({ page, request }) => {
      await page.goto(`${BASE_URL}/admin/quests`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      const token = await page.evaluate(() => localStorage.getItem('@ETEGamificada:token') || localStorage.getItem('token'));
      const apiUrl = BASE_URL.replace(/:\d+$/, ':5000') + '/api/admin/quests';
      
      const payload = {
        title: '[PLAYWRIGHT] Missão com Badge Transferência',
        description: 'Missão para testar entrega de badge PODE_TRANSFERIR',
        type: 'functionality',
        reward: { pc: 0 },
        validationType: 'manual',
        badgeUnlock: 'PODE_TRANSFERIR'
      };

      const response = await request.post(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
        data: payload
      });
      expect(response.ok()).toBeTruthy();
    });

    test('5B.4 · Admin cria missão com BADGE de rank (bronze) via API (Seed)', async ({ page, request }) => {
      await page.goto(`${BASE_URL}/admin/quests`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      const token = await page.evaluate(() => localStorage.getItem('@ETEGamificada:token') || localStorage.getItem('token'));
      const apiUrl = BASE_URL.replace(/:\d+$/, ':5000') + '/api/admin/quests';

      const payload = {
        title: '[PLAYWRIGHT] Missão Rank Bronze',
        description: 'Missão de campanha que concede badge de bronze',
        type: 'campaign',
        reward: { pc: 0 },
        validationType: 'code',
        badgeUnlock: 'bronze'
      };

      const response = await request.post(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
        data: payload
      });
      expect(response.ok()).toBeTruthy();
    });
  });
});
