import { chromium, devices } from "playwright";

const iPhone = devices["iPhone 14"];
const BASE   = "http://localhost:3000";

const browser = await chromium.launch();
const ctx     = await browser.newContext({ ...iPhone });
const page    = await ctx.newPage();

// Login as admin
await page.goto(BASE + "/login");
await page.waitForTimeout(1000);
await page.fill('input[type="email"]',    "admin@tennvice.com");
await page.fill('input[type="password"]', "admin123");
await page.click('button[type="submit"]');
await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/mobile-dashboard.png", fullPage: false });
console.log("dashboard url:", page.url());

await page.goto(BASE + "/customers");
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/mobile-customers.png", fullPage: false });

await page.goto(BASE + "/visits");
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/mobile-visits.png", fullPage: false });

await browser.close();
console.log("done");
