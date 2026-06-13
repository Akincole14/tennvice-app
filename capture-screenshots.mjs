import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

const OUT = '/Users/Akincole/tennvice-screenshots';
await mkdir(OUT, { recursive: true });

const viewports = [
  { name: 'mobile',   width: 390,  height: 844  },  // iPhone 14
  { name: 'tablet',   width: 768,  height: 1024 },  // iPad Mini
  { name: 'ipad-pro', width: 1024, height: 1366 },  // iPad Pro 12.9"
];

const pages = [
  { slug: 'landing',   path: '/' },
  { slug: 'login',     path: '/login' },
  { slug: 'dashboard', path: '/dashboard' },
  { slug: 'portal',    path: '/portal' },
];

const browser = await chromium.launch();

for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

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

await browser.close();
console.log('done');
