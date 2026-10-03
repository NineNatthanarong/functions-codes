import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { downloadBytes, openTool } from './helpers';

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => localStorage.setItem('fc-locale', 'en'));
});

test('JSON formatter formats, minifies, downloads, and rejects invalid JSON', async ({ page }) => {
  await openTool(page, 'json-formatter');
  const input = page.getByRole('textbox', { name: 'Your JSON', exact: true });
  const output = page.getByRole('textbox', { name: 'Result', exact: true });
  const value = { greeting: 'สวัสดี', values: [1, true, null] };
  await input.fill(JSON.stringify(value));
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await expect(output).toHaveValue(JSON.stringify(value, null, 2));
  await page.getByRole('button', { name: 'Minify', exact: true }).click();
  await expect(output).toHaveValue(JSON.stringify(value));
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Download', exact: true }));
  expect(JSON.parse(file.bytes.toString())).toEqual(value);
  await input.fill('{bad json');
  await expect(output).toHaveValue('');
  await expect(page.locator('main')).toContainText(/invalid|error/i);
});

test('CSV/JSON handles quoted fields, Thai, phone numbers, booleans, and round trips', async ({ page }) => {
  await openTool(page, 'csv-json');
  await page.locator('textarea').first().fill('name,phone,active,note\r\nสมชาย,0812345678,true,"hello, \"\"world\"\"\nsecond line"');
  const expected = [{ name: 'สมชาย', phone: '0812345678', active: true, note: 'hello, "world"\nsecond line' }];
  await expect.poll(async () => JSON.parse(await page.locator('textarea').nth(1).inputValue() || 'null')).toEqual(expected);
  await page.getByRole('button', { name: 'JSON → CSV', exact: true }).click();
  await page.locator('textarea').first().fill(JSON.stringify(expected));
  await expect(page.locator('textarea').nth(1)).toHaveValue(/"hello, ""world""\nsecond line"/);
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Download', exact: true }));
  expect(file.bytes.toString()).toContain('0812345678');
});

test('CSV/JSON reports malformed CSV and unsupported JSON shapes', async ({ page }) => {
  await openTool(page, 'csv-json');
  await page.locator('textarea').first().fill('name\n"unclosed');
  await expect(page.locator('main')).toContainText(/quote/i);
  await expect(page.locator('textarea').nth(1)).toHaveValue('');
  await page.getByRole('button', { name: 'JSON → CSV', exact: true }).click();
  await page.locator('textarea').first().fill('{"name":"Alice"}');
  await expect(page.locator('main')).toContainText(/array/i);
});

test('CSV/JSON preserves every column when generated headers collide or use __proto__', async ({ page }) => {
  await openTool(page, 'csv-json');
  await page.locator('textarea').first().fill('name,name,name_2,,field4,__proto__\nA,B,C,D,E,F');
  const output = page.locator('textarea').nth(1);
  await expect(output).not.toHaveValue('');
  const rows = JSON.parse(await output.inputValue());
  expect(Object.values(rows[0])).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  expect(Object.hasOwn(rows[0], '__proto__')).toBe(true);
  await page.locator('textarea').first().fill('field3,x\nA,B,C');
  await expect.poll(async () => Object.values(JSON.parse(await output.inputValue())[0])).toEqual(['A', 'B', 'C']);
});

test('Base64 preserves unicode, accepts URL-safe input, and rejects invalid input', async ({ page }) => {
  await openTool(page, 'base64-tool');
  const text = 'สวัสดี 🌍 Hello?';
  await page.locator('textarea').first().fill(text);
  await expect(page.locator('textarea').nth(1)).toHaveValue(Buffer.from(text).toString('base64'));
  await page.getByRole('button', { name: 'URL-safe (-_)', exact: true }).click();
  await expect(page.locator('textarea').nth(1)).toHaveValue(Buffer.from(text).toString('base64url'));
  await page.locator('textarea').nth(1).fill(Buffer.from('ย้อนกลับ').toString('base64url'));
  await expect(page.locator('textarea').first()).toHaveValue('ย้อนกลับ');
  await page.locator('textarea').nth(1).fill('%%%');
  await expect(page.locator('main')).toContainText('Invalid Base64');
  await page.locator('textarea').nth(1).fill('/w==');
  await expect(page.locator('main')).toContainText('not UTF-8');
});

