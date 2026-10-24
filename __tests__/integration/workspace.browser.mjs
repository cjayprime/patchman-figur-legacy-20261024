import maintenance from '../helpers/database-maintenance.cjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path';
import { Sequelize } from 'sequelize';
import '../register.mjs';
const root = fileURLToPath(new URL('../../..', import.meta.url));
const require = createRequire(import.meta.url);
const npm = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const globalRoot = execFileSync(process.execPath, [npm, 'root', '-g'], {
  encoding: 'utf8',
  windowsHide: true,
  env: Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !['npm_config_prefix', 'npm_config_local_prefix'].includes(key.toLowerCase()),
    ),
  ),
}).trim();
const { chromium } = require(path.join(globalRoot, '@playwright/test'));
assert(process.env.npm_execpath, 'Run through npm run test:workspace.');
const stamp = `${process.pid}_${Date.now()}`;
const accountPort = Number(process.env.PATCHMAN_TEST_ACCOUNT_PORT || 3612),
  figurPort = Number(process.env.PATCHMAN_TEST_FIGUR_PORT || 3620);
assert([accountPort, figurPort].every((port) => Number.isInteger(port) && port >= 1024 && port <= 65535));
const accountUrl = `http://127.0.0.1:${accountPort}`,
  figurUrl = `http://127.0.0.1:${figurPort}`;
const serviceKey = 'fixture-figur-private-service-key-'.padEnd(64, 'x');
const cookieName = 'pm_final_workspace_uat';
const avatarUrl = 'https://patchman-avatar.example.test/figur.svg';
const artifacts = path.join(root, 'Figur/__tests__/.artifacts');
await mkdir(artifacts, { recursive: true });
const fixture = await mkdtemp(path.join(artifacts, 'workspace-'));
const databases = [];
let browser,
  page,
  database,
  stage = 'configuration';

