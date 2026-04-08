import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // ── Execução sequencial (testes compartilham estado no banco) ──
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1, // 1 retry para flakiness de rede/animação
  workers: 1, // 1 worker = serial = mais estável para banco compartilhado

  // ── Reporter ──────────────────────────────────────────────────
  reporter: [['html', { open: 'never' }], ['list']],

  // ── Configurações globais ─────────────────────────────────────
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Timeouts globais
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },

  // Timeout por teste (60s para maior estabilidade)
  timeout: 60_000,
  expect: { timeout: 15_000 },

  // ── Projetos ──────────────────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile Chrome — usado pelos testes de responsividade
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/chats_devmode_responsive.spec.ts',
    },
  ],

  // ── NÃO sobe webServer automaticamente ───────────────────────
  // Suba o app manualmente com `npm run dev` antes de rodar os testes
  // webServer: { ... }
});
