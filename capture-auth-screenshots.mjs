import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const OUT = '/Users/Akincole/tennvice-screenshots';
await mkdir(OUT, { recursive: true });

const viewports = [
  { name: 'mobile',   width: 390,  height: 844  },
  { name: 'tablet',   width: 768,  height: 1024 },
  { name: 'ipad-pro', width: 1024, height: 1366 },
];

async function loginAndCapture(browser, vp, email, password, pages) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // Log in
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
  await page.waitForTimeout(1200);

  for (const pg of pages) {
    try {
      await page.goto(`http://localhost:3000${pg.path}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1000);
      const file = `${OUT}/${vp.name}-${pg.slug}.png`;
      await page.screenshot({ path: file, fullPage: true });
      console.log(`saved: ${file}`);
    } catch (e) {
      console.log(`skip ${pg.path} (${vp.name}): ${e.message.split('\n')[0]}`);
    }
  }

  await ctx.close();
}

const browser = await chromium.launch();

const adminPages = [
  { slug: 'dashboard',   path: '/dashboard' },
  { slug: 'customers',   path: '/customers' },
  { slug: 'visits',      path: '/visits' },
  { slug: 'technicians', path: '/technicians' },
];

const customerPages = [
  { slug: 'portal',        path: '/portal' },
  { slug: 'portal-visits', path: '/portal/visits' },
];

for (const vp of viewports) {
  await loginAndCapture(browser, vp, 'admin@tennvice.com', 'admin123', adminPages);
}

for (const vp of viewports) {
  await loginAndCapture(browser, vp, 'amelia.brooks@email.com', 'customer123', customerPages);
}

await browser.close();
console.log('done');