async function environment(app) {
  const settings = maintenance.testEnvironment(parseEnv(await readFile(path.join(root, app, '.env'), 'utf8')));
  const name = `patchman_test_${app.toLowerCase()}_workspace_${stamp}`;
  assert.match(name, /^patchman_test_(account|figur)_workspace_[0-9]+_[0-9]+$/);
  assert(['localhost', '127.0.0.1', '::1'].includes(settings.DATABASE_HOST || '127.0.0.1'));
  const admin = new Sequelize(
    '',
    settings.DATABASE_USER || 'root',
    settings.DATABASE_PASSWORD || '',
    maintenance.testDatabaseConfiguration({
      dialect: 'mysql',
      host: settings.DATABASE_HOST || '127.0.0.1',
      port: Number(settings.DATABASE_PORT || 3306),
      logging: false,
      pool: { min: 0, max: 1 },
    }),
  );
  await maintenance.createTestDatabase(admin, name);
  databases.push({ admin, name });
  return {
    ...process.env,
    ...settings,
    NODE_ENV: 'production',
    DATABASE_NAME: name,
    NEXT_PUBLIC_ACCOUNT_URL: accountUrl,
    ACCOUNT_COOKIE_DOMAIN: '',
    ACCOUNT_SESSION_COOKIE_NAME: cookieName,
    APP_ORIGIN: app === 'Account' ? accountUrl : figurUrl,
    PATCHMAN_BUILD_DIR:
      app === 'Account'
        ? process.env.PATCHMAN_TEST_ACCOUNT_BUILD_DIR || '.next-workspace-check'
        : process.env.PATCHMAN_TEST_HOST_BUILD_DIR || '.next-workspace-check',
    ACCOUNT_APP_ORIGINS: JSON.stringify({ account: [accountUrl], figur: [figurUrl] }),
    ACCOUNT_CREDIT_SERVICE_KEYS: JSON.stringify({ figur: serviceKey }),
    ACCOUNT_CREDIT_SERVICE_KEY: serviceKey,
    AD_MEDIATION_NETWORKS: '[]',
    ROCKET_SLOTH_APP_TOKEN: '',
    OFFERWALL_API_KEY: '',
    OFFERWALL_SECRET_KEY: '',
    STRIPE_SECRET_KEY: '',
    SUPERWALL_API_KEY: '',
    NEXT_PUBLIC_SUPERWALL_API_KEY: '',
    SUPERWALL_APP_ID: '',
  };
}
async function server(app, port, env, run) {
  const child = spawn(
    process.execPath,
    [process.env.npm_execpath, 'run', 'start', '--', '--hostname', '127.0.0.1', '--port', String(port)],
    { cwd: path.join(root, app), env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let output = '',
    exited = false;
  child.stdout.on('data', (bytes) => (output += bytes));
  child.stderr.on('data', (bytes) => (output += bytes));
  child.on('exit', () => (exited = true));
  try {
    const end = Date.now() + 60000;
    while (!/ready in/i.test(output)) {
      if (exited || Date.now() > end) {
        throw new Error(`${app} startup failed: ${output}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return await run();
  } finally {
    if (child.pid && !exited) {
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    }
  }
}
async function signup(context, suffix) {
  const login = await context.newPage();
  await login.goto(`${accountUrl}/signin`);
  await login.getByRole('button', { name: 'Create a Patchman account' }).click();
  await login.getByLabel('Email address', { exact: true }).fill(`figur-${suffix}-${randomUUID()}@example.test`);
  await login.getByLabel('Password', { exact: true }).fill(`Figur validation ${randomUUID()}`);
  await login.getByRole('button', { name: 'Create account', exact: true }).click();
  await login.waitForURL((url) => url.pathname === '/onboarding');
  await login.getByLabel('Your name').fill(`Figur ${suffix}`);
  await login.getByRole('button', { name: 'Finish setup' }).click();
  await login.waitForURL((url) => url.pathname !== '/onboarding');
  const cookie = (await context.cookies()).find((item) => item.name === cookieName);
  assert.match(cookie?.value || '', /^[a-f0-9]{64}$/);
  const headers = { Authorization: `Bearer ${cookie.value}` };
  if (suffix === 'owner') {
    await context.route('https://patchman-avatar.example.test/**', (route) =>
      route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#7045ff"/><circle cx="16" cy="16" r="10" fill="#f8f3ff"/></svg>',
      }),
    );
    const profile = await fetch(`${accountUrl}/api/user/profile`, {
      method: 'PATCH',
      headers: { ...headers, Origin: accountUrl, 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: avatarUrl }),
    });
    assert.equal(profile.status, 200);
  }
  const status = await fetch(`${accountUrl}/api/subscription/status?app=figur`, { headers });
  const owner = (await status.json()).data.user.id;
  await login.close();
  return { headers, owner };
}
async function range(id, value) {
  await page.locator(`#${id}`).evaluate((input, next) => {
    input.value = String(next);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}
async function saved() {
  await page.locator('.project-save-state').filter({ hasText: 'PROJECT SAVED' }).waitFor();
  await page.waitForTimeout(100);
}
async function project(id, headers) {
  const response = await fetch(`${figurUrl}/api/projects/${id}`, { headers });
  assert.equal(response.status, 200);
  return (await response.json()).data.project;
}
async function tab(name) {
  await page.locator(`[data-figur-tab="${name}"]`).click();
}
try {
  const accountEnv = await environment('Account'),
    figurEnv = await environment('Figur');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  await server('Account', accountPort, accountEnv, async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } }),
      strangerContext = await browser.newContext();
    const { headers, owner } = await signup(context, 'owner'),
      stranger = await signup(strangerContext, 'stranger');
    await strangerContext.close();
    await server('Figur', figurPort, figurEnv, async () => {
      Object.assign(process.env, figurEnv);
      require('../../lib/database/pool.cjs').configureDatabaseProcess({ role: 'maintenance' });
      const connection = await import('../../lib/sequelize.ts');
      database = connection.sequelize;
      await database.query('ALTER TABLE figur_projects AUTO_INCREMENT = 9007199254740993');
      const { createProject } = await import('../../lib/projects/service.ts');
      for (let i = 0; i < 101; i++) {
        await createProject(owner, `Earlier portrait ${i + 1}`);
      }
      stage = 'root walkthrough and project pagination';
      page = await context.newPage();
      page.setDefaultTimeout(45000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(figurUrl);
      await page.locator('.driver-popover').waitFor();
      await page
        .locator('.driver-popover')
        .getByRole('button', { name: /^skip$/i })
        .click();
      await page.waitForFunction(() => !document.body.classList.contains('driver-active'));
      let chooser = page.getByRole('dialog', { name: 'Your Figur Projects' });
      await chooser.waitFor();
      await chooser.getByRole('button', { name: 'LOAD MORE PROJECTS' }).click();
      await chooser.locator('.project-option').nth(100).waitFor();
      assert.equal(await chooser.locator('.project-option').count(), 101);
      await chooser.getByRole('button', { name: 'NEW PROJECT', exact: true }).click();
      await page.getByLabel('Project Name', { exact: true }).fill('Saved portrait A');
      await page.getByRole('button', { name: 'CREATE & OPEN', exact: true }).click();
      await page.waitForURL((url) => /^\/project\/[1-9][0-9]*$/.test(url.pathname));
      const first = new URL(page.url()).pathname.split('/').pop();
      assert(BigInt(first) > 9007199254740992n);
      await saved();
      stage = 'source, points and workspace autosave';
      const png = await page.evaluate(() => {
        const c = document.createElement('canvas');
        c.width = 320;
        c.height = 480;
        const g = c.getContext('2d');
        g.fillStyle = '#d6aa83';
        g.fillRect(0, 0, 320, 480);
        g.fillStyle = '#296c85';
        g.fillRect(50, 50, 220, 380);
        g.fillStyle = '#f4e9cf';
        g.fillRect(110, 100, 100, 200);
        return c.toDataURL('image/png').split(',')[1];
      });
      await page
        .locator('#file-input')
        .setInputFiles({ name: 'portrait.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
      await page.locator('body.has-photo').waitFor();
      await saved();
      const overlay = page.locator('#overlay'),
        bounds = await overlay.boundingBox();
      await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.mouse.down();
      await page.mouse.move(bounds.x + bounds.width / 2 + 36, bounds.y + bounds.height / 2 - 18, { steps: 6 });
      await page.mouse.up();
      await tab('shape');
      await range('s-waist', 17);
      await range('s-hips', 23);
      await tab('advanced');
      await range('alpha', 1.7);
      await range('radius', 40);
      await tab('compare');
      await page.locator('#split').check();
      await range('split-ratio', 65);
      await saved();
      const before = await project(first, headers);
      assert.equal(before.state.portrait.points.length, 1);
      assert.notEqual(before.state.portrait.points[0].tx, before.state.portrait.points[0].ox);
      assert.equal(before.state.portrait.sliders.waist, 17);
      assert.equal(before.state.portrait.view.splitRatio, 0.65);
      assert.equal(before.state.portrait.options.alpha, 1.7);
      await page.reload();
      await page.locator('body.has-photo').waitFor();
      await saved();
      assert.equal(await page.locator('[data-figur-tab="compare"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#split-ratio').inputValue(), '65');
      await tab('shape');
      assert.equal(await page.locator('#s-waist').inputValue(), '17');
      await saved();
      const restored = await project(first, headers);
      assert.deepEqual(restored.state.portrait, before.state.portrait);
      stage = 'same-route project lifecycle';
      await page.locator('header .shared-projects').click();
      chooser = page.getByRole('dialog', { name: 'Your Figur Projects' });
      await chooser.getByRole('button', { name: 'NEW PROJECT', exact: true }).click();
      await page.getByLabel('Project Name', { exact: true }).fill('Saved portrait B');
      await page.getByRole('button', { name: 'CREATE & OPEN', exact: true }).click();
      await page.waitForURL((url) => url.pathname !== `/project/${first}`);
      const second = new URL(page.url()).pathname.split('/').pop();
      await saved();
      await page.locator('#drop-hint:not(.hidden)').waitFor();
      await page
        .locator('#file-input')
        .setInputFiles({ name: 'second.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
      await page.locator('body.has-photo').waitFor();
      await saved();
      const box = await overlay.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await saved();
      assert.equal((await project(second, headers)).state.portrait.points.length, 1);
      await page.locator('header .shared-projects').click();
      await page.locator(`[data-project-id="${first}"]`).click();
      await page.waitForURL((url) => url.pathname === `/project/${first}`);
      await page.locator('body.has-photo').waitFor();
      await saved();
      assert.deepEqual((await project(first, headers)).state.portrait, before.state.portrait);
      stage = 'export, ownership and central modals';
      await tab('compare');
      const download = page.waitForEvent('download');
      await page.locator('#download').click();
      assert((await download).suggestedFilename().endsWith('.png'));
      assert.equal((await fetch(`${figurUrl}/api/projects/${first}`, { headers: stranger.headers })).status, 404);
      for (const width of [1440, 900, 390, 320]) {
        if (width === 1440 || width === 390) {
          const workspaceUrl = page.url();
          await page.goto('about:blank');
          console.log('Allowing the real request window to reset with browser polling stopped (60 seconds).');
          await new Promise((resolve) => setTimeout(resolve, 60000));
          await page.goto(workspaceUrl);
          await page.waitForFunction(() => Boolean(window.PatchmanAccount));
        }
        await page.setViewportSize({ width, height: 960 });
        await page.waitForTimeout(300);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        const headerControls = await page
          .locator('header [data-patchman-modal]:not(.credit-balance)')
          .evaluateAll((buttons) =>
            buttons.map((button) => {
              const rect = button.getBoundingClientRect();
              return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
            }),
          );
        for (const control of headerControls) {
          assert(control.left >= 0 && control.right <= width, `Header control clipped at ${width}px.`);
          assert.equal(control.width, 32);
          assert.equal(control.height, 32);
        }
        const avatar = page.frameLocator('header iframe[data-patchman-modal="profile"]');
        const thumbnail = avatar.locator('img.thumbnail');
        await thumbnail.waitFor();
        await thumbnail.evaluate((image) => image.decode());
        assert.equal(await thumbnail.getAttribute('src'), avatarUrl);
        assert.equal(Math.round((await thumbnail.boundingBox()).width), 32);
        assert.equal(Math.round((await thumbnail.boundingBox()).height), 32);
        for (const kind of ['ads', 'help', 'profile']) {
          await page.locator(`header [data-patchman-modal="${kind}"]`).last().click();
          const frame = page.frameLocator('#patchman-account-sdk iframe:not(.bridge)');
          await frame.locator('.account-wordmark img').waitFor();
          if (kind === 'profile') {
            await frame.getByRole('heading', { name: 'Figur owner', exact: true }).waitFor();
            await frame.getByRole('region', { name: 'Credit wallet', exact: true }).waitFor();
            assert.equal(await frame.locator('img.portrait').getAttribute('src'), avatarUrl);
          } else {
            await frame
              .getByRole('heading', {
                name: kind === 'ads' ? 'A little watch. A little more possibility.' : 'Find your next step.',
                exact: true,
              })
              .waitFor();
          }
          await frame.getByRole('button', { name: /^Close (modal|account)$/i }).click();
          await page.waitForFunction(() => !window.PatchmanAccount.getActiveModal());
        }
        await page.screenshot({ path: path.join(artifacts, `figur-workspace-${width}.png`), fullPage: true });
      }
      assert.deepEqual(errors, []);
      console.log(
        'PASS Figur real Chrome: Account signup, 101-project pagination, large numeric routes, private source/point/slider/view autosave, refresh and same-route restoration, no duplicate interaction handlers, real PNG export, owner isolation, central modals and four responsive widths.',
      );
    });
    await context.close();
  });
} catch (error) {
  console.error('Figur browser stage:', stage);
  if (page && !page.isClosed()) {
    await page
      .screenshot({ path: path.join(artifacts, 'figur-workspace-failure.png'), fullPage: true })
      .catch(() => null);
  }
  throw error;
} finally {
  if (browser) {
    await browser.close();
  }
  if (database) {
    await database.close();
  }
  for (const { admin, name } of databases.reverse()) {
    assert.match(name, /^patchman_test_(account|figur)_workspace_[0-9]+_[0-9]+$/);
    try {
      await maintenance.dropTestDatabase(admin, name);
    } finally {
      await admin.close();
    }
  }
  assert(fixture.startsWith(artifacts + path.sep) && path.basename(fixture).startsWith('workspace-'));
  await rm(fixture, { recursive: true, force: true });
}
