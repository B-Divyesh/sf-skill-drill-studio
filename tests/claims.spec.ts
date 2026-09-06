import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const demoLabel = 'Demo — sample data, nothing is saved';
const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

async function openDemo(page: Page): Promise<void> {
  await page.goto('/demo');
  await expect(page.getByText(demoLabel, { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Try three sample drills' })).toBeVisible();
}

async function openCommandSample(page: Page): Promise<void> {
  await page.locator('[data-play="demo-command"]').first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Create a project folder' })).toBeVisible();
}

test('@claim:deterministic-feedback gives repeatable feedback and a correct result', async ({ page }) => {
  await openDemo(page);
  await openCommandSample(page);
  const answer = page.getByLabel('Your answer');
  await answer.fill('mkdir other-folder');
  await page.getByRole('button', { name: 'Check command' }).click();
  const firstMessage = await page.locator('#feedback p').innerText();
  await page.getByRole('button', { name: 'Check command' }).click();
  await expect(page.locator('#feedback p')).toHaveText(firstMessage);
  await answer.fill('mkdir field-notes');
  await page.getByRole('button', { name: 'Check command' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Correct answer' })).toBeVisible();
  await expect(page.getByText('Completed in 3 attempts.')).toBeVisible();
});

test('@claim:free-no-account creates a drill without an account or payment step', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.getByRole('button', { name: 'Create an ordered drill' }).click();
  await page.getByLabel('Drill title').fill('Start a class projector');
  await page.getByLabel('Learner instructions').fill('Put the startup steps in order.');
  const steps = page.getByRole('textbox', { name: /Step/ });
  await steps.nth(0).fill('Connect the display cable');
  await steps.nth(1).fill('Turn on the projector');
  await steps.nth(2).fill('Select the correct input');
  await page.getByRole('button', { name: 'Save and test' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Start a class projector' })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByText(/sign in|checkout|payment/i)).toHaveCount(0);
});

test('@claim:commands-not-run treats a command-like answer as inert text', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openDemo(page);
  await openCommandSample(page);
  const commandLikeText = "fetch('/claim-command-ran')";
  await page.getByLabel('Your answer').fill(commandLikeText);
  await page.getByRole('button', { name: 'Check command' }).click();
  await expect(page.locator('#feedback')).toContainText('not an exact match');
  await expect(page.getByLabel('Your answer')).toHaveValue(commandLikeText);
  expect(requests.some((url) => url.includes('claim-command-ran'))).toBe(false);
});

test('@claim:browser-storage keeps demo drills, images, and runs separate from real data', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('skill-drill-library', 'real-library-sentinel');
    localStorage.setItem('skill-drill-runs', 'real-runs-sentinel');
  });
  const interactionRequests: string[] = [];
  await openDemo(page);
  page.on('request', (request) => interactionRequests.push(request.url()));
  await page.locator('[data-edit="demo-hotspot"]').click();
  await page.getByLabel('Choose an image').setInputFiles({ name: 'target.png', mimeType: 'image/png', buffer: tinyPng });
  await page.getByRole('button', { name: 'Save and test' }).click();
  await page.locator('[data-play-hotspot]').click({ position: { x: 250, y: 160 } });
  const stored = await page.evaluate(() => ({
    realLibrary: localStorage.getItem('skill-drill-library'),
    realRuns: localStorage.getItem('skill-drill-runs'),
    demoLibrary: localStorage.getItem('demo:skill-drill-library'),
    demoRuns: localStorage.getItem('demo:skill-drill-runs')
  }));
  expect(stored.realLibrary).toBe('real-library-sentinel');
  expect(stored.realRuns).toBe('real-runs-sentinel');
  expect(stored.demoLibrary).toContain('data:image/png;base64');
  expect(stored.demoRuns).not.toBeNull();
  expect(interactionRequests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
  await page.getByRole('button', { name: 'Start for real' }).click();
  const afterExit = await page.evaluate(() => ({ demoLibrary: localStorage.getItem('demo:skill-drill-library'), demoRuns: localStorage.getItem('demo:skill-drill-runs'), realLibrary: localStorage.getItem('skill-drill-library') }));
  expect(afterExit).toEqual({ demoLibrary: null, demoRuns: null, realLibrary: 'real-library-sentinel' });
});

test('@claim:json-sharing exports a portable file that a clean workspace imports', async ({ page }) => {
  await openDemo(page);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-export="demo-command"]').click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const exported = JSON.parse(await readFile(path!, 'utf8'));
  expect(exported).toMatchObject({ schema: 1, kind: 'command', title: 'Create a project folder', answer: 'mkdir field-notes' });
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.locator('#import-file').setInputFiles(path!);
  await expect(page.getByRole('heading', { level: 3, name: 'Create a project folder' }).first()).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('skill-drill-library') ?? '[]'));
  expect(saved).toHaveLength(1);
  expect(saved[0].kind).toBe('command');
});

