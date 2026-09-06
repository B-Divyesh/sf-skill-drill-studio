import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const origin = process.argv[2] ?? 'https://skill-drill-studio.sociobot.in';
const evidenceDirectory = process.argv[3] ?? '/work/.evidence';
await mkdir(evidenceDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const result = { origin, checkedAt: new Date().toISOString(), desktop: {}, phone: {}, routes: {} };

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requests = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));

  await page.goto(`${origin}/?cold=repair-2-${Date.now()}`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('h1').innerText(), 'Create short browser practice drills');
  assert.match(await page.locator('.hero-copy').innerText(), /teachers, instructors, and self-learners/i);
  assert.equal(await page.getByRole('link', { name: 'Try it with sample data' }).isVisible(), true);
  assert.equal(await page.locator('.hero-facts li').count(), 3);
  const homeAxe = await new AxeBuilder({ page }).analyze();
  const homeSerious = homeAxe.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''));
  assert.deepEqual(homeSerious, []);
  await page.evaluate(() => {
    localStorage.setItem('skill-drill-library', 'live-real-library-sentinel');
    localStorage.setItem('skill-drill-runs', 'live-real-runs-sentinel');
  });
  await page.screenshot({ path: `${evidenceDirectory}/live-home-desktop.png`, fullPage: true });

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  assert.equal(new URL(page.url()).pathname, '/demo');
  assert.equal(await page.getByText('Demo — sample data, nothing is saved', { exact: true }).isVisible(), true);
  assert.equal(await page.locator('.shelf-item').count(), 3);
  assert.deepEqual(await page.locator('.demo-summary dd').allTextContents(), ['3', '3', '2']);
  const demoAxe = await new AxeBuilder({ page }).analyze();
  const demoSerious = demoAxe.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''));
  assert.deepEqual(demoSerious, []);
  await page.locator('[data-play="demo-command"]').first().click();
  assert.equal(await page.getByText('Demo — sample data, nothing is saved', { exact: true }).isVisible(), true);
  await page.getByLabel('Your answer').fill('mkdir incorrect');
  await page.getByRole('button', { name: 'Check command' }).click();
  assert.match(await page.locator('#feedback').innerText(), /not an exact match/i);
  await page.getByLabel('Your answer').fill('mkdir field-notes');
  await page.getByRole('button', { name: 'Check command' }).click();
  assert.equal(await page.getByRole('heading', { name: 'Correct answer' }).isVisible(), true);
  assert.equal(await page.evaluate(() => localStorage.getItem('skill-drill-library')), 'live-real-library-sentinel');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('demo:skill-drill-runs') ?? '[]').length), 3);
  await page.screenshot({ path: `${evidenceDirectory}/live-demo-complete-desktop.png`, fullPage: true });
  await page.getByRole('button', { name: 'Reset demo' }).click();
  assert.deepEqual(await page.locator('.demo-summary dd').allTextContents(), ['3', '3', '2']);
  await page.getByRole('button', { name: 'Start for real' }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem('demo:skill-drill-library')), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('skill-drill-library')), 'live-real-library-sentinel');

  result.desktop = {
    heading: 'Create short browser practice drills',
    demoSamples: 3,
    demoResetRuns: 2,
    realStorageUnchanged: true,
    axeSeriousOrCritical: homeSerious.length + demoSerious.length,
    consoleErrors,
    pageErrors,
    externalRequests: requests.filter((url) => new URL(url).origin !== origin)
  };
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(result.desktop.externalRequests, []);
  await desktop.close();

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const phonePage = await phone.newPage();
  const phoneConsoleErrors = [];
  phonePage.on('console', (message) => { if (message.type() === 'error') phoneConsoleErrors.push(message.text()); });
  await phonePage.goto(`${origin}/?cold=phone-${Date.now()}`, { waitUntil: 'networkidle' });
  assert.equal(await phonePage.getByRole('heading', { level: 1, name: 'Create short browser practice drills' }).isVisible(), true);
  assert.equal(await phonePage.getByRole('link', { name: 'Try it with sample data' }).isVisible(), true);
  const phoneDimensions = await phonePage.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  assert.ok(phoneDimensions.scrollWidth <= phoneDimensions.clientWidth);
  await phonePage.screenshot({ path: `${evidenceDirectory}/live-home-phone.png`, fullPage: true });
  await phonePage.goto(`${origin}/demo?cold=phone-${Date.now()}`, { waitUntil: 'networkidle' });
  assert.equal(await phonePage.getByText('Demo — sample data, nothing is saved', { exact: true }).isVisible(), true);
  assert.equal(await phonePage.locator('.shelf-item').count(), 3);
  await phonePage.screenshot({ path: `${evidenceDirectory}/live-demo-phone.png`, fullPage: true });
  result.phone = { ...phoneDimensions, demoSamples: 3, consoleErrors: phoneConsoleErrors };
  assert.deepEqual(phoneConsoleErrors, []);
  await phone.close();

  const request = await browser.newContext();
  for (const path of ['/', '/demo', '/privacy', '/terms']) {
    const response = await request.request.get(`${origin}${path}`);
    result.routes[path] = response.status();
    assert.equal(response.status(), 200);
  }
  const missing = await request.request.get(`${origin}/repair-2-missing-${Date.now()}`);
  result.routes['unknown'] = missing.status();
  assert.equal(missing.status(), 404);
  assert.match(await missing.text(), /Page not found — Skill Drill Studio/);
  await request.close();
} finally {
  await browser.close();
}

await writeFile(`${evidenceDirectory}/live-check.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
