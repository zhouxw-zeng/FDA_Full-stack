/**
 * 端到端冒烟验证：用本机已安装的 Chrome / Edge 驱动真实渲染。
 * 前置条件：`pnpm dev` 已在 VITE_PORT（默认 5173）启动。
 *
 *   pnpm smoke
 *
 * 会逐页截图到 .smoke/，并在控制台报错或断言失败时以非 0 退出。
 */
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright-core';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:5173';
const OUT_DIR = path.resolve('.smoke');

const BROWSER_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

const PAGES = [
  { path: '/dashboard', title: '工作台', shot: '01-dashboard' },
  { path: '/forum/approval', title: '论坛信息审批', shot: '02-forum-approval' },
  { path: '/forum/dynamics', title: '论坛动态', shot: '03-forum-dynamics' },
  { path: '/customer/approval', title: 'C 端用户审批', shot: '04-customer-approval' },
  { path: '/advertising/list', title: '广告推广管理', shot: '05-advertising' },
  { path: '/analytics/behavior', title: '用户行为分析', shot: '06-behavior' },
  { path: '/preview/dynamic', title: '动态预览', shot: '07-preview' },
  { path: '/profile', title: '个人信息', shot: '08-profile' },
];

const problems = [];

function findBrowser() {
  const found = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error('未找到 Chrome / Edge，可通过 CHROME_PATH 环境变量指定');
  }
  return found;
}

async function login(page, username, homePath) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入账号').waitFor({ state: 'visible', timeout: 15000 });
  await page.getByPlaceholder('请输入账号').fill(username);
  await page.getByPlaceholder('请输入密码').fill('123456');
  await page.getByRole('button', { name: '登录' }).click();
  // 登录后落点由后端返回的 routeIdGroup 决定，不同角色首页不同
  await page.waitForURL(new RegExp(homePath.replace('/', '\\/')), { timeout: 20000 });
  await page.locator('.page-header__title').first().waitFor({ state: 'visible', timeout: 15000 });
}

async function assertPageTitle(page, expected) {
  const actual = (await page.locator('.page-header__title').first().textContent())?.trim();
  if (actual !== expected) {
    problems.push(`页面标题不符：期望「${expected}」，实际「${actual}」`);
  }
}

async function reportPageFailure(page, label, error) {
  problems.push(`${label} 渲染失败：${error.message}`);
  console.error(`✗ ${label}: ${error.message}`);
  console.error(`  当前地址：${page.url()}`);
  const text = await page
    .evaluate(() => document.body.innerText.slice(0, 600))
    .catch(() => '(无法读取页面文本)');
  console.error(`  可见文本：${String(text).replace(/\s+/g, ' ').slice(0, 400)}`);
  await page
    .screenshot({ path: path.join(OUT_DIR, `FAIL-${label.replace(/\W+/g, '_')}.png`), fullPage: true })
    .catch(() => undefined);
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
  try {
    await runChecks(browser);
  } finally {
    await browser.close().catch(() => undefined);
  }

  if (problems.length > 0) {
    console.error('\n冒烟验证发现问题：');
    for (const problem of problems) {
      console.error(` - ${problem}`);
    }
    process.exitCode = 1;
    return;
  }

  console.warn(`\n全部通过，截图输出目录：${OUT_DIR}`);
}

async function runChecks(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (message) => {
    const type = message.type();
    if (type === 'error') {
      problems.push(`[console] ${message.text()}`);
      console.error(`  [console error] ${message.text()}`);
    } else if (type === 'warning') {
      console.warn(`  [console warn] ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    problems.push(`[pageerror] ${error.message}`);
    console.error(`  [page error] ${error.message}`);
  });
  page.on('requestfailed', (request) => {
    problems.push(`[requestfailed] ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });

  // 1. 登录页
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('请输入账号').waitFor({ state: 'visible', timeout: 15000 });
  await page.screenshot({ path: path.join(OUT_DIR, '00-login.png'), fullPage: true });
  console.warn('✓ 登录页渲染正常');

  // 2. 超级管理员逐页访问
  await login(page, 'admin', '/dashboard');
  for (const item of PAGES) {
    try {
      await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'domcontentloaded' });
      await page
        .locator('.page-header__title')
        .first()
        .waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(600);
      await assertPageTitle(page, item.title);
      await page.screenshot({ path: path.join(OUT_DIR, `${item.shot}.png`), fullPage: true });
      console.warn(`✓ ${item.path} 渲染正常`);
    } catch (error) {
      await reportPageFailure(page, item.path, error);
    }
  }

  // 3. 深色主题
  await page.getByRole('button', { name: '切换主题' }).click();
  await page.waitForTimeout(400);
  await page.goto(`${BASE_URL}/analytics/behavior`, { waitUntil: 'domcontentloaded' });
  await page.locator('.page-header__title').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, '09-dark-behavior.png'), fullPage: true });
  console.warn('✓ 深色主题渲染正常');

  // 4. 路由级权限：广告运营访问论坛审批应落到 403
  // 普通用户只有 routeIdGroup=[13]，登录后应落在个人信息页
  await page.evaluate(() => window.localStorage.clear());
  await login(page, 'user', '/profile');
  await page.goto(`${BASE_URL}/forum/approval`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const forbiddenVisible = await page
    .getByText('当前账号没有访问该页面的权限')
    .isVisible()
    .catch(() => false);
  if (!forbiddenVisible) {
    problems.push('路由权限未生效：普通用户访问 /forum/approval 没有落到 403');
  } else {
    console.warn('✓ 路由权限 403 生效');
    await page.screenshot({ path: path.join(OUT_DIR, '10-forbidden.png'), fullPage: true });
  }

  await context.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
