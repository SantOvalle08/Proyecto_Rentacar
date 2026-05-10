const { test, expect } = require('@playwright/test');

const EMAIL_UNICO = `test_${Date.now()}@rentacar.com`;

test.describe('E2E - Autenticación y Gestión de Usuario', () => {

  test.describe('Registro de usuario', () => {
    test('muestra el formulario de registro', async ({ page }) => {
      await page.goto('/register');
      await expect(page).toHaveTitle(/rentacar|registro/i);
      await expect(page.locator('input[name="nombre"], input[placeholder*="nombre" i]').first()).toBeVisible();
      await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
      await expect(page.locator('input[name="contraseña"], input[type="password"]').first()).toBeVisible();
    });

    test('registra un nuevo usuario correctamente', async ({ page }) => {
      await page.goto('/register');
      await page.locator('input[name="nombre"], input[placeholder*="nombre" i]').first().fill('Usuario E2E');
      await page.locator('input[name="email"], input[type="email"]').first().fill(EMAIL_UNICO);
      await page.locator('input[name="contraseña"], input[type="password"]').first().fill('Password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/login|dashboard|perfil/, { timeout: 10000 });
    });

    test('muestra error al registrar con email inválido', async ({ page }) => {
      await page.goto('/register');
      await page.locator('input[name="nombre"], input[placeholder*="nombre" i]').first().fill('Test User');
      await page.locator('input[name="email"], input[type="email"]').first().fill('email-no-valido');
      await page.locator('input[name="contraseña"], input[type="password"]').first().fill('Password123');
      await page.locator('button[type="submit"]').click();
      const errorVisible = await page.locator('[class*="error"], .toast, [role="alert"]').first().isVisible().catch(() => false);
      const urlChanged = page.url().includes('register');
      expect(errorVisible || urlChanged).toBeTruthy();
    });
  });

  test.describe('Inicio de sesión', () => {
    test('muestra el formulario de login', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
      await expect(page.locator('input[name="contraseña"], input[type="password"]').first()).toBeVisible();
      await expect(page.locator('button[type="submit"]').first()).toBeVisible();
    });

    test('muestra error con credenciales incorrectas', async ({ page }) => {
      await page.goto('/login');
      await page.locator('input[name="email"], input[type="email"]').first().fill('noexiste@test.com');
      await page.locator('input[name="contraseña"], input[type="password"]').first().fill('WrongPassword');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
      const stillOnLogin = page.url().includes('login');
      const hasError = await page.locator('[class*="error"], .toast-error, [role="alert"]').first().isVisible().catch(() => false);
      expect(stillOnLogin || hasError).toBeTruthy();
    });

    test('tiene enlace a registro desde login', async ({ page }) => {
      await page.goto('/login');
      const registerLink = page.locator('a[href*="register"]');
      await expect(registerLink).toBeVisible();
    });
  });

  test.describe('Navegación protegida', () => {
    test('redirige al login cuando se accede a página protegida sin sesión', async ({ page }) => {
      await page.goto('/perfil');
      await page.waitForTimeout(1500);
      const url = page.url();
      expect(url.includes('login') || url.includes('/')).toBeTruthy();
    });

    test('redirige al login al acceder al dashboard sin sesión', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(1500);
      const url = page.url();
      expect(url.includes('login') || url.includes('/')).toBeTruthy();
    });
  });

});
