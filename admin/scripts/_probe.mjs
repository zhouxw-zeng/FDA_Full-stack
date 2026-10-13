import { existsSync } from 'node:fs';

import { chromium } from 'playwright-core';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:5174';
const CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const browser = await chromium.launch({
  executablePath: CANDIDATES.find((item) => existsSync(item)),
  headless: true,
});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

const captured = [];
page.on('request', (request) => {
  if (request.url().includes('/ai/models')) {
    captured.push({ method: request.method(), body: request.postData() });
  }
});
page.on('console', (message) => {
  if (message.type() === 'error') {
    console.error('[console error]', message.text());
  }
});

await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
await page.getByPlaceholder('请输入账号').fill('admin');
await page.getByPlaceholder('请输入密码').fill('123456');
await page.getByRole('button', { name: '登录' }).click();
await page.waitForURL(/\/dashboard/, { timeout: 20000 });

await page.goto(`${BASE_URL}/ai/models`, { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: '新建模型配置' }).click();

const dialog = page.locator('.el-dialog');
const stamp = Date.now();
await dialog.getByPlaceholder('例如 DEEPSEEK', { exact: true }).fill(`PROBE${stamp % 1000}`);
await dialog.getByPlaceholder('例如 DeepSeek', { exact: true }).fill('界面探测');
await dialog.getByPlaceholder('https://api.deepseek.com/v1').fill('https://api.example.com/v1');
await dialog.getByPlaceholder('请输入服务商提供的 API Key').fill('sk-ui-probe-123456');
await dialog.getByPlaceholder('deepseek-chat', { exact: true }).fill('probe-ui');
await dialog.getByPlaceholder('DeepSeek Chat', { exact: true }).fill('界面探测模型');

// 打开关联技能下拉并勾选前两项
const skillSelect = dialog.locator('.el-form-item').filter({ hasText: '关联技能' }).locator('.el-select');
await skillSelect.click();
await page.waitForTimeout(600);
const options = page.locator('.el-select-dropdown').last().locator('.el-select-dropdown__item');
const optionCount = await options.count();
console.log(`关联技能下拉项数量: ${optionCount}`);
if (optionCount > 0) {
  await options.nth(0).click();
}
if (optionCount > 1) {
  await options.nth(1).click();
}
await page.keyboard.press('Escape');

await dialog.getByRole('button', { name: '保存' }).click();
await page.waitForTimeout(1500);

console.log('捕获到的 /ai/models 请求:');
for (const item of captured) {
  console.log(` ${item.method} ${item.body}`);
}

await browser.close();
