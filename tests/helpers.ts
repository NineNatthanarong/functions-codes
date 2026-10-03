import { expect, type Page, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function openTool(page: Page, slug: string) {
  const response = await page.goto(`/${slug}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main h1').first()).toBeVisible();
}

export async function downloadBytes(page: Page, button: Locator) {
  const pending = page.waitForEvent('download');
  await button.click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  expect(path).toBeTruthy();
  return { name: download.suggestedFilename(), bytes: await readFile(path!) };
}

export async function imageFile(page: Page, options: { mime?: string; transparent?: boolean; palette?: boolean } = {}) {
  const mime = options.mime || 'image/png';
  const b64 = await page.evaluate(({ mime, transparent, palette }) => {
    const canvas = document.createElement('canvas');
    canvas.width = 200; canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    if (!transparent) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 200, 100); }
    if (palette) {
      ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#ff00ff'].forEach((color, i) => {
        ctx.fillStyle = color; ctx.fillRect(i * 40, 0, 40, 100);
      });
    } else {
      ctx.fillStyle = '#ff0000'; ctx.fillRect(10, 10, 80, 80);
      ctx.fillStyle = '#0000ff'; ctx.fillRect(110, 10, 80, 80);
    }
    return canvas.toDataURL(mime, 0.95).split(',')[1];
  }, { mime, transparent: !!options.transparent, palette: !!options.palette });
  return { name: `fixture.${mime.split('/')[1]}`, mimeType: mime, buffer: Buffer.from(b64, 'base64') };
}

export async function inspectImage(page: Page, bytes: Buffer, mime: string, points: [number, number][] = []) {
  return page.evaluate(async ({ b64, mime, points }) => {
    const img = new Image();
    img.src = `data:${mime};base64,${b64}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return { width: canvas.width, height: canvas.height,
      pixels: points.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data)) };
  }, { b64: bytes.toString('base64'), mime, points });
}

export async function pdfFile(name = 'fixture.pdf', sizes: [number, number][] = [[200, 100], [300, 150]]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  sizes.forEach(([width, height], i) => {
    const page = doc.addPage([width, height]);
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
    page.drawText(`Page ${i + 1}`, { x: 20, y: 40, font, size: 14, color: rgb(1, 0, 0) });
  });
  doc.setTitle('Test PDF');
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save({ useObjectStreams: false })) };
}

export function audioFile() {
  const sampleRate = 8000, samples = sampleRate * 2;
  const b = Buffer.alloc(44 + samples * 2);
  b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22); b.writeUInt32LE(sampleRate, 24);
  b.writeUInt32LE(sampleRate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) b.writeInt16LE(Math.round(Math.sin(i * 2 * Math.PI * 440 / sampleRate) * 16000), 44 + i * 2);
  return { name: 'tone.wav', mimeType: 'audio/wav', buffer: b };
}

export function withExif(jpeg: Buffer) {
  const camera = Buffer.from('AuditCamera\0');
  const tiff = Buffer.alloc(26 + camera.length);
  tiff.write('II'); tiff.writeUInt16LE(42, 2); tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(1, 8); tiff.writeUInt16LE(0x010f, 10);
  tiff.writeUInt16LE(2, 12); tiff.writeUInt32LE(camera.length, 14);
  tiff.writeUInt32LE(26, 18); camera.copy(tiff, 26);
  const payload = Buffer.concat([Buffer.from('Exif\0\0'), tiff]);
  const segment = Buffer.alloc(4); segment.writeUInt16BE(0xffe1); segment.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([jpeg.subarray(0, 2), segment, payload, jpeg.subarray(2)]);
}
