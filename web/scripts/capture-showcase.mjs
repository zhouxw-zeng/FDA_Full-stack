import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium } from 'playwright-core';

const edgeCandidates = [
  process.env.EDGE_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

const executablePath = edgeCandidates.find((candidate) => existsSync(candidate));
if (!executablePath) {
  throw new Error('未找到 Microsoft Edge。可通过 EDGE_PATH 指定浏览器路径。');
}

const baseUrl = process.env.SHOWCASE_URL ?? 'http://127.0.0.1:5175/showcase/';
const outputDirectory = resolve('public/images');
const screenshotDirectory = resolve('.screenshots');

mkdirSync(outputDirectory, { recursive: true });
mkdirSync(screenshotDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true,
});

try {
  const desktopPage = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
    deviceScaleFactor: 1,
  });
  const consoleErrors = [];
  const failedResponses = [];
  desktopPage.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
      consoleErrors.push(message.text());
    }
  });
  desktopPage.on('response', (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await desktopPage.goto(baseUrl, { waitUntil: 'networkidle' });
  await desktopPage.locator('.moment-card').first().waitFor({ state: 'visible' });
  await desktopPage.locator('.app-window').screenshot({
    path: resolve(outputDirectory, 'product-preview.png'),
  });
  await desktopPage.screenshot({
    path: resolve(outputDirectory, 'product-preview-wide.png'),
    fullPage: false,
  });

  await desktopPage.getByRole('button', { name: 'AI', exact: true }).click();
  await desktopPage.getByText('AI 文案助手', { exact: true }).waitFor();
  await desktopPage.getByPlaceholder('告诉我照片里发生了什么').fill('写一段周末早餐文案');
  await desktopPage.getByRole('button', { name: '生成', exact: true }).click();
  await desktopPage.getByText('可以这样写', { exact: false }).waitFor();

  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  await mobilePage.goto(baseUrl, { waitUntil: 'networkidle' });
  await mobilePage.locator('.moment-card').first().waitFor({ state: 'visible' });
  await mobilePage.screenshot({
    path: resolve(screenshotDirectory, 'showcase-mobile.png'),
    fullPage: true,
  });

  const darkPage = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
    colorScheme: 'dark',
  });
  await darkPage.goto(baseUrl, { waitUntil: 'networkidle' });
  await darkPage.screenshot({
    path: resolve(screenshotDirectory, 'showcase-dark.png'),
    fullPage: false,
  });

  const importantFailures = failedResponses.filter((entry) => !entry.includes('/favicon.ico'));
  if (consoleErrors.length || importantFailures.length) {
    throw new Error(
      `产品演示出现页面错误：\n${[...consoleErrors, ...importantFailures].join('\n')}`,
    );
  }

  console.log('Product screenshot captured:', resolve(outputDirectory, 'product-preview.png'));
  console.log(
    'Wide product screenshot captured:',
    resolve(outputDirectory, 'product-preview-wide.png'),
  );
  console.log('Mobile screenshot captured:', resolve(screenshotDirectory, 'showcase-mobile.png'));
  console.log('Dark screenshot captured:', resolve(screenshotDirectory, 'showcase-dark.png'));
} finally {
  await browser.close();
}
