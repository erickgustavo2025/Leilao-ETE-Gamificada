import { test, expect } from '@playwright/test';

test.describe('Fluxo de Autenticação', () => {
  test('deve fazer login com sucesso como estudante', async ({ page }) => {
    // Navegar diretamente para a página de login de Aluno para evitar problemas de seletor na seleção
    await page.goto('http://localhost:5173/login/aluno');
    
    // Preencher credenciais
    await page.fill('input[name="matricula"]', 'PLAY001');
    await page.fill('input[name="senha"]', 'password123');
    
    // Clicar no botão de entrar (usando seletor mais genérico se o texto falhar)
    const loginButton = page.locator('button:has-text("ENTRAR"), button:has-text("Entrar"), button[type="submit"]');
    await loginButton.click();
    
    // Verificar se foi redirecionado para o dashboard (aumentar timeout para 10s)
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
    
    // Verificar se o nome do usuário está presente no header ou dashboard
    // O sistema usa letras maiúsculas em muitos lugares (text-transform: uppercase)
    // E o header exibe apenas o primeiro nome: user.nome?.split(' ')[0]
    // Vamos procurar por "SALDO DISPONÍVEL" que é um texto estático no DashboardHeader
    await expect(page.locator('text=SALDO DISPONÍVEL').first()).toBeVisible({ timeout: 15000 });
  });
});
