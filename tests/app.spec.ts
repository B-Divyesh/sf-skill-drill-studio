import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('authors and completes an exact-command drill with focused validation recovery', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.locator('[data-new="command"]').click();
  await page.getByRole('button', { name: 'Save and test' }).click();
  await expect(page.getByLabel('Drill title')).toBeFocused();
  await expect(page.getByLabel('Drill title')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#form-error')).toContainText('Enter the drill title');
  await page.getByLabel('Drill title').fill('Open the log');
  await page.getByLabel('Learner instructions').fill('Recall the exact command.');
  await page.getByLabel('Prompt').fill('Open today.txt in Vim.');
  await page.getByLabel('Exact accepted answer').fill('vim today.txt');
  const editorA11y = await new AxeBuilder({ page }).analyze();
  expect(editorA11y.violations.filter((issue) => ['serious', 'critical'].includes(issue.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Save and test' }).click();
  await page.getByLabel('Your answer').fill('vim today.txt');
  await page.getByRole('button', { name: 'Check command' }).click();
  await expect(page.getByRole('heading', { name: 'Correct answer' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('public routes have one heading and no automatic serious accessibility violations', async ({ page }) => {
  for (const path of ['/', '/demo', '/privacy', '/terms', '/missing-page']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((issue) => ['serious', 'critical'].includes(issue.impact ?? '')), path).toEqual([]);
  }
});

test('route titles, descriptions, canonicals, back navigation, and not-found recovery update', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Skill Drill Studio — create browser practice drills');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://skill-drill-studio.sociobot.in/');
  await page.getByRole('link', { name: 'Privacy' }).first().click();
  await expect(page).toHaveTitle('Privacy — Skill Drill Studio');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://skill-drill-studio.sociobot.in/privacy');
  await page.locator('[data-enter-demo]').evaluate((element: HTMLElement) => element.click());
  await expect(page).toHaveTitle('Demo — Skill Drill Studio');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeFocused();
  await page.goto('/missing-page');
  await expect(page).toHaveTitle('Page not found — Skill Drill Studio');
  await expect(page.getByRole('heading', { level: 1, name: 'This page does not exist' })).toBeVisible();
  await page.getByRole('link', { name: 'Return to Skill Drill Studio' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Create short browser practice drills' })).toBeVisible();
});

test('demo reset restores samples and leaving demo preserves real keys', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('skill-drill-runs', 'real-run-data'));
  await page.goto('/demo');
  await page.locator('[data-play="demo-command"]').first().click();
  await page.getByLabel('Your answer').fill('mkdir field-notes');
  await page.getByRole('button', { name: 'Check command' }).click();
  await page.getByRole('button', { name: 'Back to drills' }).click();
  await expect(page.getByRole('definition').filter({ hasText: '3' })).toHaveCount(3);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Demo reset to the original sample data.')).toBeVisible();
  await expect(page.getByRole('definition').filter({ hasText: '2' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Start for real' }).click();
  expect(await page.evaluate(() => localStorage.getItem('skill-drill-runs'))).toBe('real-run-data');
  expect(await page.evaluate(() => localStorage.getItem('demo:skill-drill-runs'))).toBeNull();
});

test('mobile first screen states the job, audience, action, and facts without overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only check');
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth, height: window.innerHeight }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await expect(page.getByRole('heading', { level: 1, name: 'Create short browser practice drills' })).toBeVisible();
  await expect(page.getByText(/For teachers, instructors, and self-learners/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.locator('.hero-facts')).toBeVisible();
  const facts = await page.locator('.hero-facts').boundingBox();
  expect(facts).not.toBeNull();
  expect(facts!.y).toBeLessThan(dimensions.height);
});

test('hotspot learner and author controls both support keyboard arrows', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only check');
  await page.goto('/demo');
  await page.locator('[data-edit="demo-hotspot"]').click();
  const authorCanvas = page.locator('[data-author-hotspot]');
  await authorCanvas.focus();
  const before = await authorCanvas.getAttribute('aria-label');
  await page.keyboard.press('ArrowLeft');
  await expect(authorCanvas).not.toHaveAttribute('aria-label', before!);
  await page.getByRole('button', { name: 'Close editor' }).click();
  await page.locator('[data-play="demo-hotspot"]').click();
  const learnerCanvas = page.locator('[data-play-hotspot]');
  await learnerCanvas.focus();
  for (let index = 0; index < 4; index += 1) await page.keyboard.press('ArrowRight');
  for (let index = 0; index < 4; index += 1) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Correct answer' })).toBeVisible();
});

test('malformed JSON produces a recoverable error', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Import JSON' }).click();
  await page.locator('#import-file').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.locator('#toast')).toContainText('could not be read');
  await expect(page.getByRole('heading', { level: 1, name: 'Create short browser practice drills' })).toBeVisible();
});

test('focus styling, reduced motion, and a 200 percent equivalent viewport remain usable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only display preference check');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  const focusStyle = await page.getByRole('link', { name: 'Skip to main content' }).evaluate((element) => getComputedStyle(element).outline);
  expect(focusStyle).toContain('3px');
  const transition = await page.getByRole('button', { name: 'Create a drill' }).evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(transition)).toBeLessThanOrEqual(0.01);
  await page.setViewportSize({ width: 640, height: 720 });
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
});
