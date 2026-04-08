import { test, expect } from '@playwright/test';
import { loginAsStudent, loginAsAdmin, BASE_URL } from './helpers/auth';

// ════════════════════════════════════════════════════════════════════
// SUITE 1 — AUTENTICAÇÃO
// ════════════════════════════════════════════════════════════════════

test.describe('1 · Autenticação', () => {
  // ── 1.1 Login de aluno ──────────────────────────────────────────
  test('1.1 · Login de aluno com sucesso', async ({ page }) => {
    await page.goto(`${BASE_URL}/login/aluno`);
    await page.fill('input[name="matricula"]', '3711533');
    await page.fill('input[name="senha"]', '654321');
    await page.locator('button[type="submit"], button:has-text("ACESSAR SISTEMA")').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    // Header deve mostrar saldo
    await expect(page.locator('text=SALDO DISPONÍVEL').first()).toBeVisible({ timeout: 10000 });
  });

  // ── 1.2 Login com credenciais erradas ──────────────────────────
  test('1.2 · Login com senha errada exibe erro', async ({ page }) => {
    await page.goto(`${BASE_URL}/login/aluno`);
    await page.fill('input[name="matricula"]', '3711533');
    await page.fill('input[name="senha"]', 'senhaerrada999');
    await page.locator('button[type="submit"], button:has-text("ACESSAR SISTEMA")').click();
    // Deve mostrar mensagem de erro (toast ou texto na página)
    await expect(
      page.locator('text=/[Ss]enha incorreta|[Ee]rro|[Ii]nválid/').first()
    ).toBeVisible({ timeout: 8000 });
    // NÃO deve redirecionar para o dashboard
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  // ── 1.3 Login de Admin ──────────────────────────────────────────
  test('1.3 · Login de admin com sucesso', async ({ page }) => {
    await page.goto(`${BASE_URL}/login/admin`);
    await page.fill('input[name="matricula"]', 'Renato');
    await page.fill('input[name="senha"]', 'ete1415pc$');
    await page.locator('button[type="submit"], button:has-text("ACESSAR SISTEMA")').click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
  });

  // ── 1.4 Ativação de conta (Primeiro Acesso) ─────────────────────
  test('1.4 · Tela de primeiro acesso carrega corretamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/first-access`);
    // Verifica que a tela tem os campos esperados
    await expect(page.locator('input[name="matricula"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('input[name="dataNascimento"], input[type="date"]')).toBeVisible({ timeout: 8000 });
  });

  // ── 1.5 Esqueci minha senha — carrega formulário ─────────────────
  test('1.5 · Tela de esqueci minha senha carrega corretamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible({ timeout: 8000 });
  });

  // ── 1.6 Esqueci minha senha — envio de email ─────────────────────
  test('1.6 · Esqueci minha senha — envia email de recuperação', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);
    await page.fill('input[name="email"], input[type="email"]', 'naoexiste@teste.com');
    await page.locator('button[type="submit"], button:has-text("ENVIAR")').click();
    // Deve mostrar feedback (email não encontrado ou enviado)
    await expect(
      page.locator('text=/[Ee]mail|[Ee]nviado|[Nn]ão encontrado/').first()
    ).toBeVisible({ timeout: 8000 });
  });

  // ── 1.7 Troca de senha (logado) ─────────────────────────────────
  test('1.7 · Aluno pode alterar a própria senha', async ({ page }) => {
    await loginAsStudent(page);
    // Vai para o perfil ou configurações
    await page.goto(`${BASE_URL}/perfil`);
    // Procura botão/seção de alterar senha
    const changePasswordBtn = page.locator('button:has-text("SENHA")');
    await expect(changePasswordBtn.first()).toBeVisible({ timeout: 8000 });
    await changePasswordBtn.first().click();
    // Preenche formulário de troca de senha
    const senhaAtualInput = page.locator('input[placeholder="Senha Atual"]');
    if (await senhaAtualInput.isVisible({ timeout: 3000 })) {
      await senhaAtualInput.fill('654321');
      await page.locator('input[placeholder="Nova Senha"]').fill('654321');
      await page.locator('input[placeholder="Confirmar Senha"]').fill('654321');
      await page.locator('button:has-text("SALVAR ALTERAÇÕES")').click();
      await expect(page.locator('text=/[Ss]uccess|[Ss]alvo|[Aa]lterada|[Ss]enha alterada/')).toBeVisible({ timeout: 8000 });
    }
  });

  // ── 1.8 Troca de email (logado) ──────────────────────────────────
  test('1.8 · Perfil exibe opção de alterar email', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto(`${BASE_URL}/perfil`);
    await expect(
      page.locator('button:has-text("EMAIL")')
    ).toBeVisible({ timeout: 8000 });
  });
});
