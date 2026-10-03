import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const slugs = [...readFileSync('lib/tools.ts', 'utf8').matchAll(/slug: '([^']+)'/g)].map(m => m[1]);

for (const locale of ['en', 'th'] as const) {
  for (const slug of slugs) {
    test(`${slug}: ${locale === 'en' ? 'English desktop' : 'Thai mobile'} renders without errors or overflow`, async ({ page }) => {
      await page.setViewportSize(locale === 'en' ? { width: 1280, height: 900 } : { width: 390, height: 844 });
      await page.addInitScript(locale => localStorage.setItem('fc-locale', locale), locale);
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(e.message));
      const response = await page.goto(`/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('main h1').first()).toBeVisible();
      await expect(page.locator('main')).not.toContainText('undefined');
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }
}
