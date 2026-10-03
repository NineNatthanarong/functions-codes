import { test, expect } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import jsQR from 'jsqr';
import { imageFile, inspectImage, openTool, downloadBytes, pdfFile, audioFile, withExif } from './helpers';

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => localStorage.setItem('fc-locale', 'en'));
});

for (const format of ['png', 'jpeg', 'webp']) {
  test(`File converter exports valid ${format} with correct dimensions and transparency`, async ({ page }) => {
    await openTool(page, 'file-converter');
    await page.locator('input[type=file]').setInputFiles(await imageFile(page, { transparent: true }));
    await page.locator('#target-format').selectOption(`image/${format}`);
    await page.getByRole('button', { name: 'Convert all', exact: true }).click();
    const file = await downloadBytes(page, page.getByRole('button', { name: 'Download', exact: true }));
    const image = await inspectImage(page, file.bytes, `image/${format}`, [[0, 0], [50, 50]]);
    expect(image.width).toBe(200); expect(image.height).toBe(100);
    if (format === 'jpeg') {
      image.pixels[0].slice(0, 3).forEach(c => expect(c).toBeGreaterThan(240));
      expect(image.pixels[0][3]).toBe(255);
    } else expect(image.pixels[0]).toEqual([0, 0, 0, 0]);
    expect(image.pixels[1][0]).toBeGreaterThan(240);
  });
}

test('File converter renders every PDF page into a ZIP of images', async ({ page }) => {
  await openTool(page, 'file-converter');
  await page.locator('input[type=file]').setInputFiles(await pdfFile());
  await page.getByRole('button', { name: 'Convert all', exact: true }).click();
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Download', exact: true }));
  const zip = await JSZip.loadAsync(file.bytes);
  expect(Object.keys(zip.files)).toEqual(['fixture_page_1.png', 'fixture_page_2.png']);
  for (const [name, width, height] of [['fixture_page_1.png', 400, 200], ['fixture_page_2.png', 600, 300]] as const) {
    const image = await inspectImage(page, await zip.file(name)!.async('nodebuffer'), 'image/png');
    expect([image.width, image.height]).toEqual([width, height]);
  }
});

test('File converter decodes a real HEIC image', async ({ page }) => {
  await openTool(page, 'file-converter');
  await page.locator('input[type=file]').setInputFiles('tests/fixtures/colors.heic');
  await page.getByRole('button', { name: 'Convert all', exact: true }).click();
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Download', exact: true }));
  const image = await inspectImage(page, file.bytes, 'image/png', [[50, 50], [150, 50]]);
  expect([image.width, image.height]).toEqual([200, 100]);
  expect(image.pixels[0][0]).toBeGreaterThan(230);
  expect(image.pixels[1][2]).toBeGreaterThan(230);
});

test('Background remover basic mode clears white pixels and keeps the subject', async ({ page }) => {
  await openTool(page, 'bgrm');
  await page.locator('input[type=file]').setInputFiles(await imageFile(page));
  await page.getByRole('button', { name: 'Remove background', exact: true }).click();
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Download PNG', exact: true }));
  const image = await inspectImage(page, file.bytes, 'image/png', [[0, 0], [50, 50], [150, 50]]);
  expect(image.pixels).toEqual([[0, 0, 0, 0], [255, 0, 0, 255], [0, 0, 255, 255]]);
});

