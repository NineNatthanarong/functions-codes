import { test, expect } from '@playwright/test';
import { imageFile, inspectImage, openTool, downloadBytes } from './helpers';

test('AI background remover loads the real model and exports a transparent PNG', async ({ page }) => {
  test.skip(process.env.RUN_NETWORK_TESTS !== '1', 'Set RUN_NETWORK_TESTS=1 to download and run the real AI model.');
  test.setTimeout(180_000);
  await page.addInitScript(() => localStorage.setItem('fc-locale', 'en'));
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await openTool(page, 'bgrm');
  await page.locator('input[type=file]').setInputFiles(await imageFile(page));
  const aiMode = page.getByRole('checkbox', { name: 'AI mode', exact: true });
  await aiMode.locator('..').click();
  await expect(aiMode).toBeChecked();
  await page.getByRole('button', { name: 'Remove background', exact: true }).click();
  const download = page.getByRole('button', { name: 'Download PNG', exact: true });
  try {
    await expect(download).toBeEnabled({ timeout: 120_000 });
  } catch (error) {
    await test.info().attach('AI errors', { body: errors.join('\n'), contentType: 'text/plain' });
    throw error;
  }
  const file = await downloadBytes(page, download);
  const image = await inspectImage(page, file.bytes, 'image/png', [[0, 0]]);
  expect([image.width, image.height]).toEqual([200, 100]);
  expect(image.pixels[0][3]).toBeLessThan(30);
});