test('Base64 file conversion downloads the original bytes', async ({ page }) => {
  await openTool(page, 'base64-tool');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  const bytes = Buffer.from([0, 1, 2, 127, 128, 255]);
  await page.locator('input[type=file]').setInputFiles({ name: 'binary.bin', mimeType: 'application/octet-stream', buffer: bytes });
  await expect(page.locator('main')).toContainText('binary.bin');
  await page.getByRole('button', { name: 'Copy Base64', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(bytes.toString('base64'));
  await page.getByPlaceholder('Paste Base64 or data:image/png;base64,... here').fill('data:application/octet-stream;base64,' + bytes.toString('base64'));
  const result = await downloadBytes(page, page.getByRole('button', { name: 'Download file', exact: true }));
  expect(result.bytes).toEqual(bytes);
});

test('Base64 file validation rejects malformed padding before download', async ({ page }) => {
  await openTool(page, 'base64-tool');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  const input = page.getByPlaceholder('Paste Base64 or data:image/png;base64,... here');
  for (const invalid of ['A=', 'AA=', 'AAAA==', '=', 'AA===']) {
    await input.fill(invalid);
    await expect(page.locator('main')).toContainText('Invalid Base64');
    await expect(page.getByRole('button', { name: 'Download file', exact: true })).toBeDisabled();
  }
  await input.fill('AQ');
  const file = await downloadBytes(page, page.getByRole('button', { name: 'Download file', exact: true }));
  expect(file.bytes).toEqual(Buffer.from([1]));
});

test('URL codec round trips Thai and supports encodeURI', async ({ page }) => {
  await openTool(page, 'url-tools');
  const text = 'https://example.com/สวัสดี?q=a b&x=1';
  await page.locator('textarea').first().fill(text);
  await expect(page.locator('textarea').nth(1)).toHaveValue(encodeURIComponent(text));
  await page.getByRole('button', { name: 'encodeURI', exact: true }).click();
  await expect(page.locator('textarea').nth(1)).toHaveValue(encodeURI(text));
  await page.locator('textarea').nth(1).fill(encodeURI('https://example.com/ไทย'));
  await expect(page.locator('textarea').first()).toHaveValue('https://example.com/ไทย');
  await page.locator('textarea').nth(1).fill('%E0%');
  await expect(page.locator('main')).toContainText(/invalid|cannot|could not/i);
});

test('URL inspector preserves duplicate query keys and fragments when editing', async ({ page }) => {
  await openTool(page, 'url-tools');
  await page.getByRole('button', { name: 'URL Inspector', exact: true }).click();
  await page.locator('main input').first().fill('https://example.com:8443/a?tag=one&tag=two#section');
  await expect(page.locator('main')).toContainText('8443');
  await expect(page.locator('main input')).toHaveCount(5);
  await page.locator('main input').nth(4).fill('ไทย');
  await page.getByRole('button', { name: 'Copy URL', exact: true }).click();
  const result = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  expect(result.searchParams.getAll('tag')).toEqual(['one', 'ไทย']);
  expect(result.hash).toBe('#section');
});

test('JWT decodes unicode, strips Bearer, and shows expiry without verifying signatures', async ({ page }) => {
  await openTool(page, 'jwt-decoder');
  const payload = { sub: 'สมชาย', exp: 1, iat: 0, role: 'tester' };
  const token = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') + '.' + Buffer.from(JSON.stringify(payload)).toString('base64url') + '.c2ln';
  await page.locator('textarea').fill('  Bearer ' + token + '  ');
  await expect(page.locator('main')).toContainText('สมชาย');
  await expect(page.locator('main')).toContainText(/expired/i);
  await expect(page.locator('main')).toContainText('NOT verified');
  await page.locator('textarea').fill('not-a-token');
  await expect(page.locator('main')).toContainText(/three|3 parts|invalid/i);
});

for (const source of ['text', 'file'] as const) {
  test(`Hash generator matches all five reference digests for ${source}`, async ({ page }) => {
    await openTool(page, 'hash-generator');
    const text = 'abc สวัสดี 🌍';
    if (source === 'text') await page.locator('textarea').fill(text);
    else {
      await page.getByRole('button', { name: 'File', exact: true }).click();
      await page.locator('input[type=file]').setInputFiles({ name: 'hash.txt', mimeType: 'text/plain', buffer: Buffer.from(text) });
    }
    for (const algorithm of ['md5', 'sha1', 'sha256', 'sha384', 'sha512']) {
      await expect(page.locator('main')).toContainText(createHash(algorithm).update(text).digest('hex'));
    }
    await page.getByPlaceholder('Paste an expected hash', { exact: false }).fill(createHash('sha256').update(text).digest('hex').toUpperCase());
    await expect(page.locator('main')).toContainText(/match.*SHA-256/i);
  });
}

for (const version of ['v4', 'v7']) {
  test(`UUID ${version} generates 500 unique valid IDs and downloads them`, async ({ page }) => {
    await openTool(page, 'uuid-generator');
    await page.getByRole('button', { name: `UUID ${version}`, exact: true }).click();
    await page.getByRole('button', { name: '500', exact: true }).click();
    const file = await downloadBytes(page, page.getByRole('button', { name: 'Download .txt', exact: true }));
    const ids = file.bytes.toString().trim().split('\n');
    expect(ids).toHaveLength(500); expect(new Set(ids).size).toBe(500);
    const pattern = new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-${version.slice(1)}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`);
    ids.forEach(id => expect(id).toMatch(pattern));
    if (version === 'v7') {
      const now = Date.now();
      ids.forEach(id => expect(Math.abs(parseInt(id.replace(/-/g, '').slice(0, 12), 16) - now)).toBeLessThan(10_000));
    }
  });
}

test('Regex tester matches groups, replaces text, rejects syntax, and stops catastrophic backtracking', async ({ page }) => {
  await openTool(page, 'regex-tester');
  await page.getByRole('textbox', { name: 'Regex pattern', exact: true }).fill('(\\w+)@(\\w+)\\.com');
  await page.locator('#regex-test-string').fill('alice@example.com bob@test.com');
  await expect(page.locator('mark')).toHaveCount(2);
  await page.getByPlaceholder('e.g. $1 or $<name>').fill('$1');
  await expect(page.locator('main')).toContainText('alice bob');
  await page.locator('main').getByRole('button', { name: 'Copy', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('alice bob');
  await page.getByRole('textbox', { name: 'Regex pattern', exact: true }).fill('[');
  await expect(page.locator('main')).toContainText('Invalid');
  await page.getByRole('textbox', { name: 'Regex pattern', exact: true }).fill('(a+)+$');
  await page.locator('#regex-test-string').fill('a'.repeat(60) + '!');
  await expect(page.locator('main')).toContainText(/too long|timed out|timeout/i);
});

test('Timestamp converts seconds, milliseconds, zero, negative epochs, and local dates', async ({ page }) => {
  await openTool(page, 'timestamp-converter');
  const input = page.getByPlaceholder('Paste a timestamp, e.g. 1720000000');
  for (const [value, iso] of [['0', '1970-01-01T00:00:00.000Z'], ['-1', '1969-12-31T23:59:59.000Z'], ['1700000000', '2023-11-14T22:13:20.000Z'], ['1700000000000', '2023-11-14T22:13:20.000Z']]) {
    await input.fill(value); await expect(page.locator('main')).toContainText(iso);
  }
  await page.locator('input[type=datetime-local]').fill('1970-01-01T07:00');
  await expect(page.getByRole('button', { name: 'Copy: Unix — seconds', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Copy: Unix — seconds', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('0');
  await input.fill('invalid'); await expect(page.locator('main')).toContainText('Cannot read');
  await input.fill('999999999999999999'); await expect(page.locator('main')).toContainText('outside');
});

test('Password generation guarantees selected classes, length, exclusions, and clipboard', async ({ page }) => {
  await openTool(page, 'password-generator');
  const password = page.getByTitle('Click to copy', { exact: true });
  for (const length of [4, 16, 64]) {
    await page.locator('input[type=number]').fill(String(length));
    await expect(password).toHaveText(new RegExp(`^.{${length}}$`));
    const value = await password.innerText();
    expect(value).toMatch(/[A-Z]/); expect(value).toMatch(/[a-z]/);
    expect(value).toMatch(/[0-9]/); expect(value).toMatch(/[^A-Za-z0-9]/);
  }
  await page.getByLabel('Exclude ambiguous (0, O, l, 1, I)', { exact: true }).check();
  await expect(password).not.toHaveText(/[0Ol1I|]/);
  await password.click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await password.innerText());
  for (const option of ['Uppercase (A-Z)', 'Lowercase (a-z)', 'Numbers (0-9)']) await page.getByLabel(option, { exact: true }).uncheck();
  await expect(password).toHaveText(/^[^A-Za-z0-9]+$/);
  await page.getByLabel('Symbols (!@#$)', { exact: true }).click();
  await expect(page.getByLabel('Symbols (!@#$)', { exact: true })).toBeChecked();
});

test('Thai keyboard auto-detects and reverses Kedmanee text', async ({ page }) => {
  await openTool(page, 'thai-keyboard');
  await page.locator('textarea').fill('l;ylfu');
  await expect(page.locator('main')).toContainText('สวัสดี');
  await page.getByRole('button', { name: 'Copy result', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('สวัสดี');
  await page.getByRole('button', { name: 'Swap', exact: true }).click();
  await expect(page.locator('textarea')).toHaveValue('สวัสดี');
  await page.getByRole('button', { name: 'Copy result', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('l;ylfu');
});

test('Text case converts all ten styles and preserves Thai', async ({ page }) => {
  await openTool(page, 'text-case');
  await page.locator('textarea').fill('helloWorld_example-test');
  for (const result of ['HELLOWORLD_EXAMPLE-TEST', 'helloworld_example-test', 'Hello World Example Test', 'Hello world example test', 'helloWorldExampleTest', 'HelloWorldExampleTest', 'hello_world_example_test', 'hello-world-example-test', 'HELLO_WORLD_EXAMPLE_TEST', 'hello.world.example.test']) {
    await expect(page.locator('main').getByText(result, { exact: true })).toBeVisible();
  }
  await page.locator('textarea').fill('สวัสดี โลก');
  await expect(page.locator('main')).toContainText('สวัสดี_โลก');
});

test('Word counter counts text, unicode characters, Thai words, and limits', async ({ page }) => {
  await openTool(page, 'word-counter');
  await page.locator('textarea').fill('Hello world.\nHello again!');
  await expect(page.locator('main')).toContainText(/Words\s*4/);
  await expect(page.locator('main')).toContainText(/Sentences\s*2/);
  await expect(page.locator('main')).toContainText(/Paragraphs\s*2/);
  await page.locator('textarea').fill('🌍');
  await expect(page.locator('main')).toContainText(/Characters\s*1/);
  await page.locator('textarea').fill('สวัสดีชาวโลก');
  await expect(page.locator('main')).toContainText(/Words\s*3/);
  await page.locator('textarea').fill('a'.repeat(281));
  await expect(page.locator('main')).toContainText(/over.*1|1.*over/);
});

test('Diff viewer distinguishes insertions and deletions in all modes and swaps inputs', async ({ page }) => {
  await openTool(page, 'diff-viewer');
  await page.locator('#diff-old-text').fill('Hello world\nold line');
  await page.locator('#diff-new-text').fill('Hello earth\nnew line');
  for (const mode of ['Characters', 'Words', 'Lines']) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    await expect(page.locator('main')).toContainText('Difference');
    await expect(page.locator('main')).not.toContainText('No differences to show.');
    await page.locator('main').getByRole('button', { name: 'Copy', exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('earth');
  }
  await page.getByRole('button', { name: 'Swap', exact: true }).click();
  await expect(page.locator('#diff-old-text')).toHaveValue('Hello earth\nnew line');
});

test('CSS unit converter calculates both directions and reports invalid bases', async ({ page }) => {
  await openTool(page, 'unit-converter');
  await page.getByRole('spinbutton', { name: 'Pixels', exact: true }).fill('32');
  await expect(page.getByRole('spinbutton', { name: 'REM', exact: true })).toHaveValue('2');
  await expect(page.locator('main')).toContainText('200.0%');
  await page.locator('#base-size-input').fill('20');
  await expect(page.getByRole('spinbutton', { name: 'REM', exact: true })).toHaveValue('1.6');
  await page.getByRole('spinbutton', { name: 'REM', exact: true }).fill('3');
  await expect(page.getByRole('spinbutton', { name: 'Pixels', exact: true })).toHaveValue('60');
  await page.locator('#base-size-input').fill('0');
  await expect(page.locator('main')).toContainText('greater than 0');
});

test('Lorem generator returns the requested words, sentences, and paragraphs', async ({ page }) => {
  await openTool(page, 'lorem-ipsum');
  await page.locator('input[type=number]').fill('5');
  for (const type of ['Words', 'Sentences', 'Paragraphs']) {
    await page.getByRole('button', { name: type, exact: true }).click();
    await page.getByRole('button', { name: 'Generate text', exact: true }).click();
    await page.getByRole('button', { name: /Copy/, exact: false }).first().click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    const chunks = type === 'Words' ? text.split(/\s+/) : type === 'Sentences' ? text.match(/[^.!?]+[.!?]+/g)! : text.split('\n\n');
    expect(chunks).toHaveLength(5);
  }
});

test('Markdown renders safely, exports MD/HTML/PDF, and restores saved edits', async ({ page }) => {
  await openTool(page, 'markdown-editor');
  const markdown = '# Audit document\n\n**Bold** and *italic*.\n\n<script>alert(1)</script>\n\n| A | B |\n|---|---|\n| 1 | 2 |';
  await page.locator('#markdown-input').fill(markdown);
  await expect(page.locator('#markdown-preview strong')).toHaveText('Bold');
  await expect(page.locator('#markdown-preview script')).toHaveCount(0);
  await expect(page.locator('#markdown-preview table')).toBeVisible();
  const md = await downloadBytes(page, page.getByRole('button', { name: '.md', exact: true }));
  expect(md.bytes.toString()).toBe(markdown);
  const html = await downloadBytes(page, page.getByRole('button', { name: 'HTML', exact: true }));
  expect(html.bytes.toString()).toContain('<strong>Bold</strong>');
  expect(html.bytes.toString()).not.toContain('<script>');
  const pdf = await downloadBytes(page, page.getByRole('button', { name: 'PDF', exact: true }));
  expect((await PDFDocument.load(pdf.bytes)).getPageCount()).toBeGreaterThan(0);
  await page.waitForTimeout(5200);
  await page.reload();
  await expect(page.locator('#markdown-input')).toHaveValue(markdown);
});

test('Random picker exhausts a no-repeat list and resets it', async ({ page }) => {
  await openTool(page, 'random-picker');
  await page.locator('textarea').fill('Alice\nBob\nสมชาย');
  await page.getByLabel('No repeats', { exact: true }).check();
  const winners: string[] = [];
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Pick one', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Copy winner', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Copy winner', exact: true }).click();
    winners.push(await page.evaluate(() => navigator.clipboard.readText()));
  }
  expect(new Set(winners).size).toBe(3);
  await expect(page.locator('main')).toContainText('Everyone has been picked.');
  await page.getByRole('button', { name: 'Start a new round', exact: true }).click();
  await expect(page.locator('main')).toContainText('3 of 3 remaining');
});

test('Spin wheel points at the displayed winner and persists/removes entries', async ({ page }) => {
  await openTool(page, 'spin-wheel');
  await page.evaluate(() => { const values = [0, 0.25]; Math.random = () => values.shift() ?? 0; });
  await page.getByRole('button', { name: 'Spin the wheel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove winner from wheel', exact: true })).toBeVisible();
  const angle = await page.locator('[style*="conic-gradient"]').evaluate(el => {
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return ((Math.atan2(matrix.b, matrix.a) * 180 / Math.PI) + 360) % 360;
  });
  const indexUnderPointer = Math.floor(((360 - angle) % 360) / 60);
  expect(indexUnderPointer).toBe(0); // Math.random selects Alice, the first segment.
  await page.getByRole('button', { name: 'Remove winner from wheel', exact: true }).click();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('spin-wheel-items')!))).not.toContain('Alice');
  await page.reload();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('spin-wheel-items')!))).toHaveLength(5);
});