test('Cropper crops a square, resizes, rotates, flips, and exports pixels correctly', async ({ page }) => {
  await openTool(page, 'image-cropper');
  await page.locator('input[type=file]').setInputFiles(await imageFile(page));
  await page.getByRole('button', { name: '1:1', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Width (px)', exact: true })).toHaveValue('100');
  await expect(page.getByRole('spinbutton', { name: 'Height (px)', exact: true })).toHaveValue('100');
  await page.getByRole('spinbutton', { name: 'Width (px)', exact: true }).fill('50');
  await page.getByRole('spinbutton', { name: 'Height (px)', exact: true }).fill('50');
  let file = await downloadBytes(page, page.getByRole('button', { name: 'Download', exact: true }));
  expect(await inspectImage(page, file.bytes, 'image/png', [[25, 25]])).toEqual({ width: 50, height: 50, pixels: [[255, 0, 0, 255]] });
  await page.getByRole('button', { name: 'Free', exact: true }).click();
  await page.getByRole('button', { name: 'Reset crop', exact: true }).click();
  await page.getByRole('button', { name: 'Rotate', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Width (px)', exact: true })).toHaveValue('100');
  await expect(page.getByRole('spinbutton', { name: 'Height (px)', exact: true })).toHaveValue('200');
  file = await downloadBytes(page, page.getByRole('button', { name: 'Download', exact: true }));
  expect((await inspectImage(page, file.bytes, 'image/png', [[50, 50], [50, 150]])).pixels).toEqual([[255, 0, 0, 255], [0, 0, 255, 255]]);
  await page.getByRole('button', { name: 'Flip horizontally', exact: true }).click();
  file = await downloadBytes(page, page.getByRole('button', { name: 'Download', exact: true }));
  expect((await inspectImage(page, file.bytes, 'image/png', [[50, 50], [50, 150]])).pixels).toEqual([[0, 0, 255, 255], [255, 0, 0, 255]]);
});

test('Image compressor applies dimension settings and outputs a smaller decodable image', async ({ page }) => {
  await openTool(page, 'image-compressor');
  await page.locator('input[type=number]').nth(1).fill('100');
  const input = await imageFile(page);
  await page.locator('input[type=file]').setInputFiles(input);
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Download', exact: true }));
  const image = await inspectImage(page, file.bytes, 'image/png');
  expect([image.width, image.height]).toEqual([100, 50]);
  expect(file.bytes.length).toBeLessThan(input.buffer.length);
});

test('EXIF stripper detects camera data and removes it from the exported JPEG', async ({ page }) => {
  await openTool(page, 'exif-stripper');
  const source = await imageFile(page, { mime: 'image/jpeg' });
  await page.locator('input[type=file]').setInputFiles({ ...source, buffer: withExif(source.buffer) });
  await expect(page.locator('main')).toContainText('AuditCamera');
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Strip & download', exact: true }));
  expect(file.bytes.includes(Buffer.from('Exif'))).toBe(false);
  expect(file.bytes.includes(Buffer.from('AuditCamera'))).toBe(false);
  const image = await inspectImage(page, file.bytes, 'image/jpeg');
  expect([image.width, image.height]).toEqual([200, 100]);
});

test('EXIF stripper preserves transparency in PNG exports', async ({ page }) => {
  await openTool(page, 'exif-stripper');
  await page.locator('input[type=file]').setInputFiles(await imageFile(page, { transparent: true }));
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Strip & download', exact: true }));
  expect(file.name).toMatch(/\.png$/);
  expect((await inspectImage(page, file.bytes, 'image/png', [[0, 0]])).pixels[0][3]).toBe(0);
});

test('Watermark stamper modifies the exported image and preserves its dimensions', async ({ page }) => {
  await openTool(page, 'watermark');
  const source = await imageFile(page);
  await page.locator('input[type=file]').setInputFiles(source);
  await page.getByRole('textbox', { name: 'Watermark text', exact: true }).fill('AUDIT');
  await page.getByRole('button', { name: 'Center', exact: true }).click();
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Download watermarked image', exact: true }));
  expect(file.bytes).not.toEqual(source.buffer);
  const image = await inspectImage(page, file.bytes, 'image/png');
  expect([image.width, image.height]).toEqual([200, 100]);
  await page.getByRole('textbox', { name: 'Watermark text', exact: true }).fill('');
  const plain = await downloadBytes(page, page.getByRole('button', { name: 'Download watermarked image', exact: true }));
  const originalPixels = await inspectImage(page, source.buffer, 'image/png', [[50, 50], [150, 50]]);
  expect(await inspectImage(page, plain.bytes, 'image/png', [[50, 50], [150, 50]])).toEqual(originalPixels);
});

test('Color picker reads exact pixels and copies their HEX value', async ({ page }) => {
  await openTool(page, 'color-picker');
  await page.locator('input[type=file]').setInputFiles(await imageFile(page));
  const canvas = page.locator('main canvas');
  await expect.poll(() => canvas.evaluate(el => (el as HTMLCanvasElement).width)).toBe(200);
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: box.width / 4, y: box.height / 2 } });
  await expect(page.locator('main')).toContainText('#FF0000');
  await page.getByRole('button', { name: /HEX.*#FF0000/i }).click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).toLowerCase()).toBe('#ff0000');
});

test('Color converter matches RGB/HSL/OKLCH and builds valid gradients', async ({ page }) => {
  await openTool(page, 'color-tools');
  await page.getByRole('textbox', { name: 'HEX', exact: true }).fill('#ff0000');
  await page.getByRole('textbox', { name: 'HEX', exact: true }).press('Enter');
  await expect(page.locator('main')).toContainText('rgb(255, 0, 0)');
  await expect(page.locator('main')).toContainText('hsl(0, 100%, 50%)');
  await expect(page.locator('main')).toContainText('oklch(0.628 0.258 29.2)');
  await page.getByRole('spinbutton', { name: 'RGB G', exact: true }).fill('255');
  await expect(page.getByRole('textbox', { name: 'HEX', exact: true })).toHaveValue('#FFFF00');
  await page.getByRole('button', { name: 'Gradient', exact: true }).click();
  for (const type of ['Linear', 'Radial', 'Conic']) {
    await page.getByRole('button', { name: type, exact: true }).click();
    await page.getByRole('button', { name: 'Copy CSS', exact: true }).click();
    const css = await page.evaluate(() => navigator.clipboard.readText());
    expect(css).toContain(type.toLowerCase() + '-gradient(');
    expect(await page.evaluate(css => CSS.supports('background', css.replace(/^background:\s*/, '').replace(/;$/, '')), css)).toBe(true);
  }
});

test('Color palette extracts and copies five colors from an image', async ({ page }) => {
  await openTool(page, 'color-palette');
  await page.locator('input[type=file]').setInputFiles(await imageFile(page, { palette: true }));
  await expect(page.getByRole('button', { name: /Copy color #/ })).toHaveCount(6);
  await page.getByRole('button', { name: 'Copy all', exact: true }).click();
  const colors = (await page.evaluate(() => navigator.clipboard.readText())).match(/#[0-9A-F]{6}/gi)!;
  expect(colors).toHaveLength(5); expect(new Set(colors).size).toBe(5);
});

test('QR generator exports a decodable PNG and handles oversized content', async ({ page }) => {
  await openTool(page, 'qr-generator');
  await page.locator('textarea').fill('example.com');
  await expect(page.locator('main')).toContainText('https:// will be added');
  await page.getByRole('button', { name: '512', exact: true }).click();
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Download PNG', exact: true }));
  const image = await inspectImage(page, file.bytes, 'image/png');
  expect([image.width, image.height]).toEqual([512, 512]);
  const rgba = await page.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
    return Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
  }, file.bytes.toString('base64'));
  expect(jsQR(new Uint8ClampedArray(rgba), 512, 512)?.data).toBe('https://example.com');
  await page.locator('textarea').fill('a'.repeat(5000));
  await expect(page.locator('main')).toContainText('Content is too long');
});

test('PDF merge respects file order and produces all pages', async ({ page }) => {
  await openTool(page, 'pdf-tools');
  await page.locator('input[type=file]').setInputFiles([await pdfFile('first.pdf'), await pdfFile('second.pdf', [[400, 200]])]);
  await expect(page.locator('main')).toContainText('second.pdf');
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Merge PDFs', exact: true }));
  const doc = await PDFDocument.load(file.bytes);
  expect(doc.getPages().map(p => p.getWidth())).toEqual([200, 300, 400]);
});

test('PDF split renders thumbnails and exports only selected pages', async ({ page }) => {
  await openTool(page, 'pdf-tools');
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles(await pdfFile());
  const second = page.getByRole('button', { name: 'Page 2', exact: true });
  await expect(second.locator('img')).toBeVisible();
  await second.click();
  const file = await downloadBytes(page, page.getByRole('button', { name: /Split PDF|Extract/i }).last());
  const doc = await PDFDocument.load(file.bytes);
  expect(doc.getPageCount()).toBe(1); expect(doc.getPage(0).getWidth()).toBe(300);
});

test('PDF compression reduces an unoptimized fixture without losing pages', async ({ page }) => {
  await openTool(page, 'pdf-tools');
  await page.getByRole('button', { name: 'Compress', exact: true }).click();
  const input = await pdfFile();
  await page.locator('input[type=file]').setInputFiles(input);
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Compress PDF', exact: true }));
  expect(file.bytes.length).toBeLessThan(input.buffer.length);
  expect((await PDFDocument.load(file.bytes)).getPageCount()).toBe(2);
});

test('Audio editor plays, pauses, selects, and exports an accurate WAV trim', async ({ page }) => {
  await openTool(page, 'audio-editor');
  await page.locator('input[type=file]').setInputFiles(audioFile());
  await expect(page.getByRole('button', { name: 'Add selection', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Add selection', exact: true }).click();
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Trim & download', exact: true }));
  expect(file.bytes.subarray(0, 4).toString()).toBe('RIFF');
  expect(file.bytes.subarray(8, 12).toString()).toBe('WAVE');
  expect(file.bytes.readUInt16LE(22)).toBe(1);
  const sampleRate = file.bytes.readUInt32LE(24), channels = file.bytes.readUInt16LE(22);
  expect((file.bytes.length - 44) / (sampleRate * channels * 2)).toBeCloseTo(2 / 3, 3);
});
