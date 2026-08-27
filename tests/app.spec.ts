import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('authors and completes an exact-command drill', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('button', { name: 'Build this drill' }).nth(1).click();
  await page.getByLabel('Drill title').fill('Open the log');
  await page.getByLabel('Learner instructions').fill('Recall the exact command.');
  await page.getByLabel('Prompt').fill('Open today.txt in Vim.');
  await page.getByLabel('Exact accepted answer').fill('vim today.txt');
  const editorA11y = await new AxeBuilder({ page }).analyze();
  expect(editorA11y.violations.filter((issue) => ['serious', 'critical'].includes(issue.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Save & test' }).click();
  await page.getByLabel('Your answer').fill('vim today.txt');
  await page.getByRole('button', { name: 'Check command' }).click();
  await expect(page.getByText('You found the path.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('home and privacy have no automatic serious accessibility violations', async ({ page }) => {
  for (const path of ['/', '/privacy']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((issue) => ['serious', 'critical'].includes(issue.impact ?? ''))).toEqual([]);
  }
});

test('mobile view stays within the viewport and hotspot supports keyboard', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only check');
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await page.getByRole('button', { name: 'Practise' }).nth(2).click();
  const canvas = page.getByRole('button', { name: /Interactive image/ });
  await canvas.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('#feedback')).toContainText(/outside the target|Correct|Route complete/i);
});

test('cached shell returns offline', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only service worker check');
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Build the path');
});