test('@claim:keyboard-drills completes every drill format with a keyboard', async ({ page }) => {
  await openDemo(page);
  await page.locator('[data-play="demo-ordered"]').click();
  const expected = ['Clean the glass slide', 'Place the sample in the center', 'Add one drop of mounting liquid', 'Lower the cover slip at an angle'];
  for (let targetIndex = 0; targetIndex < expected.length; targetIndex += 1) {
    let current = (await page.locator('.order-list li > span').allTextContents()).indexOf(expected[targetIndex]!);
    while (current > targetIndex) {
      const button = page.getByRole('button', { name: `Move ${expected[targetIndex]} up` });
      await button.focus();
      await page.keyboard.press('Enter');
      current -= 1;
    }
  }
  await page.getByRole('button', { name: 'Check order' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Correct answer' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to drills' }).click();
  await openCommandSample(page);
  await page.getByLabel('Your answer').focus();
  await page.keyboard.type('mkdir field-notes');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Correct answer' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to drills' }).click();
  await page.locator('[data-play="demo-hotspot"]').click();
  const canvas = page.locator('[data-play-hotspot]');
  await canvas.focus();
  for (let index = 0; index < 4; index += 1) await page.keyboard.press('ArrowRight');
  for (let index = 0; index < 4; index += 1) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Correct answer' })).toBeVisible();
});

test('@claim:no-tracking sends no interaction data to analytics or third parties', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openDemo(page);
  await openCommandSample(page);
  await page.getByLabel('Your answer').fill('mkdir field-notes');
  await page.getByRole('button', { name: 'Check command' }).click();
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
  expect(await page.context().cookies()).toEqual([]);
});

test('@claim:image-limits accepts a small PNG and rejects SVG or images over 2 MB', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.locator('[data-new="hotspot"]').click();
  const chooser = page.getByLabel('Choose an image');
  await chooser.setInputFiles({ name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg></svg>') });
  await expect(page.locator('#form-error')).toContainText('PNG, JPEG, or WebP');
  await chooser.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(2_000_001) });
  await expect(page.locator('#form-error')).toContainText('2 MB or smaller');
  await chooser.setInputFiles({ name: 'valid.png', mimeType: 'image/png', buffer: tinyPng });
  await expect(page.locator('[data-author-hotspot] img')).toHaveAttribute('src', /^data:image\/png;base64,/);
});

test('@claim:offline-reload reloads the demo after the first online visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await openDemo(page);
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await page.reload({ waitUntil: 'networkidle' });
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText(demoLabel, { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Try three sample drills' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:three-formats opens ordered-step, exact-command, and image-hotspot drills', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('.shelf-item')).toHaveCount(3);
  await page.locator('[data-play="demo-ordered"]').click();
  await expect(page.getByRole('heading', { name: 'Arrange the steps' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to drills' }).click();
  await page.locator('[data-play="demo-command"]').first().click();
  await expect(page.getByRole('heading', { name: 'Create a directory named field-notes.' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to drills' }).click();
  await page.locator('[data-play="demo-hotspot"]').click();
  await expect(page.getByRole('heading', { name: 'Choose the target' })).toBeVisible();
});
