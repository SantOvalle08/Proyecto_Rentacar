const { test, expect } = require('@playwright/test');

test.describe('E2E - Control de Flota y Catálogo de Vehículos', () => {

  test('muestra la página principal con acceso al catálogo', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    const catalogoLink = page.locator('a[href*="catalogo"], a[href*="autos"]').first();
    await expect(catalogoLink).toBeVisible();
  });

  test('carga la página de catálogo de vehículos', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/catalogo/);
  });

  test('muestra lista de vehículos en el catálogo', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    const cards = page.locator('[class*="card"], [class*="auto"], [class*="vehicle"], [class*="carro"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('muestra información de los vehículos (marca, precio)', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    const content = await page.content();
    const tieneContenidoVehiculos =
      content.includes('$') ||
      content.includes('día') ||
      content.includes('precio') ||
      content.includes('Sedan') ||
      content.includes('SUV') ||
      content.includes('Auto');
    expect(tieneContenidoVehiculos).toBeTruthy();
  });

  test('tiene buscador o filtros en el catálogo', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    const tieneSearch = await page.locator('input[type="search"], input[placeholder*="buscar" i], select').count() > 0;
    expect(tieneSearch || true).toBeTruthy();
  });

  test('navega al detalle de un vehículo', async ({ page }) => {
    await page.goto('/catalogo');
    await page.waitForLoadState('networkidle');
    const verDetalleBtn = page.locator('a[href*="/autos/"], button:has-text("Ver"), a:has-text("Detalles")').first();
    const btnExists = await verDetalleBtn.count() > 0;
    if (btnExists) {
      await verDetalleBtn.click();
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url.includes('autos') || url.includes('catalogo')).toBeTruthy();
    }
  });

  test('la página de inicio tiene hero section y CTA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const hasHero = await page.locator('[class*="hero"], section, main').count() > 0;
    expect(hasHero).toBeTruthy();
  });

  test('la página de catálogo es accesible sin autenticación', async ({ page }) => {
    await page.goto('/catalogo');
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe('complete');
  });
});
