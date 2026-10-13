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
  { path: '/ai/models', title: 'AI 模型管理', shot: '09-ai-models' },
  { path: '/ai/skills', title: 'Skills 管理', shot: '10-ai-skills' },
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
  await page.screenshot({ path: path.join(OUT_DIR, '13-dark-behavior.png'), fullPage: true });
  console.warn('✓ 深色主题渲染正常');

  // 4. 技能创建链路：填表 → 生成 md → 落库 → 回读 → 清理
  await verifySkillCreation(page);

  // 5. 路由级权限：普通用户访问论坛审批应落到 403
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
    await page.screenshot({ path: path.join(OUT_DIR, '14-forbidden.png'), fullPage: true });
  }

  await context.close();
}

/**
 * 覆盖「输入技能名称/描述/指令 → 生成 skill 模板 md → 调用数据仓保存」这条链路。
 * 用例自带清理，不会在数据库里留下测试数据。
 */
async function verifySkillCreation(page) {
  const skillName = `自动化校验-${Date.now()}`;
  const instruction = '根据输入的图片生成一段不超过 30 字的中文描述。';

  try {
    await page.goto(`${BASE_URL}/ai/skills`, { waitUntil: 'domcontentloaded' });
    await page.locator('.page-header__title').first().waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('button', { name: '新增技能' }).click();

    const dialog = page.locator('.el-dialog');
    await dialog.getByText('填写内容生成模板').click();
    await dialog.getByPlaceholder('例如：图片短描述').fill(skillName);
    await dialog.getByPlaceholder('说明这个技能的适用场景，可留空').fill('自动化验证创建的技能');
    await dialog.getByPlaceholder(/描述技能要做什么/).fill(instruction);
    await page.screenshot({ path: path.join(OUT_DIR, '11-skill-create-dialog.png'), fullPage: true });

    await dialog.getByRole('button', { name: '确认保存' }).click();

    // 列表按 id 升序，用关键词把刚创建的记录筛出来
    await page.getByPlaceholder('搜索技能名称 / 描述').fill(skillName);
    await page.getByRole('button', { name: '查询' }).click();

    const row = page.locator('.el-table__row', { hasText: skillName }).first();
    await row.waitFor({ state: 'visible', timeout: 20000 });
    console.warn('✓ 技能创建成功并出现在列表中');

    // 回读详情，确认写入的是模板 Markdown 而不是空文件
    await row.getByRole('button', { name: '查看' }).click();
    const drawer = page.locator('.el-drawer');
    await drawer.waitFor({ state: 'visible', timeout: 15000 });
    const markdown = (await drawer.locator('.markdown-preview').textContent()) ?? '';
    if (!markdown.includes(`# ${skillName}`) || !markdown.includes('## 执行指令')) {
      problems.push(`技能模板 Markdown 内容不符合预期：${markdown.slice(0, 80)}`);
    } else {
      console.warn('✓ 技能模板 Markdown 已落库并可回读');
    }

    // 文件地址应由本地文件上传接口返回并展示
    const fileUrlText = (await drawer.locator('.skill-detail__url').textContent()) ?? '';
    if (!fileUrlText.includes('/local-files/')) {
      problems.push(`技能详情未展示本地文件地址：${fileUrlText.slice(0, 80)}`);
    } else if (!fileUrlText.includes('/skills.md')) {
      problems.push(`技能文件未按「技能名/skills.md」归档：${fileUrlText.slice(0, 120)}`);
    } else {
      console.warn('✓ 技能已按「技能名/skills.md」归档并保存地址');
    }

    await page.screenshot({ path: path.join(OUT_DIR, '12-skill-detail.png'), fullPage: true });
    await drawer.getByRole('button', { name: '关闭', exact: true }).click();

    // 用 Markdown 编辑器改写内容，提交时应覆盖原文件而不是新增一份
    const marker = `自动化编辑校验-${Date.now()}`;
    await row.getByRole('button', { name: '编辑' }).click();
    const editDialog = page.locator('.el-dialog');
    const editor = editDialog.locator('.md-editor__input');
    await editor.waitFor({ state: 'visible', timeout: 15000 });
    const originalContent = await editor.inputValue();
    await editor.fill(`${originalContent}\n\n${marker}`);
    // 等弹窗淡入动画结束再截图，否则会拍到半透明状态
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, '15-skill-editor.png'), fullPage: true });
    await editDialog.getByRole('button', { name: '确认保存' }).click();
    await page.waitForTimeout(1000);

    await row.getByRole('button', { name: '查看' }).click();
    await drawer.waitFor({ state: 'visible', timeout: 15000 });
    const editedContent = (await drawer.locator('.markdown-preview').textContent()) ?? '';
    const editedUrl = (await drawer.locator('.skill-detail__url').textContent()) ?? '';

    if (!editedContent.includes(marker)) {
      problems.push('编辑器修改的内容没有保存成功');
    } else {
      console.warn('✓ 编辑器内容已保存');
    }
    if (!editedUrl.includes('/skills.md')) {
      problems.push(`覆盖保存后文件地址发生变化：${editedUrl.slice(0, 120)}`);
    } else {
      console.warn('✓ 编辑保存覆盖了原文件（地址未变）');
    }
    await drawer.getByRole('button', { name: '关闭', exact: true }).click();

    // 清理测试数据
    await row.getByRole('button', { name: '删除' }).click();
    await page.locator('.el-message-box').getByRole('button', { name: '删除' }).click();
    await page.waitForTimeout(800);

    const remaining = await page.locator('.el-table__row', { hasText: skillName }).count();
    if (remaining > 0) {
      problems.push('技能删除后仍出现在列表中');
    } else {
      console.warn('✓ 技能删除成功，测试数据已清理');
    }
  } catch (error) {
    await reportPageFailure(page, '技能创建链路', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
